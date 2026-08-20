# Design: Statistikk page — weather rankings across all events

_Date: 2026-08-20_

## Goal

A new `/statistikk` route (linked from the nav) showing weather-based rankings for all events across all disciplines. Sections are per-discipline, sharing common components. Data is pre-computed at build time.

## Data pipeline

`scripts/generate-weather-stats.ts` reads:
- All events from all JSON data files (same merge as `allArrangements`)
- `public/weather-cache.json` → `historicalByYear` entries

Per event it computes a **weather profile** averaged across all waypoints and all available years:

| Field | Description |
|---|---|
| `avgTempMax` | Mean daily max temp (°C) |
| `avgPrecipitation` | Mean precipitation (mm) |
| `avgWindSpeed` | Mean wind speed (m/s) |
| `comfortScore` | Composite: warm+dry+low wind (higher = better) |
| `dataYears` | Number of years with data (0 = no data) |

Output: `src/data/weather-stats.json` — one entry per event ID.

Script added as `bun run generate-stats` in `package.json`. Runs before build in CI.

## Page layout

Route: `/statistikk`

Single page with per-discipline collapsible/flat sections. Each section has ranked lists:

- **Beste vær** — top 5 by `comfortScore` desc
- **Varmeste** — top 5 by `avgTempMax` desc
- **Kaldeste** — top 5 by `avgTempMax` asc
- **Mest nedbør** — top 5 by `avgPrecipitation` desc
- **Mest vind** — top 5 by `avgWindSpeed` desc

Events with `dataYears === 0` appear at the bottom of each list with a "ikke nok data" badge.

## Components

- `StatistikkPage.tsx` — page shell, discipline sections
- `WeatherRankingList.tsx` — shared ranked list component (takes items + metric key)
- `WeatherStatBadge.tsx` — small inline metric display (value + unit + icon)

## Routing & nav

- New route `/statistikk` in `App.tsx`
- Nav link "Statistikk" added to both desktop and mobile nav in `NavBar.tsx`

## TypeScript types

```ts
// src/data/weather-stats.types.ts
export interface EventWeatherStats {
  id: string;
  name: string;
  discipline: Discipline;
  officialDate: string;
  region: string;
  avgTempMax: number | null;
  avgPrecipitation: number | null;
  avgWindSpeed: number | null;
  comfortScore: number | null;
  dataYears: number;
}
```
