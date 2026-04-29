<div align="center">

# Løypevær 🚴‍♂️⛷️🏊

**Sjekk været langs ruten for norske sykkelritt, langrenn, triathlon og ultraløp.**

Pick a Norwegian race, choose a date, and get weather conditions at key waypoints along the route — from start to finish. Uses live forecasts when the date is close, and 10-year historical climate averages when planning further ahead.

### [løypevær.no](https://www.xn--lypevr-tua3l.no/)

---

<p align="center">
  <a href="https://react.dev"><img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-6-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="https://vitejs.dev"><img src="https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite"></a>
  <a href="https://bun.sh"><img src="https://img.shields.io/badge/Bun-runtime-F9F1E1?style=for-the-badge&logo=bun&logoColor=black" alt="Bun"></a>
  <a href="https://tanstack.com/query"><img src="https://img.shields.io/badge/TanStack_Query-v5-FF4154?style=for-the-badge&logo=reactquery&logoColor=white" alt="TanStack Query"></a>
  <a href="https://open-meteo.com"><img src="https://img.shields.io/badge/Open--Meteo-free_API-00B4D8?style=for-the-badge" alt="Open-Meteo"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-brightgreen?style=for-the-badge" alt="License"></a>
</p>


---

<p align="center">
  <a href="https://github.com/vegaasen/loypevaer/actions/workflows/ci.yml"><img src="https://github.com/vegaasen/loypevaer/actions/workflows/ci.yml/badge.svg" alt="CI" height="22"></a>
  <a href="https://github.com/vegaasen/loypevaer/actions/workflows/pages.yml"><img src="https://github.com/vegaasen/loypevaer/actions/workflows/pages.yml/badge.svg" alt="Deploy" height="22"></a>
</p>

</div>

---

## Features

- Browse Norwegian endurance events across sykkel (landevei + terreng), langrenn, triathlon, ultraløp, and løping
- Select any date to see weather along the route
- **Forecast mode** — live data from Open-Meteo when the date is ≤ 16 days away
- **Climate average mode** — rolling 10-year historical average for dates further in the future
- **Pacing** — set start/finish time to get waypoint-specific hourly forecasts
- **Gear suggestions** — rule-based recommendations from temperature, precipitation, and wind
- **Elevation profile** — SVG chart with waypoint markers
- **Map view** — Leaflet map with colour-coded waypoint pins and OSRM route polyline
- **Bookmarks** — save arrangement + date combos via "Mine arrangement" (persisted in localStorage)
- **Wind direction** — compass bearing + relative label (Medvind/Motvind/Sidevind)
- **Feels-like temperature** — `apparent_temperature` from Open-Meteo
- **Precipitation probability** — % chance of rain alongside expected mm
- **GPX upload** — drag-and-drop or URL load a `.gpx` file to auto-derive waypoints, with adjustable waypoint count and export guides for Strava, Garmin Connect, and Komoot
- Shareable URLs — date is stored in the query string (`/arrangement/birkebeinerrittet?date=2025-08-23`)
- Dark mode via `prefers-color-scheme`
- SEO sitemap generated automatically at build time; per-discipline canonical URLs

---

## Events included

### Sykkel — Terreng

| Arrangement | Distance | Region |
|---|---|---|
| Birkebeinerrittet | 88 km | Innlandet |
| GravelBirken | 92 km | Innlandet |
| HalvBirken Sykkel | 46 km | Innlandet |
| UltraBirken | 110 km | Innlandet |
| Rallarvegen | 82 km | Vestland / Viken |
| Garborgriket Rundt | 70 km | Rogaland |
| Øyungen Rundt | 45 km | Trøndelag |
| OBOS Terrengsykkelrittet | 28 km | Oslo |
| Stenhoggerrittet | 46 km | Viken |
| Elgrittet | 54 km | Viken |
| Grenserittet | 80 km | Østfold / Sverige |
| Skjebergrittet | 38 km | Østfold |
| Valdresrittet | 54 km | Innlandet |
| Sjusjørittet | 56 km | Innlandet |
| Trysil-Knut / Osensjøen Rundt Gravel | 60 km | Innlandet |

### Sykkel — Landevei

| Arrangement | Distance | Region |
|---|---|---|
| Styrkeprøven | 540 km | Trøndelag / Innlandet |
| Jotunheimen Rundt | 430 km | Innlandet / Vestland |
| Vätternrundan | 300 km | Östergötland |
| Color Line Tour | 210 km | Agder |
| Haugastøl–Bergen | 182 km | Vestland |
| Mjøsrittet | 167 km | Innlandet |
| Lysebotn-Bryne Rittet | 147 km | Rogaland |
| Halvvätternrundan | 150 km | Östergötland |
| Tyrifjorden Rundt | 145 km | Viken |
| Randsfjorden Rundt | 152 km | Viken |
| L'Étape Trondheim | 130 km | Trøndelag |
| Victoriarunden | 120 km | Trøndelag |
| Haugesund-Sauda | 107 km | Rogaland / Vestland |
| Nordmarka Rundt | 148 km | Oslo / Viken |
| Nordsjørittet (Egersund–Flekkefjord) | 91 km | Rogaland |
| Eikerrittet | 90 km | Viken |
| Nordsjørittet (Jæren, Egersund–Sandnes) | 88 km | Rogaland |
| Skjærgårdsrittet | 75 km | Vestland |
| Tour de Lyngen | 94 km | Troms |
| Bergen-Voss | 78 km | Vestland |
| Midnattsolrittet | 46 km | Nordland |
| Tour de Frøya | 44 km | Trøndelag |
| Lysebotn Opp | 14 km | Rogaland |

### Langrenn

| Arrangement | Distance | Region |
|---|---|---|
| Birkebeinerrennet | 53 km | Innlandet |
| SkøyteBirken | 53 km | Innlandet |
| Holmenkollmarsjen | 52 km | Oslo |
| Skarverennet | 44 km | Viken / Vestland |

### Triathlon

| Arrangement | Region |
|---|---|
| Norseman Xtreme Triathlon | Vestland |
| *(+ auto-synced Norwegian triathlon events)* | — |

### Ultraløp

| Arrangement | Distance | Region |
|---|---|---|
| Lofoten Ultra-Trail 100M | 162 km | Nordland |
| Blefjellsbeste | 96 km | Numedal |
| Lofoten Ultra-Trail 50M | 88 km | Nordland |
| Ecotrail Oslo | 80 km | Oslo / Viken |
| Jotunheimen Trail Run Ultra | 73 km | Innlandet |
| UltraBirken Løp | 60 km | Innlandet |

### Løping

| Arrangement | Distance | Region |
|---|---|---|
| Birkebeinerløpet | 21 km | Innlandet |
| Sentrumsløpet | 10 km | Oslo |
| *(+ auto-synced Norwegian road races and trail runs)* | — | — |

---

## Getting started

```bash
bun install
bun run dev              # starts dev server
bun run build            # production build (tsc + vite, includes sitemap generation)
bun run lint             # ESLint (type-aware)
bun run fetch-weather    # refresh src/data/weather-cache.json manually
bun run fetch-triathlon  # refresh src/data/triathlon-events.json manually
bun run fetch-running    # refresh src/data/running-events.json manually
bun run generate-sitemap # regenerate public/sitemap.xml (also runs automatically before build)
```

The weather cache (`src/data/weather-cache.json`) is refreshed nightly via GitHub Actions — you only need `fetch-weather` locally if you want fresh historical data before committing.

---

## Project structure

```
src/
  data/
    arrangements.json            # Curated events with waypoints (sykkel, langrenn, ultraløp, løping)
    triathlon-events.json        # Auto-synced triathlon events
    running-events.json          # Auto-synced running/løping events
    weather-cache.json           # Nightly-refreshed historical weather cache (auto-generated)
  lib/
    weather.ts                   # Open-Meteo forecast + historical fetchers
    wmo.ts                       # WMO weather code → Norwegian label + emoji
    wind.ts                      # Wind direction helpers + relative label (Medvind/Motvind/Sidevind)
    timing.ts                    # Waypoint arrival time calculator from start/finish time
    difficulty.ts                # Difficulty rating derived from weather + route conditions
    arrangements.ts              # Event data helpers and type definitions
    dates.ts                     # Norwegian date formatting, daysUntil, countdown helpers
    disciplines.ts               # Discipline enum and display helpers
    gpx.ts                       # GPX parsing, downsampling, distance calculation, URL fetch
    grouping.ts                  # Group events by year/month for list views
    seo.ts                       # Canonical URL helpers, per-discipline SEO keywords
    stats.ts                     # Statistical utilities (avg, mode) for climate aggregation
  hooks/
    useWeather.ts                # TanStack Query wrapper (useQueries per waypoint)
    useMyEvents.ts               # Bookmark persistence in localStorage
    usePageTitle.ts              # Sets <title> per route
    useDetailsOpen.ts            # Tracks open state of native <details> elements
    usePageTracking.ts           # Fires gtag page_view on route changes
  components/
    EventCard.tsx                # Race card on the home page
    EventMap.tsx                 # Leaflet map with waypoints + OSRM route polyline
    DatePicker.tsx               # Date input with reset-to-official-date button
    TimePicker.tsx               # Start/finish time inputs
    WeatherStrip.tsx             # Row of weather cards + forecast/climate banner
    WeatherCard.tsx              # Per-waypoint: temp, rain, wind, icon
    ElevationProfile.tsx         # SVG elevation chart with waypoint dots
    GearSuggestion.tsx           # Gear recommendations from weather conditions
    HistoricalWeatherTable.tsx   # Historical averages table view
    ShareButton.tsx              # Copy shareable link to clipboard
    NavBar.tsx                   # Top navigation bar
    SiteFooter.tsx               # Footer with attribution links
    ErrorBoundary.tsx            # App-level + per-strip error boundary
    ReloadPrompt.tsx             # PWA update prompt
  pages/
    HomePage.tsx                 # Event grid, sorted by official date
    EventPage.tsx                # Detail: meta + date picker + weather strip
    GpxPage.tsx                  # GPX upload / URL load → derive waypoints + weather
    LopPage.tsx                  # Running events list grouped by year/month
    HvaErRittvaerPage.tsx        # About / SEO landing page
    NotFoundPage.tsx             # 404 catch-all
  App.tsx                        # Router + QueryClientProvider
scripts/
  fetch-weather-cache.ts         # Fetches historical data and writes weather-cache.json
  fetch-triathlon-events.ts      # Fetches triathlon events and writes triathlon-events.json
  fetch-running-events.ts        # Fetches running events and writes running-events.json
  generate-sitemap.ts            # Generates public/sitemap.xml (also runs as prebuild)
```

---

## Tech stack

| | |
|---|---|
| Framework | ![React](https://img.shields.io/badge/-React_19-61DAFB?logo=react&logoColor=black&style=flat-square) ![TypeScript](https://img.shields.io/badge/-TypeScript_6-3178C6?logo=typescript&logoColor=white&style=flat-square) |
| Build | ![Vite](https://img.shields.io/badge/-Vite_8-646CFF?logo=vite&logoColor=white&style=flat-square) ![Bun](https://img.shields.io/badge/-Bun-F9F1E1?logo=bun&logoColor=black&style=flat-square) |
| Routing | ![React Router](https://img.shields.io/badge/-React_Router_v7-CA4245?logo=reactrouter&logoColor=white&style=flat-square) |
| Data fetching | ![TanStack Query](https://img.shields.io/badge/-TanStack_Query_v5-FF4154?logo=reactquery&logoColor=white&style=flat-square) |
| Map | ![Leaflet](https://img.shields.io/badge/-Leaflet-199900?logo=leaflet&logoColor=white&style=flat-square) |
| PWA | ![PWA](https://img.shields.io/badge/-vite--plugin--pwa-5A0FC8?logo=pwa&logoColor=white&style=flat-square) |
| Weather API | ![Open-Meteo](https://img.shields.io/badge/-Open--Meteo-00B4D8?style=flat-square) — free, no auth required |

---

## Roadmap

### Open

- [ ] **Comparison mode** — show official date vs custom date side by side
- [ ] **Hourly breakdown** — expand a waypoint card to show hour-by-hour forecast
- [ ] **Elevation-aware pacing** — `calcFinishTimeFromSpeed` currently uses linear distance; add elevation correction
- [ ] **Tests** — Vitest unit tests for `weather.ts` (mocked fetch) and `wmo.ts`
- [ ] **Offline / PWA** — cache last-fetched weather for use without connectivity
- [ ] **Weather trend indicator** — warmer/colder arrow relative to day before
- [ ] **UV index** — relevant for long summer events on exposed mountain terrain
- [ ] **Wet road risk** — combine recent precip + temp to flag likely icy/wet conditions

### Data quality

- [ ] **Verify waypoint coordinates** — several events are manually curated; cross-check against GPX files or Strava segments
- [ ] **Altitude values** — confirm `altitude` per waypoint for accurate temperature correction
- [ ] **Official dates** — update `arrangements.json` each year when terminlisten is published
- [ ] **Triathlon waypoints** — most triathlon events currently have only a single waypoint (venue); expand with swim/bike/run course points
- [ ] **Løping waypoints** — auto-synced running events have only a single start/finish waypoint; add intermediate course points where GPX data is available

### Done

- [x] **Langrenn** — cross-country ski races added (Birkebeinerrennet, Holmenkollmarsjen, SkøyteBirken, Skarverennet)
- [x] **Triathlon** — Norwegian triathlon events added (Norseman etc.) via auto-synced feed
- [x] **Ultraløp** — Norwegian ultra runs added; waypoint model supports running disciplines
- [x] **Løping** — Norwegian road races and trail runs added via auto-synced feed; dedicated `/løp` page
- [x] **GPX upload** — derive waypoints automatically from a GPX file (drag-and-drop, URL load, waypoint count slider, export guides for Strava/Garmin/Komoot)
- [x] **Official start time pre-fill** — start time pre-populated from known mass-start time per event

---

## Contributing

Contributions are welcome! Here's how to get started:

**Adding a ritt:** Edit `src/data/arrangements.json` — each entry needs an `id`, `name`, `discipline`, `distance`, `elevationGain`, `region`, `officialDate`, and a `waypoints` array with `lat`/`lon`/`altitude` per point. See existing entries for the full schema. Waypoint coordinates should be verified against GPX files or race maps.

**Reporting issues or suggesting events:** Open an issue at [github.com/vegaasen/loypevaer/issues](https://github.com/vegaasen/loypevaer/issues).

**Before submitting a PR:** Run `bun run lint && bun run build` — both must pass. There is no test suite yet.

---

## Data sources

- Weather: [Open-Meteo](https://open-meteo.com) — free, CORS-friendly, no API key required
- Race calendar: [sykling.no](https://sykling.no/sykkelritt/terminliste/)
- EQTimer APIs: https://api.eqtiming.com/docs#!/Event
- Route waypoints: manually curated from maps and race websites

---

## License

[MIT](./LICENSE) © Vegard Aasen
