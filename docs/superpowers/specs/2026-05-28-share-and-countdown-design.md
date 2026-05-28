# Design Spec: Shareable Event URL & Race Day Countdown Widget

**Date:** 2026-05-28  
**Status:** Approved  
**Scope:** Two additive UI features on `EventPage`

---

## Background

Løypevær already syncs the user's selected date and start/finish times into URL query params (`?date=&start=&finish=`). This means the current view is already technically shareable — it just lacks a visible affordance and rich link preview metadata. This spec adds that polish, plus a race day countdown widget.

---

## Feature 1: Shareable Event URL

### Goal

Allow users to copy a link to their specific event + date + timing setup and share it in a group chat, social post, or message. The link should unfurl nicely (title, description, image) in iMessage, WhatsApp, Slack, and similar.

### User flow

1. User arrives at an event page, optionally sets a date and start/finish times.
2. User clicks a **"Del"** (Share) button.
3. URL is copied to clipboard. On browsers supporting the Web Share API (`navigator.share`), the native share sheet opens instead.
4. A brief **"Kopiert!"** snackbar confirmation appears (own component, separate from FeedbackSnackbar).
5. When a recipient opens the link, they land on the exact same view (event + date + times pre-filled via existing query params).

### Share button placement

In the event page header area, near the event title/meta row. Icon: chain-link or native share icon (SVG inline). Button label: "Del".

### Rich unfurl (og: meta tags)

Dynamic `<meta>` tags injected via a new `<EventPageMeta>` component using `react-helmet-async` on `EventPage`, replacing the existing `<PageMeta>` call for this page:

| Tag | Value |
|---|---|
| `og:title` | `{event.name} · {formattedDate}` e.g. "Birkebeinerrittet · 14. juni 2025" |
| `og:description` | Weather summary string, e.g. "Start: 12°C, lett bris · Rødsjølia: 9°C, sterk vind · Mål: 15°C" — falls back to existing description if weather not loaded |
| `og:url` | Canonical URL including current `?date=` param (not start/finish — too noisy) |
| `og:image` | Static per-discipline image from `public/og/{discipline}.jpg` with fallback to `public/og/default.jpg` |
| `og:type` | `website` |
| `twitter:card` | `summary_large_image` |

**Note on og:image:** Social crawlers fetch og:image server-side and cannot run JS on an SPA. Use static branded discipline images. One image per discipline group: `sykkel.jpg` (landevei/terreng/cx/gravel), `langrenn.jpg`, `triathlon.jpg`, `lop.jpg` (løping/ultraløp), `default.jpg` fallback. Simple: blurred outdoor backdrop + Løypevær wordmark as text overlay (can be created with CSS/SVG or simple image editor).

### New utilities in `src/lib/`

- `buildOgDescription(waypoints, weatherResults)` — assembles "Start: 12°C, lett bris · ..." string. Returns `null` if no weather data.
- `getOgImagePath(discipline, baseUrl)` — maps discipline → `/og/{file}.jpg` path.

---

## Feature 2: Race Day Countdown Widget

### Goal

A compact status block on EventPage showing how far away the race is and whether a forecast is available.

### Display rules

| Condition | Shows |
|---|---|
| Event has no date set, or `selectedDate` is empty | Hidden (returns null) |
| Event date is in the past | Hidden |
| Event is today | "Det er i dag! Lykke til!" (no forecast summary) |
| Event is 1–16 days away | "{N} dager til start" + "Prognose klar!" + start waypoint: temp + wind description |
| Event is 17+ days away | "{N} dager til start" + "Prognose tilgjengelig om ca. {N-16} dager" + climate note |

"1 dag" / "dager" grammatical handling: singular for 1, plural otherwise.

### Widget layout

Compact banner above the weather strip:

```
┌──────────────────────────────────────────────────┐
│  📅  14 dager til start                          │
│  ✅  Prognose klar!  –  Start: 11°C, lett bris   │
└──────────────────────────────────────────────────┘
```

### Component

New component: `src/components/RaceDayCountdown.tsx`

```ts
type Props = {
  selectedDate: string;          // "YYYY-MM-DD"
  startWaypointWeather: WeatherData | null;
};
```

- Derives days-to-race from `selectedDate` vs `new Date()` client-side.
- Uses `isForecastRange(selectedDate)` from `src/lib/weather.ts` to determine forecast availability.
- Formats wind description using `windDescription(windSpeed)` from `src/lib/wind.ts` (or equivalent).
- No new data fetching — uses weather already loaded by EventPage.

### Placement

Rendered in `EventPage` between the date/time picker section and the `<WeatherStrip>`.

---

## Out of scope

- Dynamic og:image generation (server-side rendering / edge functions)
- Push notifications / alerts for bookmarked events
- Canvas/image export for social sharing

---

## Success criteria

1. Clicking "Del" on any event page copies the URL to clipboard (or opens native share sheet) and shows a "Kopiert!" snackbar.
2. Pasting the link in iMessage/Slack shows event name + date in title and discipline image in the unfurl preview.
3. `og:description` updates when weather data loads.
4. Countdown widget renders correctly for: no date, past event, today, 1–16 days out, 17+ days out.
5. No regressions on existing EventPage features.
6. `bun run lint && bun run test && bun run build` passes.
