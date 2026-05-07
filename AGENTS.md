# AGENTS.md

Guidelines for AI coding agents working in this repository.

## What this project is

**Løypevær** is a React + TypeScript single-page app that shows weather forecasts and historical climate averages at key waypoints along Norwegian endurance races — sykkelritt, langrenn, triathlon, and ultraløp. It uses the free [Open-Meteo](https://open-meteo.com) API — no API key needed. The app is deployed to both GitHub Pages at [vegaasen.github.io/loypevaer](https://vegaasen.github.io/loypevaer/) and via AWS (S3 + CloudFront).

> Note: the repository/directory is named `rittvær`; the app brand name is **Løypevær**.

## Commands

```bash
bun install                # install dependencies
bun run dev                # start dev server (Vite)
bun run build              # typecheck (tsc -b) + production build (also auto-runs generate-sitemap as prebuild)
bun run lint               # ESLint with type-aware rules
bun run fetch-weather      # refresh src/data/weather-cache.json from Open-Meteo
bun run fetch-cycling      # refresh src/data/cycling-events.json from NCF/EQ Timing API
bun run fetch-triathlon    # refresh src/data/triathlon-events.json
bun run fetch-running      # refresh src/data/running-events.json
bun run generate-sitemap   # generate sitemap (also runs automatically before every build)
bun run preview            # preview production build locally (vite preview)
```

**There is no test suite yet.** Do not run `vitest`, `jest`, or `npm test` — they will fail. Adding Vitest is an open roadmap item.

CI runs `lint` + `build` on every push/PR. Always verify both pass before considering a task done:

```bash
bun run lint && bun run build
```

## Key conventions

- **TypeScript strict mode** — no `any`, no implicit returns, no unused vars.
- **Bun** is the runtime and package manager. Use `bun add` / `bun remove`, not `npm`.
- **ESLint** uses `tseslint.configs.recommendedTypeChecked` — type-aware rules are enforced.
- **No component library** — styling is plain CSS in `src/index.css` and `App.css`.
- **No backend** — everything runs in the browser; data fetching is client-side only.

## Project layout

```
src/data/arrangements.json   # Hand-curated events for langrenn and other non-auto-synced disciplines — edit this to add/modify
src/data/cycling-manual.json # Hand-curated cycling events NOT available via NCF/EQ Timing API — edit this to add/modify
src/data/cycling-events.json # Auto-generated from NCF/EQ Timing API; do NOT manually edit
src/data/cycling-waypoints.json # Manual waypoint enrichment for auto-fetched cycling events; edit via enrich-cycling-waypoints.ts
src/data/triathlon-events.json # Auto-generated; do NOT manually edit
src/data/running-events.json # Auto-generated; do NOT manually edit
src/data/weather-cache.json  # Auto-generated nightly; do NOT manually edit
src/context/                 # React context providers and hooks
src/lib/                     # Pure utility functions (no React)
src/hooks/                   # React hooks (TanStack Query wrappers + localStorage)
src/components/              # UI components
src/pages/                   # Route-level page components
scripts/                     # Node/Bun scripts run outside the browser bundle
infra/                       # Terraform configuration for AWS (S3, CloudFront, ACM, Route53)
```

## Adding an event

Which file to edit depends on the discipline and whether the event is auto-fetched:

| Discipline | Auto-fetched? | File to edit |
|---|---|---|
| Langrenn, or any discipline without an auto-sync script | No | `src/data/arrangements.json` |
| Cycling — **not** listed in the NCF/EQ Timing API | No | `src/data/cycling-manual.json` |
| Cycling — already fetched by NCF/EQ Timing, but missing waypoints | Yes (auto) | `src/data/cycling-waypoints.json` via `enrich-cycling-waypoints.ts` |
| Triathlon, running | Yes (auto) | Do not edit — fix the fetch script or source data |

### `arrangements.json` — langrenn and other manual events

Edit `src/data/arrangements.json`. Each entry must follow the existing schema:

```jsonc
{
  "id": "kebab-case-id",            // used in the URL: /arrangement/<id>
  "name": "Event Name",
  "discipline": "langrenn",         // "langrenn", "landevei", "terreng", etc.
  "distance": 53,                   // km
  "elevationGain": 1121,            // metres
  "region": "Innlandet",
  "officialDate": "2025-03-14",     // ISO date, update each season
  "officialStartTime": "08:00",     // optional HH:MM
  "url": "https://example.no/",     // optional race website
  "waypoints": [
    { "label": "Start – Rena", "lat": 60.123, "lon": 10.456, "altitude": 200 },
    ...
  ]
}
```

### `cycling-manual.json` — hand-curated cycling events

Edit `src/data/cycling-manual.json` for cycling events that are **not** available via the NCF/EQ Timing API. The schema is the same as above plus an optional `distanceLabel` field for display purposes. Waypoints are inline.

### `cycling-waypoints.json` — waypoint enrichment for NCF-fetched events

If an event is already auto-fetched from the NCF API but has no waypoints, use the enrichment script:

```bash
bun scripts/enrich-cycling-waypoints.ts <event-id> <path/to/route.gpx>
```

This samples 5 evenly-spaced waypoints from the GPX, fetches terrain altitudes from Open-Meteo, and writes them into `cycling-waypoints.json`. They are merged into `cycling-events.json` on the next `bun run fetch-cycling` run.

Waypoint coordinates should be verified against GPX files or race maps — many are still manually approximated.

## Weather cache

`src/data/weather-cache.json` is written by `scripts/fetch-weather-cache.ts` and committed by a nightly GitHub Actions workflow (`.github/workflows/refresh-weather.yml`). It holds pre-fetched historical averages so the app works without hitting the API on every load for far-future dates. Do not hand-edit this file.

`src/data/triathlon-events.json` is written by `scripts/fetch-triathlon-events.ts` and committed by `.github/workflows/refresh-triathlon.yml`. Do not hand-edit this file.

`src/data/running-events.json` is written by `scripts/fetch-running-events.ts` and committed by `.github/workflows/refresh-running.yml`. Do not hand-edit this file.

## CI / deploy

| Workflow | Trigger | What it does |
|---|---|---|
| `ci.yml` | push/PR (non-doc files) | lint + build |
| `pages.yml` | push to `main` (non-doc files) | build + deploy to GitHub Pages |
| `deploy-aws.yml` | push to `main` (non-doc files) | build + deploy to AWS (S3 + CloudFront) |
| `refresh-weather.yml` | nightly 03:00 UTC + manual | fetch weather cache + commit |
| `refresh-triathlon.yml` | scheduled + manual | fetch triathlon events + commit |
| `refresh-running.yml` | Monday 04:30 UTC + manual | fetch running events + commit |
| `infra.yml` | manual | Terraform plan/apply/destroy for AWS infra |
| `dependabot-automerge.yml` | Dependabot PRs | auto-merge Dependabot updates via squash |

Markdown files and issue templates are excluded from triggering CI and deploy via `paths-ignore`.
