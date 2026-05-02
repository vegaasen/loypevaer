# Contributing to Løypevær

Thanks for your interest in contributing! This document covers everything you need to get started.

## Getting started

```bash
bun install
bun run dev        # start local dev server at http://localhost:5173
bun run lint       # ESLint with type-aware rules
bun run build      # typecheck (tsc) + production build
```

Both `lint` and `build` must pass before submitting a PR.

## Ways to contribute

### Add or update a cycling ritt

Edit `src/data/arrangements.json`. Each entry must follow this schema:

```jsonc
{
  "id": "kebab-case-id",           // used in the URL: /arrangement/<id>
  "name": "Ritt Name",
  "discipline": "landevei",        // "landevei" or "terreng"
  "distance": 88,                  // km
  "elevationGain": 1200,           // metres
  "region": "Innlandet",
  "officialDate": "2025-08-23",    // ISO date — update each season
  "officialStartTime": "08:00",    // optional HH:MM
  "url": "https://example.no/",   // optional race website
  "waypoints": [
    { "label": "Start – Rena", "lat": 60.123, "lon": 10.456, "altitude": 200 },
    // ...
  ]
}
```

**Waypoint coordinates must be verified** against GPX files or official race maps — please don't use rough approximations.

For triathlon, running, and other auto-synced events, see [Auto-generated data](#auto-generated-data) below.

### Fix a bug or improve a feature

Open an issue first if the change is significant, so we can align before you invest time in it. For small fixes, a PR is fine without prior discussion.

### Suggest an event

Use the [suggest a ritt](https://github.com/vegaasen/loypevaer/issues/new?template=suggest-ritt.yml) issue template.

## Auto-generated data

Do **not** manually edit these files — they are overwritten by scheduled GitHub Actions workflows:

| File | Source script | Workflow |
|---|---|---|
| `src/data/weather-cache.json` | `scripts/fetch-weather-cache.ts` | Nightly |
| `src/data/triathlon-events.json` | `scripts/fetch-triathlon-events.ts` | Scheduled |
| `src/data/running-events.json` | `scripts/fetch-running-events.ts` | Monday 04:30 UTC |

## Code conventions

- **TypeScript strict mode** — no `any`, no implicit returns, no unused vars.
- **Bun** is the runtime and package manager — use `bun add` / `bun remove`, not `npm install`.
- **No component library** — styling is plain CSS in `src/index.css` and `App.css`.
- **No test suite yet** — Vitest is on the roadmap; don't add test runner config without discussion.
- ESLint uses `tseslint.configs.recommendedTypeChecked` — type-aware rules are enforced. Fix all lint errors before submitting.

## Submitting a PR

1. Fork the repo and create a branch from `main`.
2. Make your changes.
3. Run `bun run lint && bun run build` — both must pass.
4. Open a pull request against `main`. The PR template will guide you through the checklist.
