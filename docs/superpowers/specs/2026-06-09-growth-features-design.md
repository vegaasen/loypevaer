# Growth features design — Løypevær

**Date:** 2026-06-09  
**Status:** Approved — ready for implementation planning  
**Audience:** Norwegian amateur athletes (existing core users)  
**Goal:** Increase return visits and organic discovery

---

## Context

Løypevær shows point-by-point weather forecasts and 10-year climate averages for ~312 Norwegian endurance events (cycling, cross-country skiing, triathlon, running) plus a custom GPX route tool. The core loop works well. The gaps are:

- No reason for a user to return after they've checked their event once
- No organic discovery — event pages have thin, identical meta descriptions
- PWA is wired up but install rate is effectively zero
- `GearSuggestion` gives flat advice that ignores variation across waypoints

These four features address all four gaps in a natural delivery sequence.

---

## Feature 1 — PWA install prompt

### Problem

`vite-plugin-pwa` (`registerType: 'prompt'`) fires `beforeinstallprompt` but the app never captures or surfaces it. The existing `ReloadPrompt` only handles SW updates, not installs.

### Design

**New hook: `src/hooks/useInstallPrompt.ts`**

Listens for `beforeinstallprompt`, stores the deferred event in a ref, exposes:

```ts
{
  canInstall: boolean;      // true when deferred event is available
  promptInstall: () => void; // calls deferred.prompt(), resets state on completion
}
```

**New component: `src/components/InstallBanner.tsx`**

Rendered in `App.tsx` just below `<NavBar>`. Visible only when:
- `canInstall === true`, AND
- `localStorage["pwa-install-dismissed"]` is not set

Banner content:
- Heading: "Legg til Løypevær på hjemskjermen"
- Body: "Få raskere tilgang og støtte for værvarsler"
- Primary button: "Legg til" → calls `promptInstall()`
- Dismiss button (✕): sets `localStorage["pwa-install-dismissed"] = "1"`, hides banner permanently

**iOS fallback**

When `beforeinstallprompt` doesn't fire (iOS/Safari): detect `navigator.standalone === false` + iOS user-agent. Show a different static banner:
- "Trykk Del (⬆) → Legg til på hjemskjermen" with the iOS share icon
- Same dismiss behaviour

**Styling:** follows the same pattern as `ReloadPrompt` — minimal, no new CSS framework.

**No new dependencies.**

---

## Feature 2 — Forecast change alerts (client-side)

### Problem

Users check the weather once, then forget the app exists. True server-initiated push requires a backend (breaks "no backend" constraint). A client-only approach delivers most of the value: the user gets notified the moment they next open the app after a significant forecast change.

### Design

**New lib: `src/lib/alertDiff.ts`**

Pure function (easily testable):

```ts
type WeatherSnapshot = {
  tempMax: number;
  precipProbability: number;
  windSpeed: number;
};

function hasSignificantChange(
  prev: WeatherSnapshot,
  next: WeatherSnapshot
): { changed: boolean; summary: string }
```

Thresholds:
- Temperature diff > 4°C → significant
- Precipitation probability diff > 25 percentage points → significant
- Wind speed diff > 5 m/s → significant

Returns `changed: true` + a Norwegian summary string (e.g. "Temperaturen har falt 6°C — nå 4°C ved start").

**New hook: `src/hooks/useWeatherAlerts.ts`**

- Reads `myEvents` from localStorage (bookmarked events)
- For each bookmarked event where the selected date is within the 16-day forecast window, fetches live weather for the **first and last waypoint** (lightweight: 2 API calls per event)
- Compares against stored snapshots in `localStorage["weather-alert-snapshots"]`
- If `hasSignificantChange` returns true AND `Notification.permission === "granted"`, fires:
  ```ts
  new Notification(`Værvarsel endret – ${eventName}`, {
    body: summary,
    data: { url: `/arrangement/${eventId}?date=${date}` }
  })
  ```
- Updates snapshots in localStorage after comparison

**New component: `src/components/AlertsOptIn.tsx`**

Rendered on `EventPage` when the event is bookmarked and the selected date is within forecast range. Shows:
- Toggle: "Få varsel hvis værmeldingen endrer seg"
- On enable: calls `Notification.requestPermission()`, stores per-event opt-in in `localStorage["weather-alert-events"]`
- If permission denied: shows a note "Tillat varsler i nettleserinnstillingene"

**Important UX constraint:** The UI never uses the word "push". It says "varsel sendes neste gang du åpner appen" to accurately represent the client-pull nature.

**No new dependencies.** Uses standard browser Notification API.

---

## Feature 3 — Event-specific SEO: climate narrative in meta

### Problem

Every event page has the same static `pageDescription` shape. Crawlers see no unique signal per event. The rich historical data already in `weather-cache.json` (10 years of per-waypoint averages) is invisible to search engines.

### Design

**New lib: `src/lib/climateNarrative.ts`**

Pure function that takes an `Arrangement` and the loaded weather cache, and returns a 1–2 sentence Norwegian summary:

```ts
function buildClimateNarrative(
  event: Arrangement,
  cache: WeatherCache
): string | null
```

Uses:
- `getClimateStoryLabel` (existing `climateStory.ts`) for the overall tone
- Numeric averages from the cache for the first and last waypoint
- The event's `officialDate` month to pick the right cache key

Example output:
> "Historisk sett er det typisk regnvær ved start i Rena (snitt 3°C) og kalde forhold ved Sjusjøen (snitt −1°C) i mars. Nedbør forekommer i 6 av 10 år."

Returns `null` if the cache has no data for the event's waypoints (graceful degradation).

**`EventPage.tsx` — enrich `pageDescription`**

Append the climate narrative to the existing static description when available:

```
"Skal du sykle Birkebeinerrittet 2026? [climate narrative]. Sjekk timebasert værmelding langs hele løypa på Løypevær."
```

The `pageDescription` is used in `<PageMeta>` and will be picked up by crawlers on the initial HTML response (CSR; Vite renders the `<head>` tag synchronously for the static shell, but the narrative requires the cache to be loaded — this is acceptable since the static fallback is already meaningful).

**Structured data per event**

Extend the existing `Helmet` block in `EventPage.tsx` to emit `application/ld+json` `SportsEvent`:

```json
{
  "@context": "https://schema.org",
  "@type": "SportsEvent",
  "name": "Birkebeinerrittet 2026",
  "startDate": "2026-08-22",
  "location": {
    "@type": "Place",
    "name": "Rena",
    "geo": { "@type": "GeoCoordinates", "latitude": 61.13, "longitude": 11.37 }
  },
  "sport": "Road Cycling",
  "url": "https://www.løypevær.no/arrangement/birkebeinerrittet-2026",
  "description": "[climate narrative]"
}
```

`disciplineToSport` (existing `seo.ts`) is already imported in `EventPage.tsx`.

**Sitemap**

`scripts/generate-sitemap.ts` already runs pre-build and covers all arrangement IDs. Verify coverage during implementation — no structural change expected.

**No new dependencies.**

---

## Feature 4 — Smarter gear / packing tool

### Problem

`GearSuggestion` uses `min(temperature)` and `max(precipitation)` across all waypoints, flattening the actual story. A race from −2°C at start to +10°C at finish requires a different strategy (layer management) than a uniformly cold race.

### Design

**Extend `GearSuggestion.tsx` — range-aware advice**

When the spread between min and max temperature across waypoints is > 6°C, add a new advice item at the top:

> ⚠️ "Temperaturen varierer fra −2°C (start) til +10°C (mål): kle deg for starten og planlegg å lettkle deg underveis"

When one waypoint has `Motvind` and another has `Medvind` (i.e. wind direction changes along the route):

> 💨 "Vindretningen endrer seg langs løypa — motvind ved [waypoint], medvind mot slutten"

**New lib: `src/lib/packingList.ts`**

Data model:

```ts
type PackingColumn = "wear" | "carry" | "skip";

type PackingItem = {
  item: string;       // e.g. "Vindjakke"
  reason: string;     // e.g. "Sterk motvind ved km 45"
  column: PackingColumn;
};

function buildPackingList(
  results: WaypointWeather[],
  discipline: string
): PackingItem[]
```

Column assignment rules:
- `wear` — needed at the coldest or windiest point (likely the start)
- `carry` — needed at some point but not all (e.g. rain jacket if only one waypoint has rain)
- `skip` — conditions clearly don't warrant it (e.g. no rain at any waypoint → rain trousers: skip)

Discipline-aware: cycling drop-bag items differ from running vest items (e.g. "legg i sekk" is realistic for running, "legg i bidonsekk" for cycling).

**New sub-component: `src/components/PackingList.tsx`**

Rendered inside the existing `<details>` in `GearSuggestion`. Shows a three-column table:

| Ha på deg | Ha med deg | Trenger ikke |
|---|---|---|
| Vindjakke | Regnjakke | Dunjakke |
| Langfingrede hansker | Votter | Vintersko |

Each item shows its `reason` on hover/expand. Collapsed by default behind a "Pakkeliste" toggle inside the existing details element.

**No new dependencies.**

---

## Implementation order

These features are independent and can be built in parallel, but this sequence maximises early user impact and dependency flow:

| Phase | Feature | Effort estimate | Dependency |
|---|---|---|---|
| 1 | PWA install prompt | Small (~1 day) | None — prerequisite for alerts |
| 2 | SEO climate narrative | Medium (~2 days) | None — parallel with phase 1 |
| 3 | Forecast change alerts | Medium (~2 days) | Phase 1 (install → higher permission grant rate) |
| 4 | Smarter gear / packing list | Medium (~2 days) | None — parallel with any phase |

---

## Files affected (summary)

| File | Change type |
|---|---|
| `src/hooks/useInstallPrompt.ts` | New |
| `src/components/InstallBanner.tsx` | New |
| `src/lib/alertDiff.ts` | New |
| `src/hooks/useWeatherAlerts.ts` | New |
| `src/components/AlertsOptIn.tsx` | New |
| `src/lib/climateNarrative.ts` | New |
| `src/lib/packingList.ts` | New |
| `src/components/PackingList.tsx` | New |
| `src/components/GearSuggestion.tsx` | Extend |
| `src/pages/EventPage.tsx` | Extend (description + ld+json + AlertsOptIn) |
| `src/App.tsx` | Extend (InstallBanner) |

All changes are additive — no existing behaviour is removed or broken.
