# Growth Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four independent features that increase organic discovery and return visits for Norwegian amateur athletes: PWA install prompt, forecast change alerts, event-specific SEO climate narrative, and a range-aware gear/packing tool.

**Architecture:** All features are client-side only — no backend. PWA install prompt captures the `beforeinstallprompt` browser event. Forecast alerts use the browser Notification API with localStorage snapshots (notifications fire on next app open, not server-push). SEO narrative is generated at render time from the already-loaded `weather-cache.json`. The gear/packing tool extends the existing `GearSuggestion` component with range-aware logic.

**Tech Stack:** React 19, TypeScript (strict), Vitest + Testing Library + MSW, vite-plugin-pwa (already configured), localStorage, browser Notification API.

---

## File Map

| File | Change |
|---|---|
| `src/hooks/useInstallPrompt.ts` | Create |
| `src/components/InstallBanner.tsx` | Create |
| `src/App.tsx` | Modify — add `<InstallBanner />` |
| `src/lib/alertDiff.ts` | Create |
| `src/hooks/useWeatherAlerts.ts` | Create |
| `src/components/AlertsOptIn.tsx` | Create |
| `src/pages/EventPage.tsx` | Modify — add `<AlertsOptIn />`, ld+json, climate narrative |
| `src/lib/climateNarrative.ts` | Create |
| `src/lib/packingList.ts` | Create |
| `src/components/PackingList.tsx` | Create |
| `src/components/GearSuggestion.tsx` | Modify — range-aware advice + `<PackingList />` |
| `src/index.css` | Modify — styles for InstallBanner, AlertsOptIn, PackingList |
| `src/test/handlers.ts` | Modify — add weather-cache mock with data for narrative tests |

---

## Task 1: PWA install prompt hook

**Files:**
- Create: `src/hooks/useInstallPrompt.ts`
- Create: `src/hooks/__tests__/useInstallPrompt.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/hooks/__tests__/useInstallPrompt.test.ts
import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useInstallPrompt } from "../useInstallPrompt";

describe("useInstallPrompt", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("canInstall is false initially", () => {
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.canInstall).toBe(false);
  });

  it("canInstall becomes true when beforeinstallprompt fires", () => {
    const { result } = renderHook(() => useInstallPrompt());
    const event = new Event("beforeinstallprompt") as BeforeInstallPromptEvent;
    (event as unknown as Record<string, unknown>).prompt = vi.fn().mockResolvedValue({ outcome: "accepted" });
    act(() => {
      window.dispatchEvent(event);
    });
    expect(result.current.canInstall).toBe(true);
  });

  it("canInstall is false when pwa-install-dismissed is set", () => {
    localStorage.setItem("pwa-install-dismissed", "1");
    const { result } = renderHook(() => useInstallPrompt());
    const event = new Event("beforeinstallprompt") as BeforeInstallPromptEvent;
    (event as unknown as Record<string, unknown>).prompt = vi.fn().mockResolvedValue({ outcome: "accepted" });
    act(() => {
      window.dispatchEvent(event);
    });
    expect(result.current.canInstall).toBe(false);
  });

  it("promptInstall calls prompt() on the deferred event", async () => {
    const { result } = renderHook(() => useInstallPrompt());
    const mockPrompt = vi.fn().mockResolvedValue({ outcome: "accepted" });
    const event = new Event("beforeinstallprompt") as BeforeInstallPromptEvent;
    (event as unknown as Record<string, unknown>).prompt = mockPrompt;
    act(() => {
      window.dispatchEvent(event);
    });
    await act(async () => {
      await result.current.promptInstall();
    });
    expect(mockPrompt).toHaveBeenCalled();
  });

  it("dismiss sets localStorage and clears canInstall", () => {
    const { result } = renderHook(() => useInstallPrompt());
    const event = new Event("beforeinstallprompt") as BeforeInstallPromptEvent;
    (event as unknown as Record<string, unknown>).prompt = vi.fn().mockResolvedValue({ outcome: "dismissed" });
    act(() => {
      window.dispatchEvent(event);
    });
    act(() => {
      result.current.dismiss();
    });
    expect(localStorage.getItem("pwa-install-dismissed")).toBe("1");
    expect(result.current.canInstall).toBe(false);
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
bun run test src/hooks/__tests__/useInstallPrompt.test.ts
```

Expected: FAIL — `useInstallPrompt` does not exist.

- [ ] **Step 3: Create the hook**

```ts
// src/hooks/useInstallPrompt.ts
import { useState, useEffect, useRef, useCallback } from "react";

// BeforeInstallPromptEvent is not in the standard TypeScript lib
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "pwa-install-dismissed";

export function useInstallPrompt() {
  const deferred = useRef<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return;

    function handler(e: Event) {
      e.preventDefault();
      deferred.current = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    }

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferred.current) return;
    await deferred.current.prompt();
    deferred.current = null;
    setCanInstall(false);
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISSED_KEY, "1");
    deferred.current = null;
    setCanInstall(false);
  }, []);

  return { canInstall, promptInstall, dismiss };
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
bun run test src/hooks/__tests__/useInstallPrompt.test.ts
```

Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useInstallPrompt.ts src/hooks/__tests__/useInstallPrompt.test.ts
git commit -m "feat: add useInstallPrompt hook"
```

---

## Task 2: InstallBanner component

**Files:**
- Create: `src/components/InstallBanner.tsx`
- Modify: `src/index.css` — banner styles
- Modify: `src/App.tsx` — render banner

- [ ] **Step 1: Create the component**

```tsx
// src/components/InstallBanner.tsx
import { useInstallPrompt } from "../hooks/useInstallPrompt";

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandaloneMode(): boolean {
  return "standalone" in navigator && (navigator as unknown as Record<string, unknown>).standalone === true;
}

export function InstallBanner() {
  const { canInstall, promptInstall, dismiss } = useInstallPrompt();

  const showIosBanner = isIos() && !isInStandaloneMode() && !canInstall;

  if (!canInstall && !showIosBanner) return null;

  if (showIosBanner) {
    return (
      <div className="install-banner install-banner--ios" role="banner">
        <span className="install-banner__text">
          Trykk Del ⬆ → <strong>Legg til på hjemskjermen</strong> for raskere tilgang
        </span>
        <button
          className="install-banner__dismiss"
          aria-label="Lukk"
          onClick={dismiss}
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="install-banner" role="banner">
      <div className="install-banner__content">
        <span className="install-banner__text">
          <strong>Legg til Løypevær på hjemskjermen</strong>
          <span className="install-banner__sub"> — raskere tilgang og støtte for værvarsler</span>
        </span>
        <div className="install-banner__actions">
          <button className="install-banner__cta" onClick={() => void promptInstall()}>
            Legg til
          </button>
          <button className="install-banner__dismiss" aria-label="Lukk" onClick={dismiss}>
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add CSS to `src/index.css`**

Open `src/index.css` and append at the end:

```css
/* ── Install banner ──────────────────────────────────────────────────── */
.install-banner {
  background: var(--color-green-dark, #1a3300);
  color: #fff;
  padding: 0.6rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.875rem;
}

.install-banner__content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.install-banner__sub {
  opacity: 0.8;
}

.install-banner__actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-shrink: 0;
}

.install-banner__cta {
  background: #fff;
  color: var(--color-green-dark, #1a3300);
  border: none;
  border-radius: 4px;
  padding: 0.3rem 0.8rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
}

.install-banner__dismiss {
  background: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.2rem 0.4rem;
  opacity: 0.7;
  line-height: 1;
}

.install-banner__dismiss:hover {
  opacity: 1;
}

.install-banner--ios .install-banner__text {
  flex: 1;
}
```

- [ ] **Step 3: Mount in `App.tsx`**

In `src/App.tsx`, add the import and place `<InstallBanner />` directly after `<NavBar />`:

Find this block in `RouterContent`:
```tsx
      <ScrollToTop />
      <NavBar />
      <Suspense fallback={<div className="page-loading" aria-label="Laster…" />}>
```

Replace with:
```tsx
      <ScrollToTop />
      <NavBar />
      <InstallBanner />
      <Suspense fallback={<div className="page-loading" aria-label="Laster…" />}>
```

Also add the import at the top of the file alongside the other component imports:
```tsx
import { InstallBanner } from "./components/InstallBanner";
```

- [ ] **Step 4: Run lint + build to confirm no type errors**

```bash
bun run lint && bun run build
```

Expected: success, no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/InstallBanner.tsx src/App.tsx src/index.css
git commit -m "feat: add PWA install banner"
```

---

## Task 3: Alert diff pure logic

**Files:**
- Create: `src/lib/alertDiff.ts`
- Create: `src/lib/__tests__/alertDiff.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/__tests__/alertDiff.test.ts
import { describe, expect, it } from "vitest";
import { hasSignificantChange, type WeatherSnapshot } from "../alertDiff";

const base: WeatherSnapshot = {
  tempMax: 10,
  precipProbability: 20,
  windSpeed: 5,
};

describe("hasSignificantChange", () => {
  it("returns false when nothing has changed", () => {
    expect(hasSignificantChange(base, { ...base })).toEqual({
      changed: false,
      summary: "",
    });
  });

  it("detects temperature drop > 4°C", () => {
    const result = hasSignificantChange(base, { ...base, tempMax: 5 });
    expect(result.changed).toBe(true);
    expect(result.summary).toContain("temperatur");
  });

  it("detects temperature rise > 4°C", () => {
    const result = hasSignificantChange(base, { ...base, tempMax: 15 });
    expect(result.changed).toBe(true);
    expect(result.summary).toContain("temperatur");
  });

  it("detects precipitation probability jump > 25pp", () => {
    const result = hasSignificantChange(base, { ...base, precipProbability: 50 });
    expect(result.changed).toBe(true);
    expect(result.summary).toContain("nedbør");
  });

  it("detects wind speed jump > 5 m/s", () => {
    const result = hasSignificantChange(base, { ...base, windSpeed: 11 });
    expect(result.changed).toBe(true);
    expect(result.summary).toContain("vind");
  });

  it("does not trigger on small changes", () => {
    expect(hasSignificantChange(base, { ...base, tempMax: 13 }).changed).toBe(false);
    expect(hasSignificantChange(base, { ...base, precipProbability: 40 }).changed).toBe(false);
    expect(hasSignificantChange(base, { ...base, windSpeed: 9 }).changed).toBe(false);
  });

  it("mentions multiple changes in summary", () => {
    const result = hasSignificantChange(base, {
      tempMax: 4,
      precipProbability: 60,
      windSpeed: 12,
    });
    expect(result.changed).toBe(true);
    expect(result.summary).toContain("temperatur");
    expect(result.summary).toContain("nedbør");
    expect(result.summary).toContain("vind");
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
bun run test src/lib/__tests__/alertDiff.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `alertDiff.ts`**

```ts
// src/lib/alertDiff.ts

export type WeatherSnapshot = {
  /** Daily max temperature in °C */
  tempMax: number;
  /** Precipitation probability 0–100 */
  precipProbability: number;
  /** Wind speed in m/s */
  windSpeed: number;
};

type DiffResult = {
  changed: boolean;
  summary: string;
};

const TEMP_THRESHOLD = 4;       // °C
const PRECIP_THRESHOLD = 25;    // percentage points
const WIND_THRESHOLD = 5;       // m/s

export function hasSignificantChange(
  prev: WeatherSnapshot,
  next: WeatherSnapshot
): DiffResult {
  const parts: string[] = [];

  const tempDiff = Math.abs(next.tempMax - prev.tempMax);
  if (tempDiff > TEMP_THRESHOLD) {
    const dir = next.tempMax < prev.tempMax ? "falt" : "steget";
    parts.push(
      `Temperaturen har ${dir} ${Math.round(tempDiff)}°C — nå ${Math.round(next.tempMax)}°C`
    );
  }

  const precipDiff = Math.abs(next.precipProbability - prev.precipProbability);
  if (precipDiff > PRECIP_THRESHOLD) {
    const dir = next.precipProbability > prev.precipProbability ? "økt" : "sunket";
    parts.push(
      `Nedbørssannsynlighet har ${dir} til ${Math.round(next.precipProbability)}%`
    );
  }

  const windDiff = Math.abs(next.windSpeed - prev.windSpeed);
  if (windDiff > WIND_THRESHOLD) {
    const dir = next.windSpeed > prev.windSpeed ? "økt" : "avtatt";
    parts.push(`Vinden har ${dir} til ${Math.round(next.windSpeed)} m/s`);
  }

  if (parts.length === 0) {
    return { changed: false, summary: "" };
  }

  return { changed: true, summary: parts.join(". ") + "." };
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
bun run test src/lib/__tests__/alertDiff.test.ts
```

Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/alertDiff.ts src/lib/__tests__/alertDiff.test.ts
git commit -m "feat: add alertDiff pure utility for forecast change detection"
```

---

## Task 4: Forecast alerts hook + opt-in component

**Files:**
- Create: `src/hooks/useWeatherAlerts.ts`
- Create: `src/components/AlertsOptIn.tsx`
- Modify: `src/index.css` — opt-in styles
- Modify: `src/pages/EventPage.tsx` — render `<AlertsOptIn />`

- [ ] **Step 1: Create `useWeatherAlerts.ts`**

```ts
// src/hooks/useWeatherAlerts.ts
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { allArrangements } from "../lib/arrangements";
import { isForecastRange, getWeatherCache } from "../lib/weather";
import { hasSignificantChange, type WeatherSnapshot } from "../lib/alertDiff";

const SNAPSHOTS_KEY = "weather-alert-snapshots";
const OPTED_IN_KEY = "weather-alert-events";
const STORAGE_KEY = "loypevaer:mine-ritt";

type PlannedEntry = { date: string };
type Store = Record<string, PlannedEntry>;
type Snapshots = Record<string, WeatherSnapshot>;
type OptedIn = Record<string, boolean>;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * On mount, checks bookmarked events for forecast changes and fires
 * browser Notification if permission is granted and a significant
 * change is detected. Notifications are client-pull — they fire on
 * the next app load, not server-initiated.
 */
export function useWeatherAlerts() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (Notification.permission !== "granted") return;

    const store = readJson<Store>(STORAGE_KEY, {});
    const optedIn = readJson<OptedIn>(OPTED_IN_KEY, {});
    const snapshots = readJson<Snapshots>(SNAPSHOTS_KEY, {});

    const eligible = Object.entries(store).filter(
      ([id, entry]) => optedIn[id] && entry.date && isForecastRange(entry.date)
    );

    if (eligible.length === 0) return;

    void (async () => {
      // Warm the weather cache (it's a singleton, so this is cheap if already loaded)
      await getWeatherCache();

      for (const [id, entry] of eligible) {
        const event = allArrangements.find((e) => e.id === id);
        if (!event || event.waypoints.length === 0) continue;

        // Fetch current weather for first waypoint (lightweight)
        const wp = event.waypoints[0];
        const cached = queryClient.getQueryData<import("../lib/weather").WeatherData>([
          "weather",
          wp.lat,
          wp.lon,
          entry.date,
        ]);
        if (!cached) continue;

        const next: WeatherSnapshot = {
          tempMax: cached.tempMax,
          precipProbability: cached.precipitationProbability ?? 0,
          windSpeed: cached.windSpeed,
        };

        const prev = snapshots[id];
        if (!prev) {
          // First run — store snapshot, no notification
          snapshots[id] = next;
          continue;
        }

        const { changed, summary } = hasSignificantChange(prev, next);
        if (changed) {
          new Notification(`Værvarsel endret – ${event.name}`, {
            body: summary,
            tag: `weather-alert-${id}`,
          });
        }

        snapshots[id] = next;
      }

      localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots));
    })();
  // Run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
```

- [ ] **Step 2: Create `AlertsOptIn.tsx`**

```tsx
// src/components/AlertsOptIn.tsx
import { useState, useEffect } from "react";

const OPTED_IN_KEY = "weather-alert-events";

function readOptedIn(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(OPTED_IN_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

type Props = {
  eventId: string;
};

export function AlertsOptIn({ eventId }: Props) {
  const [enabled, setEnabled] = useState(() => readOptedIn()[eventId] ?? false);
  const [permissionState, setPermissionState] = useState<NotificationPermission>(
    "Notification" in window ? Notification.permission : "denied"
  );

  useEffect(() => {
    if (!("Notification" in window)) return;
    setPermissionState(Notification.permission);
  }, []);

  if (!("Notification" in window)) return null;
  if (permissionState === "denied") {
    return (
      <p className="alerts-opt-in__denied">
        Tillat varsler i nettleserinnstillingene for å motta værvarsler.
      </p>
    );
  }

  async function handleToggle() {
    if (!enabled && Notification.permission === "default") {
      const result = await Notification.requestPermission();
      setPermissionState(result);
      if (result !== "granted") return;
    }

    const next = !enabled;
    setEnabled(next);
    const store = readOptedIn();
    if (next) {
      store[eventId] = true;
    } else {
      delete store[eventId];
    }
    localStorage.setItem(OPTED_IN_KEY, JSON.stringify(store));
  }

  return (
    <div className="alerts-opt-in">
      <label className="alerts-opt-in__label">
        <input
          type="checkbox"
          className="alerts-opt-in__checkbox"
          checked={enabled}
          onChange={() => void handleToggle()}
        />
        <span>Få varsel hvis værmeldingen endrer seg</span>
      </label>
      <p className="alerts-opt-in__note">
        Varsel sendes neste gang du åpner appen.
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Add CSS to `src/index.css`**

Append at the end of `src/index.css`:

```css
/* ── Alerts opt-in ───────────────────────────────────────────────────── */
.alerts-opt-in {
  margin-top: 0.5rem;
}

.alerts-opt-in__label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  cursor: pointer;
  user-select: none;
}

.alerts-opt-in__checkbox {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.alerts-opt-in__note {
  font-size: 0.8rem;
  color: var(--color-muted, #666);
  margin: 0.25rem 0 0 1.5rem;
}

.alerts-opt-in__denied {
  font-size: 0.85rem;
  color: var(--color-muted, #666);
  margin: 0.5rem 0 0;
}
```

- [ ] **Step 4: Mount `AlertsOptIn` in `EventPage.tsx`**

In `src/pages/EventPage.tsx`, add the import at the top:

```tsx
import { AlertsOptIn } from "../components/AlertsOptIn";
```

Find the bookmark toggle button (it contains `handleBookmarkToggle`). Directly below the bookmark toggle `<button>` (or inside the bookmark section), add `<AlertsOptIn />` when the event is planned:

Locate the section that renders the bookmark/planned indicator — it looks approximately like:
```tsx
{planned && (
```

Inside whatever block shows actions for a planned event, add after the bookmark button:

```tsx
{planned && <AlertsOptIn eventId={rittData.id} />}
```

Place this after the bookmark toggle button in the event header actions area.

- [ ] **Step 5: Mount `useWeatherAlerts` in `App.tsx`**

In `src/App.tsx` add the import:
```tsx
import { useWeatherAlerts } from "./hooks/useWeatherAlerts";
```

Inside `RouterContent()`, call the hook at the top (alongside `usePageTracking`):
```tsx
function RouterContent() {
  usePageTracking();
  useWeatherAlerts();
  return (
```

- [ ] **Step 6: Run lint + build**

```bash
bun run lint && bun run build
```

Expected: success, no type errors.

- [ ] **Step 7: Commit**

```bash
git add src/hooks/useWeatherAlerts.ts src/components/AlertsOptIn.tsx src/pages/EventPage.tsx src/App.tsx src/index.css
git commit -m "feat: add forecast change alerts with browser Notification API"
```

---

## Task 5: Climate narrative pure function

**Files:**
- Create: `src/lib/climateNarrative.ts`
- Create: `src/lib/__tests__/climateNarrative.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/__tests__/climateNarrative.test.ts
import { describe, expect, it } from "vitest";
import { buildClimateNarrative } from "../climateNarrative";
import type { RittEntry } from "../arrangements";

const baseEvent: RittEntry = {
  id: "test-ritt",
  name: "Test Ritt",
  discipline: "landevei",
  distance: 100,
  region: "Innlandet",
  officialDate: "2026-03-14",
  waypoints: [
    { label: "Start – Rena", lat: 61.13, lon: 11.37, altitude: 250 },
    { label: "Toppen", lat: 61.3, lon: 10.5, altitude: 1000 },
  ],
};

const cacheWithData = {
  climateAverages: {
    "61.13,11.37,03,14": {
      source: "climate-average" as const,
      tempMax: 3,
      tempMin: -1,
      precipitation: 1.2,
      windSpeed: 8,
      windDirection: 220,
      weatherCode: 61,
    },
  },
  historicalByYear: {
    "61.13,11.37,03,14,2024": {
      source: "climate-average" as const,
      tempMax: 2,
      tempMin: -2,
      precipitation: 1.5,
      windSpeed: 7,
      windDirection: 220,
      weatherCode: 61,
    },
    "61.13,11.37,03,14,2023": {
      source: "climate-average" as const,
      tempMax: 4,
      tempMin: 0,
      precipitation: 0.8,
      windSpeed: 9,
      windDirection: 230,
      weatherCode: 2,
    },
  },
};

describe("buildClimateNarrative", () => {
  it("returns null when no cache data for waypoints", () => {
    const result = buildClimateNarrative(baseEvent, {
      climateAverages: {},
      historicalByYear: {},
    });
    expect(result).toBeNull();
  });

  it("returns a Norwegian string mentioning the start waypoint label", () => {
    const result = buildClimateNarrative(baseEvent, cacheWithData);
    expect(result).not.toBeNull();
    expect(result).toContain("Rena");
  });

  it("includes temperature value from climate average", () => {
    const result = buildClimateNarrative(baseEvent, cacheWithData);
    expect(result).toMatch(/3\s*°C/);
  });

  it("mentions climate story label when historical data exists", () => {
    const result = buildClimateNarrative(baseEvent, cacheWithData);
    // getClimateStoryLabel with 2 years: both have precipitation > 0.5, so "Typisk regnvær"
    expect(result).toContain("Typisk regnvær");
  });

  it("returns null when event has no waypoints", () => {
    const result = buildClimateNarrative(
      { ...baseEvent, waypoints: [] },
      cacheWithData
    );
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
bun run test src/lib/__tests__/climateNarrative.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `climateNarrative.ts`**

```ts
// src/lib/climateNarrative.ts
import type { RittEntry } from "./arrangements";
import type { WeatherData } from "./weather";
import { getClimateStoryLabel, type ClimateStoryInput } from "./climateStory";

type WeatherCacheShape = {
  climateAverages: Record<string, WeatherData>;
  historicalByYear: Record<string, WeatherData>;
};

/**
 * Builds a 1–2 sentence Norwegian climate summary for an event, derived
 * from the pre-fetched weather-cache.json data.
 *
 * Returns null if the cache has no data for the first waypoint.
 */
export function buildClimateNarrative(
  event: RittEntry,
  cache: WeatherCacheShape
): string | null {
  if (event.waypoints.length === 0) return null;

  const first = event.waypoints[0];
  const [, , mm, dd] = event.officialDate.split("-");
  const cacheKey = `${first.lat},${first.lon},${mm},${dd}`;
  const avg = cache.climateAverages[cacheKey];

  if (!avg) return null;

  const temp = Math.round(avg.tempMax);
  const waypointLabel = first.label;

  // Collect historical years for this waypoint
  const endYear = new Date().getFullYear() - 1;
  const startYear = endYear - 9;
  const years: ClimateStoryInput = [];
  for (let y = startYear; y <= endYear; y++) {
    const key = `${first.lat},${first.lon},${mm},${dd},${y}`;
    const entry = cache.historicalByYear[key];
    if (entry) {
      years.push({
        precipitation: entry.precipitation,
        windSpeed: entry.windSpeed,
        tempMax: entry.tempMax,
      });
    }
  }

  const storyLabel = years.length > 0 ? getClimateStoryLabel(years) : null;

  // Build sentence 1: temperature at start waypoint
  const [monthNum] = [parseInt(mm, 10)];
  const monthNames = [
    "januar", "februar", "mars", "april", "mai", "juni",
    "juli", "august", "september", "oktober", "november", "desember",
  ];
  const monthName = monthNames[monthNum - 1] ?? "";

  let narrative = `Historisk sett er det typisk ${temp}°C ved ${waypointLabel} i ${monthName}`;

  if (storyLabel && storyLabel !== "Variert vær") {
    narrative += ` — ${storyLabel.toLowerCase()} forekommer i flertallet av år`;
  }

  narrative += ".";

  return narrative;
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
bun run test src/lib/__tests__/climateNarrative.test.ts
```

Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/climateNarrative.ts src/lib/__tests__/climateNarrative.test.ts
git commit -m "feat: add buildClimateNarrative for event SEO descriptions"
```

---

## Task 6: Wire climate narrative + ld+json into EventPage

**Files:**
- Modify: `src/pages/EventPage.tsx`

- [ ] **Step 1: Add import and narrative computation**

In `src/pages/EventPage.tsx`, add the import near the top alongside other lib imports:

```tsx
import { buildClimateNarrative } from "../lib/climateNarrative";
import { getWeatherCache } from "../lib/weather";
```

Add a `useState` + `useEffect` to load the cache and compute the narrative. Place this after the existing `rittYear` / `pageTitle` / `pageDescription` variable declarations:

```tsx
const [climateNarrative, setClimateNarrative] = useState<string | null>(null);

useEffect(() => {
  if (!rittData) return;
  void getWeatherCache().then((cache) => {
    setClimateNarrative(buildClimateNarrative(rittData, cache));
  });
}, [rittData?.id]); // eslint-disable-line react-hooks/exhaustive-deps
```

- [ ] **Step 2: Enrich `pageDescription` to include narrative**

Find the existing `pageDescription` definition:

```tsx
  const pageDescription = rittData
    ? `Skal du ${disciplineVerb(rittData.discipline)} ${rittData.name} ${rittYear ?? ""}? Sjekk timebasert værmelding og historiske klimasnitt for alle veipunkter langs løypa – temperatur, vind og nedbør for ${rittData.distanceLabel ?? `${rittData.distance} km`} og ${rittData.elevationGain} hm i ${rittData.region}.`
    : undefined;
```

Replace with:

```tsx
  const pageDescription = rittData
    ? [
        `Skal du ${disciplineVerb(rittData.discipline)} ${rittData.name} ${rittYear ?? ""}?`,
        climateNarrative,
        `Sjekk timebasert værmelding og historiske klimasnitt for alle veipunkter langs løypa – temperatur, vind og nedbør for ${rittData.distanceLabel ?? `${rittData.distance} km`}${rittData.elevationGain ? ` og ${rittData.elevationGain} hm` : ""} i ${rittData.region}.`,
      ]
        .filter(Boolean)
        .join(" ")
    : undefined;
```

- [ ] **Step 3: Add `ld+json` SportsEvent structured data**

In `EventPage.tsx`, find the main `<Helmet>` block (it will have `<meta name="keywords" ...>` or similar). After the existing `PageMeta` call (or inside the existing `<Helmet>` block), add a `ld+json` script. Look for where the `Helmet` block ends and add:

```tsx
{rittData && (
  <Helmet>
    <script type="application/ld+json">
      {JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SportsEvent",
        name: `${rittData.name} ${rittYear ?? ""}`,
        startDate: rittData.officialDate,
        location: {
          "@type": "Place",
          name: rittData.waypoints[0]?.label ?? rittData.region,
          geo: rittData.waypoints[0]
            ? {
                "@type": "GeoCoordinates",
                latitude: rittData.waypoints[0].lat,
                longitude: rittData.waypoints[0].lon,
              }
            : undefined,
        },
        sport: disciplineToSport(rittData.discipline),
        url: pageUrl,
        description: pageDescription,
      })}
    </script>
  </Helmet>
)}
```

Note: `disciplineToSport` is already imported in `EventPage.tsx`.

- [ ] **Step 4: Run lint + build**

```bash
bun run lint && bun run build
```

Expected: success.

- [ ] **Step 5: Commit**

```bash
git add src/pages/EventPage.tsx
git commit -m "feat: add climate narrative to event SEO description and ld+json SportsEvent"
```

---

## Task 7: Packing list pure logic

**Files:**
- Create: `src/lib/packingList.ts`
- Create: `src/lib/__tests__/packingList.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/__tests__/packingList.test.ts
import { describe, expect, it } from "vitest";
import { buildPackingList } from "../packingList";
import type { WaypointWeather } from "../../hooks/useWeather";
import type { WeatherData } from "../weather";

function makeResult(overrides: Partial<WeatherData>): WaypointWeather {
  const data: WeatherData = {
    source: "forecast",
    tempMax: 15,
    tempMin: 10,
    precipitation: 0,
    windSpeed: 5,
    weatherCode: 0,
    ...overrides,
  };
  return { data, isLoading: false, isError: false };
}

describe("buildPackingList", () => {
  it("returns empty list when no data", () => {
    const result = buildPackingList(
      [{ data: undefined, isLoading: true, isError: false }],
      "landevei"
    );
    expect(result).toHaveLength(0);
  });

  it("puts rain jacket in 'wear' for heavy rain at all waypoints", () => {
    const results = [
      makeResult({ precipitation: 3 }),
      makeResult({ precipitation: 3 }),
    ];
    const list = buildPackingList(results, "landevei");
    const rainJacket = list.find((i) => i.item === "Regnjakke");
    expect(rainJacket?.column).toBe("wear");
  });

  it("puts rain jacket in 'carry' when only one waypoint has rain", () => {
    const results = [
      makeResult({ precipitation: 0 }),
      makeResult({ precipitation: 3 }),
    ];
    const list = buildPackingList(results, "landevei");
    const rainJacket = list.find((i) => i.item === "Regnjakke");
    expect(rainJacket?.column).toBe("carry");
  });

  it("puts warm gloves in 'wear' for freezing conditions", () => {
    const results = [makeResult({ tempMin: -2, tempMax: 0 })];
    const list = buildPackingList(results, "landevei");
    const gloves = list.find((i) => i.item.toLowerCase().includes("hansker") || i.item.toLowerCase().includes("votter"));
    expect(gloves?.column).toBe("wear");
  });

  it("marks windproof as 'skip' for calm warm conditions", () => {
    const results = [makeResult({ tempMax: 20, tempMin: 15, windSpeed: 3, precipitation: 0 })];
    const list = buildPackingList(results, "landevei");
    const windproof = list.find((i) => i.item === "Vindjakke");
    expect(windproof?.column).toBe("skip");
  });

  it("returns discipline-aware carry label for running", () => {
    const results = [makeResult({ precipitation: 1 })];
    const list = buildPackingList(results, "løping");
    const rainJacket = list.find((i) => i.item === "Regnjakke");
    expect(rainJacket?.reason).toContain("sekk");
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
bun run test src/lib/__tests__/packingList.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `packingList.ts`**

```ts
// src/lib/packingList.ts
import type { WaypointWeather } from "../hooks/useWeather";
import { resolveWeatherValues } from "./weather";
import {
  TEMP_FREEZE,
  TEMP_VERY_COLD,
  TEMP_COLD,
  PRECIP_LIGHT,
  PRECIP_HEAVY,
  WIND_STRONG,
} from "./weatherThresholds";

export type PackingColumn = "wear" | "carry" | "skip";

export type PackingItem = {
  item: string;
  reason: string;
  column: PackingColumn;
};

function carryLabel(discipline: string): string {
  switch (discipline) {
    case "løping":
    case "ultraløp":
      return "Ha i sekk/vest";
    case "langrenn":
      return "Ha i sekk";
    default:
      return "Ha med i vogn/sekk";
  }
}

export function buildPackingList(
  results: WaypointWeather[],
  discipline: string
): PackingItem[] {
  const loaded = results.filter((r) => r.data != null);
  if (loaded.length === 0) return [];

  const carry = carryLabel(discipline);
  const items: PackingItem[] = [];

  const temps = loaded.map((r) => resolveWeatherValues(r.data!).temp);
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);
  const allWet = loaded.every((r) => resolveWeatherValues(r.data!).precipitation > PRECIP_LIGHT);
  const anyWet = loaded.some((r) => resolveWeatherValues(r.data!).precipitation > PRECIP_LIGHT);
  const allHeavyRain = loaded.every((r) => resolveWeatherValues(r.data!).precipitation > PRECIP_HEAVY);
  const anyHeavyRain = loaded.some((r) => resolveWeatherValues(r.data!).precipitation > PRECIP_HEAVY);
  const maxWind = Math.max(...loaded.map((r) => resolveWeatherValues(r.data!).windSpeed));

  // Rain jacket
  if (allHeavyRain) {
    items.push({ item: "Regnjakke", reason: "Kraftig nedbør langs hele løypa", column: "wear" });
  } else if (anyHeavyRain || allWet) {
    items.push({ item: "Regnjakke", reason: `Nedbør på deler av løypa — ${carry.toLowerCase()}`, column: "carry" });
  } else if (anyWet) {
    items.push({ item: "Regnjakke", reason: `Lett nedbør mulig — ${carry.toLowerCase()}`, column: "carry" });
  } else {
    items.push({ item: "Regnjakke", reason: "Tørt langs hele løypa", column: "skip" });
  }

  // Windproof
  if (maxWind > WIND_STRONG || minTemp < TEMP_COLD) {
    items.push({ item: "Vindjakke", reason: maxWind > WIND_STRONG ? "Sterk vind langs løypa" : "Kalde forhold", column: "wear" });
  } else {
    items.push({ item: "Vindjakke", reason: "Laber vind og akseptabel temperatur", column: "skip" });
  }

  // Gloves / handwear
  if (minTemp < TEMP_FREEZE) {
    items.push({ item: "Votter", reason: `Under 0°C ved start (${Math.round(minTemp)}°C)`, column: "wear" });
  } else if (minTemp < TEMP_VERY_COLD) {
    items.push({ item: "Langfingrede hansker", reason: `Under 5°C (${Math.round(minTemp)}°C)`, column: "wear" });
  } else if (minTemp < TEMP_COLD) {
    items.push({ item: "Langfingrede hansker", reason: `Friskt ved start (${Math.round(minTemp)}°C)`, column: "carry" });
  } else {
    items.push({ item: "Langfingrede hansker", reason: "Temperaturen er behagelig", column: "skip" });
  }

  // Warm base layer — only add if cold
  if (minTemp < TEMP_VERY_COLD) {
    items.push({ item: "Ekstra varmende lag", reason: `Kaldt ved start (${Math.round(minTemp)}°C)`, column: "wear" });
  }

  // Range advisory item
  const tempRange = maxTemp - minTemp;
  if (tempRange > 6) {
    items.push({
      item: "Legg av klær underveis",
      reason: `Temperaturspenn ${Math.round(minTemp)}–${Math.round(maxTemp)}°C — kle deg for starten`,
      column: "carry",
    });
  }

  return items;
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
bun run test src/lib/__tests__/packingList.test.ts
```

Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/packingList.ts src/lib/__tests__/packingList.test.ts
git commit -m "feat: add buildPackingList for range-aware gear advice"
```

---

## Task 8: PackingList component + GearSuggestion integration

**Files:**
- Create: `src/components/PackingList.tsx`
- Modify: `src/components/GearSuggestion.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Create `PackingList.tsx`**

```tsx
// src/components/PackingList.tsx
import type { PackingItem } from "../lib/packingList";

type Props = {
  items: PackingItem[];
};

export function PackingList({ items }: Props) {
  if (items.length === 0) return null;

  const wear = items.filter((i) => i.column === "wear");
  const carry = items.filter((i) => i.column === "carry");
  const skip = items.filter((i) => i.column === "skip");

  function renderCol(title: string, colItems: PackingItem[], className: string) {
    if (colItems.length === 0) return null;
    return (
      <div className={`packing-list__col ${className}`}>
        <div className="packing-list__col-heading">{title}</div>
        <ul className="packing-list__col-list">
          {colItems.map((i) => (
            <li key={i.item} className="packing-list__item" title={i.reason}>
              {i.item}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <details className="packing-list__details">
      <summary className="packing-list__summary">Pakkeliste</summary>
      <div className="packing-list__grid">
        {renderCol("Ha på deg", wear, "packing-list__col--wear")}
        {renderCol("Ta med", carry, "packing-list__col--carry")}
        {renderCol("Trenger ikke", skip, "packing-list__col--skip")}
      </div>
    </details>
  );
}
```

- [ ] **Step 2: Add CSS to `src/index.css`**

Append at the end of `src/index.css`:

```css
/* ── Packing list ────────────────────────────────────────────────────── */
.packing-list__details {
  margin-top: 0.75rem;
}

.packing-list__summary {
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  list-style: none;
  padding: 0.25rem 0;
  color: var(--color-green-dark, #1a3300);
}

.packing-list__summary::-webkit-details-marker {
  display: none;
}

.packing-list__summary::before {
  content: "▶ ";
  font-size: 0.7em;
}

details[open] .packing-list__summary::before {
  content: "▼ ";
}

.packing-list__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.packing-list__col-heading {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 0.35rem;
  opacity: 0.7;
}

.packing-list__col--wear .packing-list__col-heading { color: #c0392b; }
.packing-list__col--carry .packing-list__col-heading { color: #e67e22; }
.packing-list__col--skip .packing-list__col-heading { color: #7f8c8d; }

.packing-list__col-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.packing-list__item {
  font-size: 0.85rem;
  cursor: help;
}

.packing-list__col--skip .packing-list__item {
  opacity: 0.5;
  text-decoration: line-through;
}
```

- [ ] **Step 3: Extend `GearSuggestion.tsx` with range advice and `PackingList`**

Replace the full content of `src/components/GearSuggestion.tsx` with:

```tsx
import type { WaypointWeather } from "../hooks/useWeather";
import { windRelativeLabel, routeBearingForWaypoint } from "../lib/wind";
import type { Waypoint } from "../lib/weather";
import { resolveWeatherValues } from "../lib/weather";
import {
  TEMP_FREEZE,
  TEMP_VERY_COLD,
  TEMP_COLD,
  PRECIP_LIGHT,
  PRECIP_HEAVY,
  WIND_SIGNIFICANT,
  WIND_STRONG,
} from "../lib/weatherThresholds";
import { buildPackingList } from "../lib/packingList";
import { PackingList } from "./PackingList";

type Suggestion = {
  key: string;
  icon: string;
  text: string;
  severity: "info" | "warn" | "danger";
};

function buildSuggestions(
  results: WaypointWeather[],
  waypoints: Waypoint[]
): Suggestion[] {
  const loaded = results.filter((r) => r.data != null);
  if (loaded.length === 0) return [];

  const suggestions: Suggestion[] = [];

  const temps = loaded.map((r) => resolveWeatherValues(r.data!).temp);
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);

  const precipValues = loaded.map((r) => resolveWeatherValues(r.data!).precipitation);
  const maxPrecip = Math.max(...precipValues);

  const windSpeeds = loaded.map((r) => resolveWeatherValues(r.data!).windSpeed);

  // Check for headwind at any waypoint
  const hasSignificantHeadwind = loaded.some((r, i) => {
    const { windDirection: windDir, windSpeed } = resolveWeatherValues(r.data!);
    if (windDir === undefined || windSpeed <= WIND_SIGNIFICANT) return false;
    const bearing = routeBearingForWaypoint(waypoints, i);
    if (bearing === null) return false;
    return windRelativeLabel(windDir, bearing) === "Motvind";
  });

  const maxWindSpeed = Math.max(...windSpeeds);

  // --- Range advisory (new) ---
  const tempRange = maxTemp - minTemp;
  if (tempRange > 6) {
    suggestions.push({
      key: "temp-range",
      icon: "🌡",
      text: `Temperaturen varierer fra ${Math.round(minTemp)}°C til ${Math.round(maxTemp)}°C langs løypa — kle deg for starten og planlegg å lettkle deg underveis`,
      severity: "warn",
    });
  }

  // --- Wind direction change advisory (new) ---
  const windLabels = loaded.map((r, i) => {
    const { windDirection, windSpeed } = resolveWeatherValues(r.data!);
    if (windDirection === undefined || windSpeed <= WIND_SIGNIFICANT) return null;
    const bearing = routeBearingForWaypoint(waypoints, i);
    if (bearing === null) return null;
    return windRelativeLabel(windDirection, bearing);
  });
  const hasHeadwind = windLabels.some((l) => l === "Motvind");
  const hasTailwind = windLabels.some((l) => l === "Medvind");
  if (hasHeadwind && hasTailwind) {
    const headwindIdx = windLabels.findIndex((l) => l === "Motvind");
    const headwindLabel = waypoints[headwindIdx]?.label ?? "en del av løypa";
    suggestions.push({
      key: "wind-direction-change",
      icon: "💨",
      text: `Vindretningen endrer seg langs løypa — motvind ved ${headwindLabel}, medvind mot slutten`,
      severity: "info",
    });
  }

  // --- Temperature rules ---
  if (minTemp < TEMP_FREEZE) {
    suggestions.push({
      key: "freeze",
      icon: "🧊",
      text: "Under 0 °C: vinterhansker, balaklava og varmende lag anbefalt",
      severity: "danger",
    });
  } else if (minTemp < TEMP_VERY_COLD) {
    suggestions.push({
      key: "very-cold",
      icon: "🥶",
      text: "Under 5 °C: votter, hette og ekstra lag",
      severity: "danger",
    });
  } else if (minTemp < TEMP_COLD) {
    suggestions.push({
      key: "cold",
      icon: "🧊",
      text: "Under 10 °C: armbeskyttere og langfingrede hansker anbefalt",
      severity: "warn",
    });
  }

  // --- Rain rules ---
  if (maxPrecip > PRECIP_HEAVY) {
    suggestions.push({
      key: "heavy-rain",
      icon: "🌧",
      text: "Mye nedbør: regnjakke og regnbukse anbefalt",
      severity: "danger",
    });
  } else if (maxPrecip > PRECIP_LIGHT) {
    suggestions.push({
      key: "light-rain",
      icon: "🌦",
      text: "Lett nedbør: regnjakke anbefalt",
      severity: "warn",
    });
  }

  // --- Wind rules ---
  if (hasSignificantHeadwind && maxWindSpeed > WIND_STRONG) {
    suggestions.push({
      key: "headwind-strong",
      icon: "💨",
      text: "Sterk motvind: vindtett plagg og juster forventet fart",
      severity: "danger",
    });
  } else if (hasSignificantHeadwind) {
    suggestions.push({
      key: "headwind",
      icon: "💨",
      text: "Motvind underveis: vindtett plagg anbefalt",
      severity: "warn",
    });
  } else if (maxWindSpeed > WIND_STRONG) {
    suggestions.push({
      key: "strong-wind",
      icon: "💨",
      text: "Sterk vind: vindtett plagg anbefalt",
      severity: "warn",
    });
  }

  // --- All-clear ---
  if (suggestions.length === 0) {
    suggestions.push({
      key: "ok",
      icon: "✅",
      text: "Gode forhold — standardutstyr holder",
      severity: "info",
    });
  }

  return suggestions;
}

type Props = {
  results: WaypointWeather[];
  waypoints: Waypoint[];
  discipline?: string;
};

export function GearSuggestion({ results, waypoints, discipline = "landevei" }: Props) {
  const hasAnyData = results.some((r) => r.data != null);
  const isLoading = results.some((r) => r.isLoading);

  if (isLoading || !hasAnyData) return null;

  const suggestions = buildSuggestions(results, waypoints);
  if (suggestions.length === 0) return null;

  const packingItems = buildPackingList(results, discipline);

  return (
    <details className="gear-suggestion__details">
      <summary className="gear-suggestion__summary">
        Utstyrstips
      </summary>
      <div className="gear-suggestion__body">
        <div className="gear-suggestion">
          <div className="gear-suggestion__heading">Bekledningsråd</div>
          <ul className="gear-suggestion__list">
            {suggestions.map((s) => (
              <li
                key={s.key}
                className={`gear-suggestion__item gear-suggestion__item--${s.severity}`}
              >
                <span className="gear-suggestion__icon">{s.icon}</span>
                <span>{s.text}</span>
              </li>
            ))}
          </ul>
          <PackingList items={packingItems} />
        </div>
      </div>
    </details>
  );
}
```

- [ ] **Step 4: Pass `discipline` to `GearSuggestion` in `EventPage.tsx`**

In `src/pages/EventPage.tsx`, find the `<GearSuggestion` usage and add the `discipline` prop:

```tsx
<GearSuggestion results={weatherResults} waypoints={rittData.waypoints} discipline={rittData.discipline} />
```

- [ ] **Step 5: Run all tests + lint + build**

```bash
bun run lint && bun run test && bun run build
```

Expected: all tests pass, build succeeds, no type errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/PackingList.tsx src/components/GearSuggestion.tsx src/pages/EventPage.tsx src/index.css
git commit -m "feat: add range-aware gear advice and packing list to GearSuggestion"
```

---

## Task 9: Final verification

- [ ] **Step 1: Run full test suite**

```bash
bun run test
```

Expected: all tests pass. Note the count — it should be higher than before this plan started.

- [ ] **Step 2: Run lint**

```bash
bun run lint
```

Expected: no errors or warnings beyond pre-existing baseline.

- [ ] **Step 3: Run production build**

```bash
bun run build
```

Expected: build completes successfully, no TypeScript errors.

- [ ] **Step 4: Smoke-test in browser (manual)**

```bash
bun run preview
```

Check:
1. Home page loads — no console errors
2. Install banner does NOT appear on desktop Chrome without `beforeinstallprompt` (normal — the event only fires on mobile or after meeting installability criteria)
3. Navigate to any event with waypoints (e.g. `/arrangement/birkebeinerrittet-2026`)
4. Bookmark the event → `AlertsOptIn` checkbox appears
5. `GearSuggestion` section opens → bekledningsråd shows → "Pakkeliste" toggle visible and opens
6. Page `<title>` and `description` meta render as expected (view source)
7. `application/ld+json` script is present in `<head>` (view source)

- [ ] **Step 5: Final commit if any minor fixes were needed**

```bash
git add -A
git commit -m "fix: post-review polish from smoke test"
```

---

## Summary

| Feature | Tasks | New files | Tests |
|---|---|---|---|
| PWA install prompt | 1–2 | `useInstallPrompt.ts`, `InstallBanner.tsx` | 5 |
| Forecast alerts | 3–4 | `alertDiff.ts`, `useWeatherAlerts.ts`, `AlertsOptIn.tsx` | 8 |
| SEO climate narrative | 5–6 | `climateNarrative.ts` | 5 |
| Gear / packing list | 7–8 | `packingList.ts`, `PackingList.tsx` | 6 |
| Verification | 9 | — | — |
