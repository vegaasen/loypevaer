# Hourly Breakdown — Sparse Yr Data UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide zero-filled sentinel rows in the "Time for time" hourly breakdown table when Yr only has 6-hourly data, and show a Norwegian explanatory note when fewer than 24 real entries are available.

**Architecture:** Add a `hasData: boolean` flag to `HourlyEntry` in `weather.ts`. The `fetchYrHourlyBreakdown` function sets `hasData: false` on zero-filled sentinel rows (hours Yr has no measurement for) and `hasData: true` on real entries. All other backends (`fetchForecastHourlyBreakdown`, `fetchClimateAverageHourlyBreakdown`) always set `hasData: true`. `HourlyBreakdown` filters to only render rows where `hasData` is true, and prepends a note when the entry list was trimmed.

**Tech Stack:** TypeScript strict, React, Vitest

---

### Task 1: Add `hasData` flag to `HourlyEntry` and mark sentinel rows in `fetchYrHourlyBreakdown`

**Files:**
- Modify: `src/lib/weather.ts` (type `HourlyEntry` ~line 798, `fetchYrHourlyBreakdown` ~line 432, `fetchForecastHourlyBreakdown` ~line 843, `fetchClimateAverageHourlyBreakdown` ~line 897)

- [ ] **Step 1: Write the failing test**

Add to `src/lib/weather.yr.test.ts` — in the existing `describe("fetchHourlyBreakdown — Yr path (0-9 days)")` block, add after the last `it(...)`:

```typescript
it("marks sentinel rows (hours with no Yr data) as hasData: false", async () => {
  // Default mock returns 24 hourly entries, so all should have hasData: true.
  // We override with a 6-hourly (sparse) mock to produce sentinel rows.
  server.use(
    http.get("https://api.met.no/weatherapi/locationforecast/2.0/compact", () => {
      // Only UTC 00, 06, 12, 18 → Oslo 02, 08, 14, 20 in summer
      const today = new Date();
      const d1 = new Date(today);
      d1.setUTCDate(d1.getUTCDate() + 1);
      const d1Utc = d1.toISOString().split("T")[0];
      const sparse = [0, 6, 12, 18].map((h) => ({
        time: `${d1Utc}T${String(h).padStart(2, "0")}:00:00Z`,
        data: {
          instant: { details: { air_temperature: 10, wind_speed: 5, wind_from_direction: 270 } },
          next_6_hours: {
            summary: { symbol_code: "partlycloudy_day" },
            details: { air_temperature_max: 15, air_temperature_min: 8, precipitation_amount: 0.6 },
          },
        },
      }));
      return HttpResponse.json({ properties: { timeseries: sparse } });
    })
  );

  const entries = await fetchHourlyBreakdown(waypoint, YR_DATE);
  expect(entries).toHaveLength(24);

  // Only hours 02, 08, 14, 20 (Oslo) should be real — the rest are sentinels
  const realEntries = entries.filter((e) => e.hasData);
  expect(realEntries).toHaveLength(4);

  const sentinelEntries = entries.filter((e) => !e.hasData);
  expect(sentinelEntries).toHaveLength(20);

  // Real entry should have non-zero temperature
  expect(realEntries[0].temp).not.toBe(0);

  // Sentinel entry should have zero temperature and zero wind
  expect(sentinelEntries[0].temp).toBe(0);
  expect(sentinelEntries[0].windSpeed).toBe(0);
});
```

Also add a `afterEach(() => { server.resetHandlers(); })` after this test if the describe block doesn't already have one (the existing describe block doesn't — add it):

```typescript
afterEach(() => {
  server.resetHandlers();
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
bun run test src/lib/weather.yr.test.ts
```

Expected: FAIL — `e.hasData` is `undefined` (property doesn't exist yet).

- [ ] **Step 3: Add `hasData` to the `HourlyEntry` type**

In `src/lib/weather.ts`, find the `HourlyEntry` type (~line 798) and add the field:

```typescript
export type HourlyEntry = {
  hour: number;
  hasData: boolean;        // true = real measurement; false = no Yr data for this hour
  temp: number;
  feelsLike?: number;
  precipitation: number;
  precipitationProbability?: number;
  windSpeed: number;
  windDirection?: number;
  weatherCode: number;
};
```

- [ ] **Step 4: Set `hasData: false` on sentinel rows in `fetchYrHourlyBreakdown`**

In `src/lib/weather.ts`, find `fetchYrHourlyBreakdown` (~line 432). Change the sentinel return and the real-data return:

```typescript
async function fetchYrHourlyBreakdown(waypoint: Waypoint, date: string): Promise<HourlyEntry[]> {
  const entries = await fetchYrTimeseries(waypoint, date);

  return Array.from({ length: 24 }, (_, hour) => {
    const item = entries.find((e) => toOsloHour(e.time) === hour);

    if (!item) {
      return {
        hour,
        hasData: false,
        temp: 0,
        precipitation: 0,
        windSpeed: 0,
        weatherCode: 0,
      };
    }

    const instant = item.data.instant.details;
    const next1 = item.data.next_1_hours;
    const next6 = item.data.next_6_hours;
    const symbolCode = next1?.summary.symbol_code ?? next6?.summary.symbol_code ?? "";
    const precip = next1?.details.precipitation_amount ?? (next6 ? next6.details.precipitation_amount / 6 : 0);

    return {
      hour,
      hasData: true,
      temp: instant.air_temperature,
      precipitation: Math.round(precip * 10) / 10,
      precipitationProbability: next1?.details.probability_of_precipitation,
      windSpeed: Math.round(instant.wind_speed * 3.6 * 10) / 10,
      windDirection: instant.wind_from_direction,
      weatherCode: symbolCode ? yrSymbolToWmo(symbolCode) : 0,
    };
  });
}
```

- [ ] **Step 5: Set `hasData: true` in `fetchForecastHourlyBreakdown`**

In `src/lib/weather.ts`, find `fetchForecastHourlyBreakdown` (~line 827). Its `Array.from({ length: 24 }, ...)` return map needs `hasData: true` added to each entry:

```typescript
return Array.from({ length: 24 }, (_, hour) => ({
  hour,
  hasData: true,
  temp: h.temperature_2m[hour] ?? 0,
  feelsLike: h.apparent_temperature[hour] ?? undefined,
  precipitation: h.precipitation[hour] ?? 0,
  precipitationProbability: h.precipitation_probability?.[hour] ?? undefined,
  windSpeed: h.wind_speed_10m[hour] ?? 0,
  windDirection: h.wind_direction_10m[hour] ?? undefined,
  weatherCode: h.weather_code[hour] ?? 0,
}));
```

- [ ] **Step 6: Set `hasData: true` in `fetchClimateAverageHourlyBreakdown`**

In `src/lib/weather.ts`, find `fetchClimateAverageHourlyBreakdown` (~line 897). Its `Array.from({ length: 24 }, ...)` return object needs `hasData: true`:

```typescript
return {
  hour,
  hasData: true,
  temp: avgAt((r, h) => r.hourly.temperature_2m[h], hour),
  feelsLike: avgAt((r, h) => r.hourly.apparent_temperature[h], hour) || undefined,
  precipitation: avgAt((r, h) => r.hourly.precipitation[h], hour),
  windSpeed: avgAt((r, h) => r.hourly.wind_speed_10m[h], hour),
  windDirection: Math.round(avgAt((r, h) => r.hourly.wind_direction_10m[h], hour)),
  weatherCode,
};
```

- [ ] **Step 7: Run all tests**

```bash
bun run test src/lib/weather.yr.test.ts
```

Expected: all tests PASS.

- [ ] **Step 8: Run full suite to catch TypeScript errors from the new required field**

```bash
bun run lint && bun run test && bun run build
```

Expected: all pass. If `build` fails with TypeScript errors like `Property 'hasData' is missing`, find the relevant `HourlyEntry` literal construction sites and add `hasData: true` (they'll be in test fixtures or mock data).

- [ ] **Step 9: Commit**

```bash
git add src/lib/weather.ts src/lib/weather.yr.test.ts
git commit -m "feat: add hasData flag to HourlyEntry to distinguish real vs sentinel Yr rows"
```

---

### Task 2: Filter sentinel rows and show sparse-data note in `HourlyBreakdown`

**Files:**
- Modify: `src/components/HourlyBreakdown.tsx`
- Modify: `src/components/HourlyBreakdown.test.tsx`

- [ ] **Step 1: Read the existing test file to understand fixture shape**

Open `src/components/HourlyBreakdown.test.tsx` and note the shape of the `entries` fixture used there. It will need `hasData` added to each entry.

- [ ] **Step 2: Write the failing tests**

In `src/components/HourlyBreakdown.test.tsx`, add a new describe block. First, update any existing entry fixtures to include `hasData: true` (the TypeScript compiler will enforce this — the build step in Task 1 will surface these). Then add:

```typescript
describe("HourlyBreakdown with sparse Yr data", () => {
  it("only renders rows where hasData is true", () => {
    const entries: HourlyEntry[] = [
      { hour: 2,  hasData: true,  temp: 8.4, precipitation: 0, windSpeed: 9.7, weatherCode: 3 },
      { hour: 3,  hasData: false, temp: 0,   precipitation: 0, windSpeed: 0,   weatherCode: 0 },
      { hour: 4,  hasData: false, temp: 0,   precipitation: 0, windSpeed: 0,   weatherCode: 0 },
      { hour: 8,  hasData: true,  temp: 11.5,precipitation: 0, windSpeed: 7.2, weatherCode: 3 },
      { hour: 9,  hasData: false, temp: 0,   precipitation: 0, windSpeed: 0,   weatherCode: 0 },
    ];
    render(<HourlyBreakdown entries={entries} />);
    // Only 2 data rows should appear (02:00 and 08:00)
    expect(screen.getAllByRole("row").length).toBe(3); // 1 header + 2 data rows
  });

  it("shows sparse-data note when some entries have hasData: false", () => {
    const entries: HourlyEntry[] = [
      { hour: 2,  hasData: true,  temp: 8.4, precipitation: 0, windSpeed: 9.7, weatherCode: 3 },
      { hour: 3,  hasData: false, temp: 0,   precipitation: 0, windSpeed: 0,   weatherCode: 0 },
    ];
    render(<HourlyBreakdown entries={entries} />);
    expect(screen.getByText(/6-timers oppløsning/i)).toBeInTheDocument();
  });

  it("does not show sparse-data note when all entries have hasData: true", () => {
    const entries: HourlyEntry[] = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      hasData: true,
      temp: 10,
      precipitation: 0,
      windSpeed: 5,
      weatherCode: 1,
    }));
    render(<HourlyBreakdown entries={entries} />);
    expect(screen.queryByText(/6-timers oppløsning/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
bun run test src/components/HourlyBreakdown.test.tsx
```

Expected: FAIL — row count wrong (still 6 rows), note text not found.

- [ ] **Step 4: Update `HourlyBreakdown.tsx` to filter and add note**

Replace the full contents of `src/components/HourlyBreakdown.tsx`:

```typescript
import type { HourlyEntry } from "../lib/weather";
import { describeWeatherCode } from "../lib/wmo";
import { degreesToCompass } from "../lib/wind";

type Props = {
  entries: HourlyEntry[];
};

function formatHour(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function HourlyBreakdown({ entries }: Props) {
  const realEntries = entries.filter((e) => e.hasData);
  const isSparse = realEntries.length < entries.length;

  return (
    <div className="hourly-breakdown">
      {isSparse && (
        <p className="hourly-breakdown__sparse-note">
          Yr har kun 6-timers oppløsning for denne datoen — viser kun tilgjengelige tidspunkter.
        </p>
      )}
      <table className="hourly-breakdown__table">
        <thead>
          <tr>
            <th className="hourly-breakdown__th">Tid</th>
            <th className="hourly-breakdown__th">Vær</th>
            <th className="hourly-breakdown__th">Temp</th>
            <th className="hourly-breakdown__th">Nedbør</th>
            <th className="hourly-breakdown__th">Vind</th>
          </tr>
        </thead>
        <tbody>
          {realEntries.map((entry) => {
            const { emoji } = describeWeatherCode(entry.weatherCode);
            const windDir =
              entry.windDirection !== undefined
                ? degreesToCompass(entry.windDirection)
                : null;
            return (
              <tr key={entry.hour} className="hourly-breakdown__row">
                <td className="hourly-breakdown__td hourly-breakdown__td--hour">
                  {formatHour(entry.hour)}
                </td>
                <td className="hourly-breakdown__td hourly-breakdown__td--icon">
                  {emoji}
                </td>
                <td className="hourly-breakdown__td hourly-breakdown__td--temp">
                  {entry.temp}°
                  {entry.feelsLike != null && (
                    <span className="hourly-breakdown__feels-like">
                      {" "}({entry.feelsLike}°)
                    </span>
                  )}
                </td>
                <td className="hourly-breakdown__td hourly-breakdown__td--precip">
                  {entry.precipitation} mm
                  {entry.precipitationProbability != null && (
                    <span className="hourly-breakdown__prob">
                      {" "}· {entry.precipitationProbability}%
                    </span>
                  )}
                </td>
                <td className="hourly-breakdown__td hourly-breakdown__td--wind">
                  {entry.windSpeed} km/t
                  {windDir && (
                    <span className="hourly-breakdown__wind-dir"> · {windDir}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 5: Add CSS for the sparse note**

In `src/index.css`, find the `.hourly-breakdown` block (~line 3416) and add after the existing `.hourly-breakdown` rules (before the next unrelated block):

```css
.hourly-breakdown__sparse-note {
  font-size: 11px;
  color: var(--text);
  opacity: 0.7;
  margin: 0 0 6px 0;
  font-style: italic;
}
```

- [ ] **Step 6: Run component tests**

```bash
bun run test src/components/HourlyBreakdown.test.tsx
```

Expected: all tests PASS.

- [ ] **Step 7: Run full suite**

```bash
bun run lint && bun run test && bun run build
```

Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add src/components/HourlyBreakdown.tsx src/components/HourlyBreakdown.test.tsx src/index.css
git commit -m "feat: hide sentinel rows and show sparse-data note in hourly breakdown"
```
