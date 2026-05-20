# Climate Storytelling Badge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a per-waypoint Norwegian climate storytelling badge ("Vått og blåsende", "Historisk kaldt", etc.) at the bottom of each `WeatherCard`, derived from the 10-year `historicalByYear` data already in `weather-cache.json`.

**Architecture:** A pure classification function (`climateStory.ts`) reads up to 10 historical year-entries for a waypoint+date and returns a Norwegian label. `WeatherStrip` extracts those entries from the already-loaded weather cache and passes them to `WeatherCard` as a new prop. `WeatherCard` renders a small `ClimateHistoryBadge` component below a divider.

**Tech Stack:** TypeScript (strict), React, Vitest, existing `weather-cache.json` (no new API calls)

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/lib/climateStory.ts` | **Create** | Pure classification function |
| `src/lib/climateStory.test.ts` | **Create** | Unit tests for all 8 label combinations |
| `src/lib/weather.ts` | **Modify** | Add `getHistoricalYears()` helper |
| `src/components/ClimateHistoryBadge.tsx` | **Create** | Badge UI component |
| `src/components/WeatherCard.tsx` | **Modify** | Accept + render `historicalYears` prop |
| `src/components/WeatherCard.test.tsx` | **Modify** | Test badge renders/absent |
| `src/components/WeatherStrip.tsx` | **Modify** | Load cache, extract years, pass to WeatherCard |
| `src/index.css` | **Modify** | Styles for divider + badge |

---

## Task 1: Pure classification function (`climateStory.ts`)

**Files:**
- Create: `src/lib/climateStory.ts`
- Create: `src/lib/climateStory.test.ts`

### Step 1.1 — Write the failing tests

Create `src/lib/climateStory.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { getClimateStoryLabel } from "./climateStory";
import type { ClimateStoryInput } from "./climateStory";

function makeYears(count: number, precip: number, windSpeed: number, tempMax: number): ClimateStoryInput {
  return Array.from({ length: count }, () => ({ precipitation: precip, windSpeed, tempMax }));
}

describe("getClimateStoryLabel", () => {
  it("returns 'Typisk regnvær' when rain dominates", () => {
    const years = makeYears(10, 2, 5, 15);
    expect(getClimateStoryLabel(years)).toBe("Typisk regnvær");
  });

  it("returns 'Kjent for kraftig vind' when wind dominates", () => {
    const years = makeYears(10, 0, 25, 15);
    expect(getClimateStoryLabel(years)).toBe("Kjent for kraftig vind");
  });

  it("returns 'Historisk kaldt' when cold dominates", () => {
    const years = makeYears(10, 0, 5, 3);
    expect(getClimateStoryLabel(years)).toBe("Historisk kaldt");
  });

  it("returns 'Vått og blåsende' for rain+wind", () => {
    const years = makeYears(10, 2, 25, 15);
    expect(getClimateStoryLabel(years)).toBe("Vått og blåsende");
  });

  it("returns 'Kaldt og vått' for rain+cold", () => {
    const years = makeYears(10, 2, 5, 3);
    expect(getClimateStoryLabel(years)).toBe("Kaldt og vått");
  });

  it("returns 'Kaldt og blåsende' for wind+cold", () => {
    const years = makeYears(10, 0, 25, 3);
    expect(getClimateStoryLabel(years)).toBe("Kaldt og blåsende");
  });

  it("returns 'Krevende forhold' when all three dominate", () => {
    const years = makeYears(10, 2, 25, 3);
    expect(getClimateStoryLabel(years)).toBe("Krevende forhold");
  });

  it("returns 'Variert vær' when nothing dominates", () => {
    const years = makeYears(10, 0, 5, 15);
    expect(getClimateStoryLabel(years)).toBe("Variert vær");
  });

  it("returns 'Variert vær' for empty input", () => {
    expect(getClimateStoryLabel([])).toBe("Variert vær");
  });

  it("uses ≥5/10 threshold: 5 rainy years triggers rain label", () => {
    const rainy = makeYears(5, 2, 5, 15);
    const dry = makeYears(5, 0, 5, 15);
    expect(getClimateStoryLabel([...rainy, ...dry])).toBe("Typisk regnvær");
  });

  it("uses ≥5/10 threshold: 4 rainy years does NOT trigger rain label", () => {
    const rainy = makeYears(4, 2, 5, 15);
    const dry = makeYears(6, 0, 5, 15);
    expect(getClimateStoryLabel([...rainy, ...dry])).toBe("Variert vær");
  });
});
```

- [ ] Write the test file above to `src/lib/climateStory.test.ts`

### Step 1.2 — Run tests, confirm they fail

```bash
bun run test src/lib/climateStory.test.ts
```

Expected: `Cannot find module './climateStory'`

- [ ] Run the command and confirm failure

### Step 1.3 — Implement `climateStory.ts`

Create `src/lib/climateStory.ts`:

```ts
import { PRECIP_LIGHT, WIND_STRONG, TEMP_VERY_COLD } from "./weatherThresholds";

export type ClimateStoryEntry = {
  precipitation: number;
  windSpeed: number;
  tempMax: number;
};

export type ClimateStoryInput = ClimateStoryEntry[];

const MAJORITY = 0.5; // ≥50% of years = dominant

export function getClimateStoryLabel(years: ClimateStoryInput): string {
  if (years.length === 0) return "Variert vær";

  const n = years.length;
  const rainCount = years.filter((y) => y.precipitation > PRECIP_LIGHT).length;
  const windCount = years.filter((y) => y.windSpeed > WIND_STRONG).length;
  const coldCount = years.filter((y) => y.tempMax < TEMP_VERY_COLD).length;

  const rain = rainCount / n >= MAJORITY;
  const wind = windCount / n >= MAJORITY;
  const cold = coldCount / n >= MAJORITY;

  if (rain && wind && cold) return "Krevende forhold";
  if (rain && wind)         return "Vått og blåsende";
  if (rain && cold)         return "Kaldt og vått";
  if (wind && cold)         return "Kaldt og blåsende";
  if (rain)                 return "Typisk regnvær";
  if (wind)                 return "Kjent for kraftig vind";
  if (cold)                 return "Historisk kaldt";
  return "Variert vær";
}
```

- [ ] Write the implementation file above to `src/lib/climateStory.ts`

### Step 1.4 — Run tests, confirm they pass

```bash
bun run test src/lib/climateStory.test.ts
```

Expected: all 12 tests pass

- [ ] Run and confirm

### Step 1.5 — Commit

```bash
git add src/lib/climateStory.ts src/lib/climateStory.test.ts
git commit -m "feat: add climate story classification function"
```

- [ ] Commit

---

## Task 2: `getHistoricalYears` helper in `weather.ts`

**Files:**
- Modify: `src/lib/weather.ts`

The `WeatherCacheData` type is local to `weather.ts`. We need to export a helper that accepts the cache data (or fetches it) and extracts `ClimateStoryInput` for a waypoint+date combination.

### Step 2.1 — Locate the right place in `weather.ts`

The file has `WeatherCacheData` type at line ~3 and `getWeatherCache()` at line ~10. Add the helper after `getWeatherCache`.

### Step 2.2 — Add the helper

In `src/lib/weather.ts`, after the `getWeatherCache` function (after line ~17), add:

```ts
import type { ClimateStoryInput } from "./climateStory";

/**
 * Extracts up to 10 historical year-entries for a waypoint + calendar date
 * from the already-loaded weather cache, for use in climate storytelling.
 *
 * @param cache - The loaded WeatherCacheData object
 * @param lat - Waypoint latitude
 * @param lon - Waypoint longitude
 * @param date - ISO date string "YYYY-MM-DD"
 */
export function getHistoricalYears(
  cache: WeatherCacheData,
  lat: number,
  lon: number,
  date: string
): ClimateStoryInput {
  const [, , mm, dd] = date.split("-");
  const years: ClimateStoryInput = [];
  for (let y = 2015; y <= 2024; y++) {
    const key = `${lat},${lon},${mm},${dd},${y}`;
    const entry = cache.historicalByYear[key];
    if (entry) {
      years.push({
        precipitation: entry.precipitation,
        windSpeed: entry.windSpeed,
        tempMax: entry.tempMax,
      });
    }
  }
  return years;
}
```

Note: the import for `ClimateStoryInput` must be added at the top of the file alongside existing imports.

- [ ] Add the import for `ClimateStoryInput` at the top of `src/lib/weather.ts`
- [ ] Add the `getHistoricalYears` function after `getWeatherCache` in `src/lib/weather.ts`

### Step 2.3 — Run lint + build to confirm no type errors

```bash
bun run lint && bun run build
```

Expected: no errors

- [ ] Run and confirm

### Step 2.4 — Commit

```bash
git add src/lib/weather.ts
git commit -m "feat: add getHistoricalYears helper to weather lib"
```

- [ ] Commit

---

## Task 3: `ClimateHistoryBadge` component

**Files:**
- Create: `src/components/ClimateHistoryBadge.tsx`

### Step 3.1 — Create the component

```tsx
import type { ClimateStoryInput } from "../lib/climateStory";
import { getClimateStoryLabel } from "../lib/climateStory";

type Props = {
  years: ClimateStoryInput;
};

export function ClimateHistoryBadge({ years }: Props) {
  const label = getClimateStoryLabel(years);
  return (
    <div className="climate-history-badge">
      <span className="climate-history-badge__prefix">Historisk</span>
      <span className="climate-history-badge__pill">{label}</span>
    </div>
  );
}
```

- [ ] Write the file to `src/components/ClimateHistoryBadge.tsx`

### Step 3.2 — Add styles to `src/index.css`

Append to `src/index.css`:

```css
/* ── Climate History Badge ───────────────────────────── */
.weather-card__climate-divider {
  border: none;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  margin: 0.5rem 0 0.35rem;
}

.climate-history-badge {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.7rem;
}

.climate-history-badge__prefix {
  color: var(--color-text-muted, #888);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.climate-history-badge__pill {
  background: rgba(0, 0, 0, 0.07);
  color: var(--color-text-muted, #666);
  border-radius: 999px;
  padding: 0.1rem 0.5rem;
  font-weight: 500;
}
```

- [ ] Append the CSS block to `src/index.css`

### Step 3.3 — Commit

```bash
git add src/components/ClimateHistoryBadge.tsx src/index.css
git commit -m "feat: add ClimateHistoryBadge component and styles"
```

- [ ] Commit

---

## Task 4: Wire `historicalYears` into `WeatherCard`

**Files:**
- Modify: `src/components/WeatherCard.tsx`
- Modify: `src/components/WeatherCard.test.tsx`

### Step 4.1 — Add prop and render badge

In `src/components/WeatherCard.tsx`:

1. Add import at top:
```ts
import { ClimateHistoryBadge } from "./ClimateHistoryBadge";
import type { ClimateStoryInput } from "../lib/climateStory";
```

2. Add `historicalYears` to the `Props` type:
```ts
type Props = {
  waypoint: Waypoint;
  data: WeatherData | undefined;
  isLoading: boolean;
  isError: boolean;
  arrivalTime?: string;
  routeBearing?: number;
  onClick?: () => void;
  date?: string | null;
  /** Historical year-entries for climate storytelling badge. */
  historicalYears?: ClimateStoryInput;
};
```

3. Destructure the new prop in the `WeatherCard` function:
```ts
export const WeatherCard = memo(function WeatherCard({
  waypoint,
  data,
  isLoading,
  isError,
  arrivalTime,
  routeBearing,
  onClick,
  date,
  historicalYears,
}: Props) {
```

4. Add the badge after the `{data && <WeatherCardContent ... />}` block (around line 246), before the hourly toggle:
```tsx
{historicalYears && historicalYears.length > 0 && (
  <>
    <hr className="weather-card__climate-divider" />
    <ClimateHistoryBadge years={historicalYears} />
  </>
)}
```

- [ ] Apply all four changes to `src/components/WeatherCard.tsx`

### Step 4.2 — Add tests to `WeatherCard.test.tsx`

Open `src/components/WeatherCard.test.tsx` and add two tests. First check its current content to find where to add them, then add:

```tsx
import { ClimateHistoryBadge } from "./ClimateHistoryBadge";

// Inside the describe block, add:
it("renders ClimateHistoryBadge when historicalYears is provided", () => {
  const years = Array.from({ length: 10 }, () => ({
    precipitation: 2,
    windSpeed: 25,
    tempMax: 3,
  }));
  render(
    <WeatherCard
      waypoint={{ label: "Test", lat: 60, lon: 10 }}
      data={undefined}
      isLoading={false}
      isError={false}
      historicalYears={years}
    />
  );
  expect(screen.getByText("Historisk")).toBeInTheDocument();
  expect(screen.getByText("Krevende forhold")).toBeInTheDocument();
});

it("does not render ClimateHistoryBadge when historicalYears is absent", () => {
  render(
    <WeatherCard
      waypoint={{ label: "Test", lat: 60, lon: 10 }}
      data={undefined}
      isLoading={false}
      isError={false}
    />
  );
  expect(screen.queryByText("Historisk")).not.toBeInTheDocument();
});
```

- [ ] Read `src/components/WeatherCard.test.tsx` to understand existing test setup, then add the two tests

### Step 4.3 — Run tests

```bash
bun run test src/components/WeatherCard.test.tsx
```

Expected: all tests pass

- [ ] Run and confirm

### Step 4.4 — Commit

```bash
git add src/components/WeatherCard.tsx src/components/WeatherCard.test.tsx
git commit -m "feat: add historicalYears prop and ClimateHistoryBadge to WeatherCard"
```

- [ ] Commit

---

## Task 5: Wire data through `WeatherStrip`

**Files:**
- Modify: `src/components/WeatherStrip.tsx`

`WeatherStrip` has access to `waypoints` and `date`. It needs to load the weather cache and pass `historicalYears` per waypoint to each `WeatherCard`.

### Step 5.1 — Update `WeatherStrip.tsx`

Replace the file content with:

```tsx
import { useWeather, type WeatherResult } from "../hooks/useWeather";
import { isForecastRange, getWeatherCache, getHistoricalYears } from "../lib/weather";
import { WeatherCard } from "./WeatherCard";
import type { Waypoint } from "../lib/weather";
import { calcWaypointTimes, formatArrivalTime } from "../lib/timing";
import { routeBearingForWaypoint } from "../lib/wind";
import { useEffect, useState } from "react";
import type { ClimateStoryInput } from "../lib/climateStory";

type WeatherCacheData = {
  climateAverages: Record<string, { precipitation: number; windSpeed: number; tempMax: number }>;
  historicalByYear: Record<string, { precipitation: number; windSpeed: number; tempMax: number }>;
};

type Props = {
  waypoints: Waypoint[];
  date: string | null;
  startTime?: string | null;
  finishTime?: string | null;
  externalResults?: WeatherResult[];
  onWaypointClick?: (waypoint: Waypoint, index: number) => void;
};

export function WeatherStrip({ waypoints, date, startTime, finishTime, externalResults, onWaypointClick }: Props) {
  const timingActive =
    date != null &&
    startTime != null &&
    startTime !== "" &&
    finishTime != null &&
    finishTime !== "";

  const n = waypoints.length;
  const dynamicFractions = Array.from(
    { length: n },
    (_, i) => (n === 1 ? 0 : i / (n - 1))
  );

  const datetimes = timingActive
    ? calcWaypointTimes(date, startTime, finishTime, dynamicFractions)
    : null;

  const internalResults = useWeather(externalResults ? [] : waypoints, date, datetimes);
  const results = externalResults ?? internalResults;

  const mode =
    date == null
      ? null
      : isForecastRange(date)
      ? "forecast"
      : "climate-average";

  const [historicalYearsPerWaypoint, setHistoricalYearsPerWaypoint] = useState<ClimateStoryInput[]>([]);

  useEffect(() => {
    if (!date) {
      setHistoricalYearsPerWaypoint([]);
      return;
    }
    getWeatherCache().then((cache) => {
      const all = waypoints.map((wp) =>
        getHistoricalYears(cache, wp.lat, wp.lon, date)
      );
      setHistoricalYearsPerWaypoint(all);
    }).catch(() => {
      setHistoricalYearsPerWaypoint([]);
    });
  }, [waypoints, date]);

  return (
    <div className="weather-strip">
      {date && (
        <div className="weather-strip__banner">
          {mode === "forecast"
            ? "Viser værvarsel fra Open-Meteo (opptil 16 dager)"
            : "Viser klimagjennomsnitt (historiske data 2015–2024)"}
          {timingActive && " · Vær ved forventet ankomsttid"}
        </div>
      )}
      <div className="weather-strip__cards">
        {results.map(({ waypoint, data, isLoading, isError }, i) => (
          <WeatherCard
            key={`${waypoint.lat}-${waypoint.lon}`}
            waypoint={waypoint}
            data={data}
            isLoading={isLoading}
            isError={isError}
            arrivalTime={datetimes ? formatArrivalTime(datetimes[i]) : undefined}
            routeBearing={routeBearingForWaypoint(waypoints, i) ?? undefined}
            onClick={onWaypointClick ? () => onWaypointClick(waypoint, i) : undefined}
            date={date}
            historicalYears={historicalYearsPerWaypoint[i]}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] Write the updated `WeatherStrip.tsx`

### Step 5.2 — Run full lint + test + build

```bash
bun run lint && bun run test && bun run build
```

Expected: all pass, no type errors

- [ ] Run and confirm all three pass

### Step 5.3 — Commit

```bash
git add src/components/WeatherStrip.tsx
git commit -m "feat: wire historicalYears into WeatherStrip for climate storytelling"
```

- [ ] Commit

---

## Task 6: Visual verification

### Step 6.1 — Run dev server and manually inspect

```bash
bun run dev
```

- Open an event page with waypoints (e.g. `/arrangement/birkebeinerrennet`)
- Select a date (any date — near or far)
- Confirm each WeatherCard shows a divider and a "Historisk [label]" badge at the bottom
- Confirm the forecast data above the divider is unchanged

- [ ] Manually verify in browser

### Step 6.2 — Final full check

```bash
bun run lint && bun run test && bun run build
```

- [ ] All three pass

---

## Self-Review Notes

- All 8 label combinations are tested in Task 1
- Edge cases (empty input, threshold boundary) are tested
- `getHistoricalYears` uses the same cache promise already initiated by `getWeatherCache`, so no extra network requests
- `WeatherCacheData` type is duplicated in `WeatherStrip.tsx` — acceptable since the original is unexported; could be exported in a follow-up if needed
- The `useEffect` in `WeatherStrip` re-runs if `waypoints` array reference changes — callers that recreate the array on every render may cause extra cache reads (all in-memory, no network). Acceptable for v1.
