# Visual Refresh — Løypevær (2026-05-11)

## Goal

Make the app feel more contemporary and visually striking while retaining full usability.
Inspired by 2026 web design trends: bold/expressive typography and bento-grid layouts.
Approach is additive and low-risk — no routing, data model, or dependency changes.

## Scope

- **In scope:** `HomePage.tsx`, `EventCard.tsx`, new `FeaturedEventCard` component, `index.css`, minor `LopPage.tsx` hero tweak
- **Out of scope:** `EventPage.tsx`, `GpxPage.tsx`, `LopPage.tsx` (beyond hero), dark mode (inherits automatically via existing CSS variables), new fonts/dependencies

---

## 1. Typography System

### 1.1 Hero headings (`h1`)

| Breakpoint | Current | New |
|---|---|---|
| Desktop (≥1024px) | 64px | 88px |
| Tablet (640–1023px) | 40px | 52px |
| Mobile (<640px) | 32px | 36px |

- `letter-spacing`: `-2px` (from `-1.5px`)
- Font: Playfair Display 800 — unchanged
- Allow natural 2-line wrap; do not force single line
- Hero subtext (`home-page__hero-sub`): increase to `20px` / `1.6` line-height on desktop (currently unstyled beyond base)

### 1.2 Year headings (`home-page__year-heading`)

- Font: Playfair Display 800 (switch from whatever it currently is)
- Size: `72px`, color: `color-mix(in srgb, var(--text) 18%, transparent)` — large, decorative, ambient
- Position: The heading text itself sits at normal contrast; the oversized size creates depth via the text itself rather than a pseudo-element, keeping markup clean
- `line-height: 1`, `margin-bottom: 0.25em`

### 1.3 Month headings (`home-page__month-heading`)

- Currently: `13px` monospace uppercase
- New: `15px`, keep monospace + uppercase, increase `margin-bottom` from current to `1.25rem`
- Add `letter-spacing: 0.12em` for slightly more presence

### 1.4 Event card titles

- Switch `font-family` from `--sans` (Inter) to `--heading` (Playfair Display)
- Size: `18px` on standard cards, `20px` on featured cards (see section 2)
- `font-weight: 700`
- `line-height: 1.2`

---

## 2. Bento Featured Section

### 2.1 What it replaces

- **Removes:** `home-page__upcoming-section` ("Kommer snart") — the existing section showing events within 14 days as standard cards
- **Removes:** `home-page__cta-banner` at the bottom of the page — now redundant
- **Adds:** A new `home-page__featured-section` above the main year/month grid

### 2.2 Data logic

A new utility function `getNextPerDiscipline(events: RittEntry[]): RittEntry[]`:

- Groups all non-cancelled, non-past events by discipline
- Returns the single soonest upcoming event per discipline
- Sorts the result by `officialDate` ascending
- Caps at **7 entries** maximum
- Disciplines covered: landevei, terreng, langrenn, triathlon, ultraløp (løping excluded — it has its own page)
- If no upcoming events exist for any discipline, the section is hidden entirely

### 2.3 `FeaturedEventCard` component

New file: `src/components/FeaturedEventCard.tsx`

**Props:** same shape as `EventCard` (id, name, officialDate, distance, distanceLabel, region, discipline, planned, dateStatus, onTogglePlanned) — no new data requirements.

**Visual design:**
- Card is taller than a standard `EventCard` — min-height `220px` on desktop
- Left accent border: `4px solid` using the discipline color (same color map already used for badge chips)
- Large discipline badge (same pill style, slightly larger padding)
- Event name: Playfair Display 700, `24px`, high contrast (`--text-h`)
- Large stat row: distance as `{n} km` in a large monospace numeral (`36px`, `--accent` color), region as secondary label beneath
- Countdown badge: prominent, top-right corner, same style as existing countdown but slightly larger
- Bookmark button: same as `EventCard`
- Hover: `translateY(-3px)` + slightly deeper shadow — more lift than standard cards
- Cancelled/past states: same desaturated/sepia treatment as `EventCard`

### 2.4 Bento grid layout

CSS class: `home-page__featured-grid`

```
Desktop (≥1024px):
  - CSS Grid, 3 columns, `auto-fill` with `minmax(280px, 1fr)`
  - First card (index 0): `grid-column: span 2` — double-wide
  - All others: `grid-column: span 1`
  - If only 1 card: spans full width (`span 3`)
  - If 2 cards: first spans 2, second spans 1

Tablet (640–1023px):
  - 2 columns
  - First card: `grid-column: span 2` (full width)
  - Rest: `span 1`

Mobile (<640px):
  - 1 column, all cards full width
  - No spanning
```

### 2.5 Section heading

- Text: "Neste arrangement" (or hidden if no featured events)
- Style: `h2`, monospace eyebrow treatment (same as `home-page__feature-eyebrow` class)
- `margin-bottom: 1.5rem`

---

## 3. CSS Token Cleanup (opportunistic)

While touching `index.css`, define the currently-undefined tokens that appear in the codebase. This prevents silent `unset` fallbacks:

| Token | Suggested value |
|---|---|
| `--text-muted` | `color-mix(in srgb, var(--text) 60%, transparent)` |
| `--text-secondary` | `color-mix(in srgb, var(--text) 75%, transparent)` |
| `--text-sm` | `0.875rem` |
| `--surface` | `var(--code-bg)` |
| `--surface-2` | `color-mix(in srgb, var(--bg) 60%, var(--border))` |
| `--bg-card` | `#ffffff` (dark: `#1a2414`) |
| `--bg-subtle` | `color-mix(in srgb, var(--bg) 80%, var(--border))` |
| `--space-xs` | `0.5rem` |
| `--space-lg` | `2rem` |
| `--space-xl` | `3.5rem` |
| `--warning` | `#c0542a` (reuse `--accent-warm`) |

Dark mode overrides for `--bg-card` and `--surface` should be added inside the existing `prefers-color-scheme: dark` block.

---

## 4. What Does NOT Change

- Routing, URLs, page structure
- `EventCard` component props/API (only internal font-family tweak)
- `EventPage.tsx` detail page
- Weather cards, elevation profile, map
- Dark mode (inherits automatically)
- No new npm dependencies
- `LopPage.tsx` hero gets the same `h1` size bump as `HomePage.tsx` — nothing else

---

## 5. Files Changed

| File | Change |
|---|---|
| `src/index.css` | Typography token updates, year/month heading styles, card title font, featured grid CSS, new token definitions |
| `src/pages/HomePage.tsx` | Add `FeaturedEventCard` section, remove "Kommer snart" section, remove CTA banner |
| `src/components/FeaturedEventCard.tsx` | New component |
| `src/lib/arrangements.ts` | Add `getNextPerDiscipline` utility alongside existing `getNextRitt` |
| `src/components/EventCard.tsx` | Switch card title to `--heading` font |
| `src/pages/LopPage.tsx` | Hero `h1` size bump only |

---

## 6. Success Criteria

- `bun run lint && bun run test && bun run build` all pass
- Home page hero feels dramatically more typographic on first load
- Featured bento section shows 1–5 cards in practice, never more than 7
- First featured card is visibly wider/more prominent than the rest
- Standard `EventCard`s in the main grid have Playfair Display titles
- No regressions on `EventPage`, `GpxPage`, `LopPage` detail content
- Dark mode continues to work without additional changes
