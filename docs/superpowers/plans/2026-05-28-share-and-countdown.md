# Share & Race Day Countdown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a share button with rich og: unfurl and a race day countdown widget to EventPage.

**Architecture:** Two independent additive features on EventPage. Feature 1 adds `buildOgDescription` / `getOgImagePath` utilities + `ShareButton` component + updates `PageMeta` usage on EventPage. Feature 2 adds a pure `RaceDayCountdown` component. Both features use only data already present on EventPage — no new fetches.

**Tech Stack:** React, TypeScript strict, react-helmet-async (already installed), Vitest, plain CSS (BEM), bun

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/lib/og.ts` | **Create** | `buildOgDescription` + `getOgImagePath` utilities |
| `src/lib/og.test.ts` | **Create** | Unit tests for the two utilities |
| `src/components/ShareButton.tsx` | **Create** | "Del" button with clipboard/Web Share API + snackbar |
| `src/components/ShareButton.css` | **Create** | Styles for share button and "Kopiert!" snackbar |
| `src/components/RaceDayCountdown.tsx` | **Create** | Countdown + forecast status widget |
| `src/components/RaceDayCountdown.css` | **Create** | Styles for the countdown banner |
| `src/components/RaceDayCountdown.test.tsx` | **Create** | Unit tests for all display rule branches |
| `src/pages/EventPage.tsx` | **Modify** | Add ShareButton, RaceDayCountdown, dynamic og: tags |
| `src/components/PageMeta.tsx` | **Modify** | Accept optional `ogImage` prop to allow per-page override |
| `public/og/` | **Create** | Static discipline og:images (placeholder PNGs initially) |

---

## Task 1: Utility functions — `src/lib/og.ts`

**Files:**
- Create: `src/lib/og.ts`
- Create: `src/lib/og.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/og.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildOgDescription, getOgImagePath } from "./og";
import type { WeatherData } from "./weather";
import type { Waypoint } from "./weather";

const makeWeather = (tempMax: number, windSpeed: number): WeatherData => ({
  source: "forecast",
  tempMax,
  tempMin: tempMax - 4,
  precipitation: 0,
  windSpeed,
  weatherCode: 1,
});

const waypoints: Waypoint[] = [
  { label: "Start", lat: 60, lon: 10 },
  { label: "Toppen", lat: 61, lon: 11 },
  { label: "Mål", lat: 60.5, lon: 10.5 },
];

describe("buildOgDescription", () => {
  it("returns null when weatherResults is empty", () => {
    expect(buildOgDescription(waypoints, [])).toBeNull();
  });

  it("builds a summary string from waypoint weather", () => {
    const results = [
      { waypoint: waypoints[0], data: makeWeather(12, 3), loading: false, error: null },
      { waypoint: waypoints[1], data: makeWeather(8, 9), loading: false, error: null },
      { waypoint: waypoints[2], data: makeWeather(14, 2), loading: false, error: null },
    ];
    const desc = buildOgDescription(waypoints, results);
    expect(desc).toContain("Start: 12°C");
    expect(desc).toContain("Toppen: 8°C");
    expect(desc).toContain("Mål: 14°C");
  });

  it("skips waypoints with no data", () => {
    const results = [
      { waypoint: waypoints[0], data: makeWeather(12, 3), loading: false, error: null },
      { waypoint: waypoints[1], data: null, loading: true, error: null },
    ];
    const desc = buildOgDescription(waypoints, results);
    expect(desc).toContain("Start: 12°C");
    expect(desc).not.toContain("Toppen");
  });
});

describe("getOgImagePath", () => {
  it("maps landevei to sykkel image", () => {
    expect(getOgImagePath("landevei", "/")).toBe("/og/sykkel.jpg");
  });
  it("maps terreng to sykkel image", () => {
    expect(getOgImagePath("terreng", "/")).toBe("/og/sykkel.jpg");
  });
  it("maps cx to sykkel image", () => {
    expect(getOgImagePath("cx", "/")).toBe("/og/sykkel.jpg");
  });
  it("maps gravel to sykkel image", () => {
    expect(getOgImagePath("gravel", "/")).toBe("/og/sykkel.jpg");
  });
  it("maps langrenn to langrenn image", () => {
    expect(getOgImagePath("langrenn", "/")).toBe("/og/langrenn.jpg");
  });
  it("maps triathlon to triathlon image", () => {
    expect(getOgImagePath("triathlon", "/")).toBe("/og/triathlon.jpg");
  });
  it("maps løping to lop image", () => {
    expect(getOgImagePath("løping", "/")).toBe("/og/lop.jpg");
  });
  it("maps ultraløp to lop image", () => {
    expect(getOgImagePath("ultraløp", "/")).toBe("/og/lop.jpg");
  });
  it("falls back to default for unknown disciplines", () => {
    expect(getOgImagePath("ukjent", "/")).toBe("/og/default.jpg");
  });
  it("prepends baseUrl correctly", () => {
    expect(getOgImagePath("langrenn", "/loypevaer")).toBe("/loypevaer/og/langrenn.jpg");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
bun run test src/lib/og.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/og.ts`**

```ts
import type { Waypoint, WeatherData } from "./weather";

export type WeatherResult = {
  waypoint: Waypoint;
  data: WeatherData | null;
  loading: boolean;
  error: unknown;
};

/**
 * Builds a short weather summary for og:description.
 * Returns null if no weather data is available yet.
 * Example: "Start: 12°C, lett bris · Toppen: 8°C, stiv kuling · Mål: 14°C, svak vind"
 */
export function buildOgDescription(
  waypoints: Waypoint[],
  weatherResults: WeatherResult[]
): string | null {
  const parts: string[] = [];

  for (const result of weatherResults) {
    if (!result.data) continue;
    const temp = Math.round(result.data.hourlyTemp ?? result.data.tempMax);
    const wind = windLabel(result.data.hourlyWindSpeed ?? result.data.windSpeed);
    parts.push(`${result.waypoint.label}: ${temp}°C, ${wind}`);
  }

  if (parts.length === 0) return null;
  return parts.join(" · ");
}

function windLabel(ms: number): string {
  if (ms < 0.3) return "stille";
  if (ms < 1.6) return "flau vind";
  if (ms < 3.4) return "svak vind";
  if (ms < 5.5) return "lett bris";
  if (ms < 8.0) return "laber bris";
  if (ms < 10.8) return "frisk bris";
  if (ms < 13.9) return "liten kuling";
  if (ms < 17.2) return "stiv kuling";
  if (ms < 20.8) return "sterk kuling";
  if (ms < 24.5) return "liten storm";
  if (ms < 28.5) return "full storm";
  return "orkan";
}

/**
 * Returns the path to the static og:image for a discipline.
 * baseUrl should be import.meta.env.BASE_URL (no trailing slash needed).
 */
export function getOgImagePath(discipline: string, baseUrl: string): string {
  const base = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const file = disciplineToOgFile(discipline);
  return `${base}/og/${file}`;
}

function disciplineToOgFile(discipline: string): string {
  switch (discipline) {
    case "landevei":
    case "terreng":
    case "cx":
    case "gravel":
      return "sykkel.jpg";
    case "langrenn":
      return "langrenn.jpg";
    case "triathlon":
      return "triathlon.jpg";
    case "løping":
    case "ultraløp":
      return "lop.jpg";
    default:
      return "default.jpg";
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
bun run test src/lib/og.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/og.ts src/lib/og.test.ts
git commit -m "feat: add og utility functions for share feature"
```

---

## Task 2: Static og:images

**Files:**
- Create: `public/og/sykkel.jpg`, `public/og/langrenn.jpg`, `public/og/triathlon.jpg`, `public/og/lop.jpg`, `public/og/default.jpg`

These are static images used as fallback og:image for social unfurls. For now create minimal placeholder images — they should be 1200×630px (standard og:image size). Use the existing `public/web-app-manifest-512x512.png` as a reference for the brand style.

- [ ] **Step 1: Create placeholder og images**

Create the `public/og/` directory and copy the existing app icon as a temporary placeholder for all five images:

```bash
mkdir -p public/og
cp public/web-app-manifest-512x512.png public/og/sykkel.jpg
cp public/web-app-manifest-512x512.png public/og/langrenn.jpg
cp public/web-app-manifest-512x512.png public/og/triathlon.jpg
cp public/web-app-manifest-512x512.png public/og/lop.jpg
cp public/web-app-manifest-512x512.png public/og/default.jpg
```

Note: These are placeholder PNGs with a .jpg extension — sufficient for testing. Replace with proper 1200×630 JPEG images before shipping.

- [ ] **Step 2: Commit**

```bash
git add public/og/
git commit -m "feat: add placeholder og:images for discipline share cards"
```

---

## Task 3: `PageMeta` — accept optional `ogImage` override

**Files:**
- Modify: `src/components/PageMeta.tsx`

- [ ] **Step 1: Add `ogImage` prop**

Read the current file, then update it:

```tsx
import { Helmet } from "react-helmet-async";
import { SITE_URL } from "../lib/seo";

const DEFAULT_OG_IMAGE = `${SITE_URL}/web-app-manifest-512x512.png`;

type Props = {
  title: string;
  description: string;
  canonicalUrl: string;
  /** Defaults to "website" */
  ogType?: "website" | "article";
  /** Override the default og:image. Must be an absolute URL. */
  ogImage?: string;
};

/**
 * Renders the standard set of SEO meta tags shared across all pages:
 * - <title>
 * - meta description
 * - canonical link
 * - Open Graph: type, url, title, description, locale, image
 * - Twitter card: summary_large_image, title, description, image
 *
 * Page-specific extras (keywords, ld+json, etc.) should be added in a
 * separate <Helmet> block in the page component.
 */
export function PageMeta({ title, description, canonicalUrl, ogType = "website", ogImage }: Props) {
  const image = ogImage ?? DEFAULT_OG_IMAGE;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:locale" content="nb_NO" />
      <meta property="og:image" content={image} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}
```

- [ ] **Step 2: Verify build still passes**

```bash
bun run build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/PageMeta.tsx
git commit -m "feat: add optional ogImage prop to PageMeta"
```

---

## Task 4: `ShareButton` component

**Files:**
- Create: `src/components/ShareButton.tsx`
- Create: `src/components/ShareButton.css`

- [ ] **Step 1: Create `ShareButton.css`**

```css
.share-button {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs, 0.25rem);
  padding: var(--space-xs, 0.25rem) var(--space-sm, 0.5rem);
  border: 1px solid currentColor;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  font-size: 0.875rem;
  color: inherit;
  transition: opacity 0.15s;
}

.share-button:hover {
  opacity: 0.75;
}

.share-button__icon {
  width: 1em;
  height: 1em;
}

.share-snackbar {
  position: fixed;
  bottom: var(--space-lg, 1.5rem);
  left: 50%;
  transform: translateX(-50%);
  background: #222;
  color: #fff;
  padding: var(--space-xs, 0.25rem) var(--space-md, 1rem);
  border-radius: 4px;
  font-size: 0.9rem;
  pointer-events: none;
  animation: share-snackbar-in 0.2s ease;
  z-index: 1000;
}

@keyframes share-snackbar-in {
  from { opacity: 0; transform: translateX(-50%) translateY(8px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}
```

- [ ] **Step 2: Create `ShareButton.tsx`**

```tsx
import { useState } from "react";
import "./ShareButton.css";

type Props = {
  url: string;
  label?: string;
};

export function ShareButton({ url, label = "Del" }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ url });
        return;
      } catch {
        // User cancelled or API unavailable — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard API unavailable (non-https, old browser) — silent fail
    }
  }

  return (
    <>
      <button className="share-button" onClick={() => void handleShare()} aria-label={label}>
        <svg className="share-button__icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M11 2.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM5 5.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM11 8.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM8.5 6.5l-3 2M8.5 9.5l-3-2" />
        </svg>
        {label}
      </button>
      {copied && <div className="share-snackbar" role="status" aria-live="polite">Kopiert!</div>}
    </>
  );
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
bun run build 2>&1 | grep -E "error|ShareButton"
```

Expected: no errors mentioning ShareButton.

- [ ] **Step 4: Commit**

```bash
git add src/components/ShareButton.tsx src/components/ShareButton.css
git commit -m "feat: add ShareButton component with clipboard and Web Share API"
```

---

## Task 5: `RaceDayCountdown` component

**Files:**
- Create: `src/components/RaceDayCountdown.tsx`
- Create: `src/components/RaceDayCountdown.css`
- Create: `src/components/RaceDayCountdown.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/RaceDayCountdown.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { RaceDayCountdown } from "./RaceDayCountdown";

function renderCountdown(selectedDate: string, tempMax = 12, windSpeed = 4) {
  const weather = selectedDate
    ? {
        source: "forecast" as const,
        tempMax,
        tempMin: tempMax - 4,
        precipitation: 0,
        windSpeed,
        weatherCode: 1,
      }
    : null;
  return render(<RaceDayCountdown selectedDate={selectedDate} startWaypointWeather={weather} />);
}

describe("RaceDayCountdown", () => {
  const RealDate = Date;

  function mockToday(dateStr: string) {
    const fixed = new Date(dateStr);
    vi.spyOn(globalThis, "Date").mockImplementation((arg?: unknown) => {
      if (arg === undefined) return fixed;
      return new RealDate(arg as string | number);
    });
    (globalThis.Date as unknown as { now: () => number }).now = () => fixed.getTime();
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders nothing when selectedDate is empty", () => {
    const { container } = render(<RaceDayCountdown selectedDate="" startWaypointWeather={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when event is in the past", () => {
    mockToday("2025-06-15");
    const { container } = renderCountdown("2025-06-14");
    expect(container.firstChild).toBeNull();
  });

  it("shows today message when event is today", () => {
    mockToday("2025-06-14");
    renderCountdown("2025-06-14");
    expect(screen.getByText(/i dag/i)).toBeDefined();
  });

  it("shows 1 dag (singular) when event is tomorrow", () => {
    mockToday("2025-06-13");
    renderCountdown("2025-06-14");
    expect(screen.getByText(/1 dag til start/i)).toBeDefined();
  });

  it("shows days count when event is within forecast range", () => {
    mockToday("2025-06-01");
    renderCountdown("2025-06-14");
    expect(screen.getByText(/13 dager til start/i)).toBeDefined();
    expect(screen.getByText(/Prognose klar/i)).toBeDefined();
  });

  it("shows climate note when event is beyond 16 days", () => {
    mockToday("2025-05-01");
    renderCountdown("2025-06-14");
    expect(screen.getByText(/dager til start/i)).toBeDefined();
    expect(screen.getByText(/Prognose tilgjengelig/i)).toBeDefined();
  });

  it("shows start waypoint temp and wind when forecast is available", () => {
    mockToday("2025-06-01");
    renderCountdown("2025-06-14", 11, 4);
    expect(screen.getByText(/11°C/)).toBeDefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
bun run test src/components/RaceDayCountdown.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `RaceDayCountdown.css`**

```css
.race-day-countdown {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs, 0.25rem);
  padding: var(--space-sm, 0.5rem) var(--space-md, 1rem);
  border-left: 3px solid var(--color-accent, #0070f3);
  background: var(--color-surface-alt, #f5f5f5);
  border-radius: 4px;
  font-size: 0.9rem;
  margin-bottom: var(--space-md, 1rem);
}

.race-day-countdown__days {
  font-weight: 600;
}

.race-day-countdown__status {
  color: var(--color-muted, #555);
}

.race-day-countdown__status--ready {
  color: var(--color-success, #217a3c);
  font-weight: 500;
}
```

- [ ] **Step 4: Create `RaceDayCountdown.tsx`**

```tsx
import "./RaceDayCountdown.css";
import type { WeatherData } from "../lib/weather";
import { isForecastRange } from "../lib/weather";

type Props = {
  selectedDate: string;
  startWaypointWeather: WeatherData | null;
};

export function RaceDayCountdown({ selectedDate, startWaypointWeather }: Props) {
  if (!selectedDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const raceDate = new Date(selectedDate);
  raceDate.setHours(0, 0, 0, 0);

  const diffMs = raceDate.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return null;

  if (diffDays === 0) {
    return (
      <div className="race-day-countdown">
        <span className="race-day-countdown__days">Det er i dag!</span>
        <span className="race-day-countdown__status">Lykke til!</span>
      </div>
    );
  }

  const daysLabel = diffDays === 1 ? "1 dag til start" : `${diffDays} dager til start`;
  const forecastAvailable = isForecastRange(selectedDate);

  let statusText: string;
  let statusClass = "race-day-countdown__status";

  if (forecastAvailable) {
    const summary = startWaypointWeather
      ? buildStartSummary(startWaypointWeather)
      : "";
    statusText = `Prognose klar!${summary ? `  –  Start: ${summary}` : ""}`;
    statusClass += " race-day-countdown__status--ready";
  } else {
    const daysUntilForecast = diffDays - 16;
    statusText = `Prognose tilgjengelig om ca. ${daysUntilForecast} dager`;
  }

  return (
    <div className="race-day-countdown">
      <span className="race-day-countdown__days">{daysLabel}</span>
      <span className={statusClass}>{statusText}</span>
    </div>
  );
}

function buildStartSummary(weather: WeatherData): string {
  const temp = Math.round(weather.hourlyTemp ?? weather.tempMax);
  const wind = windLabel(weather.hourlyWindSpeed ?? weather.windSpeed);
  return `${temp}°C, ${wind}`;
}

function windLabel(ms: number): string {
  if (ms < 0.3) return "stille";
  if (ms < 1.6) return "flau vind";
  if (ms < 3.4) return "svak vind";
  if (ms < 5.5) return "lett bris";
  if (ms < 8.0) return "laber bris";
  if (ms < 10.8) return "frisk bris";
  if (ms < 13.9) return "liten kuling";
  if (ms < 17.2) return "stiv kuling";
  if (ms < 20.8) return "sterk kuling";
  if (ms < 24.5) return "liten storm";
  if (ms < 28.5) return "full storm";
  return "orkan";
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
bun run test src/components/RaceDayCountdown.test.tsx
```

Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/RaceDayCountdown.tsx src/components/RaceDayCountdown.css src/components/RaceDayCountdown.test.tsx
git commit -m "feat: add RaceDayCountdown component"
```

---

## Task 6: Wire everything into `EventPage`

**Files:**
- Modify: `src/pages/EventPage.tsx`

This task wires ShareButton, RaceDayCountdown, and the dynamic og: tags into EventPage.

- [ ] **Step 1: Read current EventPage.tsx**

Read `src/pages/EventPage.tsx` fully before editing.

- [ ] **Step 2: Add imports**

At the top of the file, add:

```tsx
import { ShareButton } from "../components/ShareButton";
import { RaceDayCountdown } from "../components/RaceDayCountdown";
import { buildOgDescription, getOgImagePath } from "../lib/og";
import type { WeatherResult } from "../lib/og";
```

- [ ] **Step 3: Compute og values**

In the component body, after `weatherResults` is available (from `useWeather` or wherever the results array comes from), add:

```tsx
const ogDescription =
  buildOgDescription(waypoints, weatherResults as WeatherResult[]) ??
  `${rittData.name} – værmeldingen langs løypa`;

const ogImage = `${SITE_URL}${getOgImagePath(rittData.discipline, import.meta.env.BASE_URL)}`;

const shareUrl = (() => {
  const url = new URL(window.location.href);
  // Include date param only — start/finish are too personal for sharing
  if (selectedDate) {
    url.searchParams.set("date", selectedDate);
  } else {
    url.searchParams.delete("date");
  }
  url.searchParams.delete("start");
  url.searchParams.delete("finish");
  return url.toString();
})();
```

- [ ] **Step 4: Update PageMeta call**

Find the existing `<PageMeta ... />` call in EventPage and add the `ogImage` and updated `description` props:

```tsx
<PageMeta
  title={pageTitle}
  description={ogDescription}
  canonicalUrl={canonicalUrl}
  ogType="website"
  ogImage={ogImage}
/>
```

(Replace existing `<PageMeta>` — keep the `canonicalUrl` and `pageTitle` variables as they are currently computed.)

- [ ] **Step 5: Add ShareButton to the event header**

Find the section in EventPage that renders the event name / meta info (the header area). Add the ShareButton after the event title or meta row:

```tsx
<ShareButton url={shareUrl} />
```

- [ ] **Step 6: Add RaceDayCountdown above WeatherStrip**

Find where `<WeatherStrip ... />` is rendered in EventPage. Add the countdown immediately before it:

```tsx
<RaceDayCountdown
  selectedDate={selectedDate}
  startWaypointWeather={weatherResults[0]?.data ?? null}
/>
<WeatherStrip ... />
```

(`weatherResults[0]` is the first waypoint — the start. Use whatever variable holds the weather results array in EventPage.)

- [ ] **Step 7: Verify TypeScript and lint**

```bash
bun run lint && bun run build
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/pages/EventPage.tsx
git commit -m "feat: wire ShareButton, RaceDayCountdown, and dynamic og tags into EventPage"
```

---

## Task 7: Full verification

- [ ] **Step 1: Run full test suite**

```bash
bun run lint && bun run test && bun run build
```

Expected: lint clean, all tests pass, build succeeds.

- [ ] **Step 2: Manual smoke test**

```bash
bun run dev
```

Open an event page (e.g. `/arrangement/birkebeinerrittet`):
- Click "Del" button → "Kopiert!" snackbar appears
- Set a date within 16 days → RaceDayCountdown shows "X dager til start" + "Prognose klar!"
- Set a date > 16 days away → shows "Prognose tilgjengelig om ca. N dager"
- Clear the date → countdown hidden

- [ ] **Step 3: Final commit if any fixups needed**

```bash
git add -A
git commit -m "fix: address review feedback from smoke test"
```

---

## Notes

- The `windLabel` function is duplicated in `og.ts` and `RaceDayCountdown.tsx`. If this bothers you, extract it to `src/lib/wind.ts` (check if a similar function already exists there first before adding).
- The og:images in `public/og/` are placeholder copies of the app icon. Replace with proper 1200×630 JPEG images for the final product — the functionality is complete regardless.
- `isForecastRange` is already exported from `src/lib/weather.ts` — use it, don't reimplement.
- `SITE_URL` is already exported from `src/lib/seo.ts`.
