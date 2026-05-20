# Climate Storytelling in WeatherCard — Design Spec

## Goal

Show a per-waypoint historical climate badge ("Typisk regnvær", "Vått og blåsende", etc.) inside each `WeatherCard`, always visible and clearly differentiated from the live forecast above it. Uses the existing 10-year `historicalByYear` data already in `weather-cache.json`.

---

## Data

`weather-cache.json` already contains `historicalByYear`, keyed `lat,lon,MM,DD,YYYY`. For a given waypoint + race date we can look up up to 10 year-entries (2015–2024) and characterise the typical conditions.

**Classification thresholds** (majority = ≥ 5 of 10 years):
- **Rain**: `precipitation > 1 mm`
- **Wind**: `windSpeed > 20 km/h` (reuses existing `WIND_STRONG` threshold)
- **Cold**: `tempMax < 5°C` (reuses existing `TEMP_VERY_COLD` threshold)

---

## Label Table

| Rain | Wind | Cold | Norwegian label |
|---|---|---|---|
| ✓ | | | Typisk regnvær |
| | ✓ | | Kjent for kraftig vind |
| | | ✓ | Historisk kaldt |
| ✓ | ✓ | | Vått og blåsende |
| ✓ | | ✓ | Kaldt og vått |
| | ✓ | ✓ | Kaldt og blåsende |
| ✓ | ✓ | ✓ | Krevende forhold |
| | | | Variert vær |

---

## Architecture

### New file: `src/lib/climateStory.ts`

Pure function, no React, fully unit-testable.

```ts
export type ClimateStoryInput = {
  precipitation: number;
  windSpeed: number;
  tempMax: number;
}[];

export function getClimateStoryLabel(years: ClimateStoryInput): string
```

Takes up to 10 historical data points for a waypoint, returns a Norwegian label string.

### New helper: `getHistoricalYears(cache, waypoint, date)` in `src/lib/weather.ts`

Extracts the 10 `historicalByYear` entries for a waypoint + calendar date from the already-loaded cache object. Returns `ClimateStoryInput`.

### WeatherCard

- Receives new optional prop: `historicalYears?: ClimateStoryInput`
- When present, renders a `ClimateHistoryBadge` below a `<hr>` divider

### New component: `src/components/ClimateHistoryBadge.tsx`

Tiny component: renders the "Historisk" label and storytelling badge pill.

### WeatherStrip (parent of WeatherCard)

Passes `historicalYears` to each `WeatherCard`. Reads from the already-loaded weather cache.

---

## UI Design

```
┌──────────────────────────────────┐
│  ⛅ Lettskyet                    │ ← forecast (unchanged)
│  12° / 4°   💨 22 km/t          │
│  ☔ 2.3 mm                       │
│ ────────────────────────────── │
│  Historisk  [Vått og blåsende]   │ ← new section
└──────────────────────────────────┘
```

The "Historisk" label is muted/small. The badge pill matches the card's existing badge styling but desaturated.

---

## Testing

- `src/lib/climateStory.test.ts` — unit tests for all 8 label combinations + edge cases (0 years, exactly 5/10 threshold)
- `WeatherCard.test.tsx` — snapshot/render test confirming badge renders when `historicalYears` is provided and is absent when not

---

## What this is NOT

- No new API calls — 100% derived from already-cached data
- No tooltip or expand interaction in v1
- The existing "Klimasnitt" badge is unchanged — it signals the *current forecast* is historical, not the summary
