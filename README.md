# Rittvær 🚴

**Sjekk været langs ruten for norske sykkelritt.**

Pick a Norwegian cycling race, choose a date, and get weather conditions at ~5 key points along the route — from start to finish. Uses live forecasts when the date is close, and 10-year historical climate averages when planning further ahead.

---

## Features

- Browse 10 well-known Norwegian sykkelritt with official race dates
- Select any date to see weather along the route
- **Forecast mode** — live data from Open-Meteo when the date is ≤ 16 days away
- **Climate average mode** — 10-year historical average (2015–2024) for dates further in the future
- Shareable URLs — date is stored in the query string (`/ritt/birkebeinerrittet?date=2025-08-23`)

## Ritt included

| Ritt | Distance | Region |
|---|---|---|
| Birkebeinerrittet | 88 km | Innlandet |
| Styrkeprøven | 540 km | Trøndelag / Innlandet |
| Jotunheimen Rundt | 322 km | Innlandet / Vestland |
| Nordsjørittet | 91 km | Rogaland |
| Grenserittet | 160 km | Innlandet / Viken |
| Valdresrittet | 130 km | Innlandet |
| Mjøsrittet | 167 km | Innlandet |
| Haugastøl–Bergen | 182 km | Vestland |
| Rallarvegen | 82 km | Vestland / Viken |
| Lysebotn Opp | 14 km | Rogaland |

---

## Getting started

```bash
bun install
bun run dev       # opens browser automatically
bun run build     # production build
bun run lint      # ESLint
```

## Project structure

```
src/
  data/
    ritt.json              # Curated ritt with 5 waypoints each
  lib/
    weather.ts             # Open-Meteo forecast + historical fetchers
    wmo.ts                 # WMO weather code → Norwegian label + emoji
  hooks/
    useWeather.ts          # TanStack Query wrapper
  components/
    RittCard.tsx           # Race card on the home page
    DatePicker.tsx         # Date input with reset-to-official-date button
    WeatherStrip.tsx       # Row of weather cards + forecast/climate banner
    WeatherCard.tsx        # Per-waypoint: temp, rain, wind, icon
  pages/
    HomePage.tsx           # Ritt grid, sorted by official date
    RittPage.tsx           # Detail: meta + date picker + weather strip
  App.tsx                  # Router + QueryClientProvider
```

## Tech stack

| | |
|---|---|
| Framework | React 19 + TypeScript (strict) |
| Build | Vite 8, Bun |
| Routing | react-router-dom v7 |
| Data fetching | TanStack Query v5 |
| Weather API | [Open-Meteo](https://open-meteo.com) (free, no auth) |

---

## TODO

### v1 polish

- [ ] **Design system** — pick and integrate a component library (e.g. shadcn/ui, Radix + Tailwind); replace bare HTML with styled components
- [ ] **Responsive layout** — WeatherStrip scrolls horizontally on mobile; HomePage grid collapses to single column
- [ ] **Loading skeletons** — replace plain "Laster..." text with skeleton cards during fetch
- [ ] **Error boundary** — graceful fallback if Open-Meteo is unreachable
- [ ] **Page titles** — set `<title>` per route (e.g. "Birkebeinerrittet – Rittvær")
- [ ] **404 page** — not-found route for unknown ritt IDs and unknown paths

### v2 features

- [ ] **Map view** — Leaflet map with waypoint pins on the ritt detail page
- [ ] **GPX upload** — derive waypoints automatically from a GPX file
- [ ] **More ritt** — expand beyond 10; sync with [sykling.no terminliste](https://sykling.no/sykkelritt/terminliste/) each season
- [ ] **Langrenn** — add cross-country ski races (e.g. Birkebeinerrennet, Holmenkollmarsjen) with a `type` field in the data model
- [ ] **Copy link button** — explicit share button alongside the existing URL-based state
- [ ] **Comparison mode** — show official date vs custom date side by side
- [ ] **Hourly breakdown** — expand a waypoint card to show hour-by-hour forecast
- [ ] **Wind direction** — add degrees → compass label to WeatherCard

### Data quality

- [ ] **Verify waypoint coordinates** — 10 ritt are manually curated; cross-check against GPX files or Strava segments
- [ ] **Altitude values** — confirm `altitude` per waypoint for accurate temperature correction
- [ ] **Official dates** — update `ritt.json` each year when terminlisten is published

### Technical

- [ ] **Fix `useWeather` hook** — refactor from `useQuery` in a loop to [`useQueries`](https://tanstack.com/query/latest/docs/framework/react/reference/useQueries) (rules of hooks)
- [ ] **Tests** — Vitest unit tests for `weather.ts` (mocked fetch) and `wmo.ts`
- [ ] **CI** — GitHub Actions: typecheck + lint + test on push/PR
- [ ] **Deployment** — Vercel / Cloudflare Pages / Azure Static Web Apps
- [ ] **ESLint type-aware rules** — upgrade to `tseslint.configs.recommendedTypeChecked`

### Nice to have

- [ ] **Dark mode** — respect `prefers-color-scheme`
- [ ] **Offline / PWA** — cache last-fetched weather for use without connectivity
- [ ] **Weather trend indicator** — warmer/colder arrow relative to day before

---

## Data sources

- Weather: [Open-Meteo](https://open-meteo.com) — free, CORS-friendly, no API key required
- Race calendar: [sykling.no](https://sykling.no/sykkelritt/terminliste/)
- EQTimer' APIs: https://api.eqtiming.com/docs#!/Event
- Route waypoints: manually curated from maps and race websites
