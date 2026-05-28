# Arrangement Page Declutter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Declutter the arrangement/event page by surfacing weather above the fold, improving header hierarchy, and collapsing secondary sections by default.

**Architecture:** Reorder sections in `EventPage.tsx` (date pickers → weather moves up; map + elevation move down), restructure the header JSX to split primary/secondary info into two rows, and wrap ElevationProfile and GearSuggestion in `<details>` elements matching the existing collapsible pattern. CSS changes in `src/index.css` to support the new header layout and improved weather card visual hierarchy.

**Tech Stack:** React + TypeScript, plain CSS (no component library), existing `<details>` collapsible pattern already used by `HistoricalWeatherTable` and `EventMap`.

---

### Task 1: Restructure the header into primary + secondary rows

**Files:**
- Modify: `src/pages/EventPage.tsx:219-265`
- Modify: `src/index.css` (`.ritt-page__header`, `.ritt-page__meta`, add new classes)

The goal: h1 + difficulty badge on the first line, key stats (distance · elevation · region) as a compact secondary line, and a third "actions" line for date / URL / bookmark / share — all visually lighter.

- [ ] **Step 1: Update the header JSX in `EventPage.tsx`**

Replace lines 219–265 with:

```tsx
<header className="ritt-page__header">
  <div className="ritt-page__title-row">
    <h1>{rittData.name}</h1>
    {!forecastOnly && physDifficulty && (
      <span
        className={`ritt-page__difficulty-badge ritt-page__difficulty-badge--${physDifficulty.level}`}
      >
        {physDifficulty.label}
      </span>
    )}
  </div>
  <div className="ritt-page__stats-row">
    <span>{rittData.distanceLabel ?? `${rittData.distance} km`}</span>
    {elevationGain != null && (
      <span className="ritt-page__stats-elevation">↑ {elevationGain} m</span>
    )}
    <span>{rittData.region}</span>
  </div>
  <div className="ritt-page__actions-row">
    <span className="ritt-page__actions-date">
      {formattedOfficialDate}
      {rittData.dateStatus === "pending" && (
        <span className="ritt-page__pending-badge" title="Datoen er ikke offisielt bekreftet ennå">
          Tentativ
        </span>
      )}
    </span>
    {rittData.url && (
      <a
        href={rittData.url}
        target="_blank"
        rel="noopener noreferrer"
        className="ritt-page__meta-link"
        onClick={() => trackExternalLinkClick(rittData.url!, rittData.name)}
      >
        Offisiell nettside ↗
      </a>
    )}
    <button
      className={`ritt-page__bookmark-btn${planned ? " ritt-page__bookmark-btn--active" : ""}`}
      onClick={handleBookmarkToggle}
      aria-pressed={planned}
      title={planned ? "Fjern fra mine arrangement" : "Legg til mine arrangement"}
    >
      {planned ? "📌 Mine arrangement" : "📍 Legg til mine arrangement"}
    </button>
    <ShareButton url={shareUrl} />
  </div>
</header>
```

- [ ] **Step 2: Add/update CSS for the new header rows in `src/index.css`**

Find `.ritt-page__header` (line ~2495) and add these rules after it (before `.ritt-page__meta`):

```css
.ritt-page__title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;

  h1 {
    margin: 0;
  }
}

.ritt-page__stats-row {
  display: flex;
  align-items: center;
  gap: 6px 16px;
  flex-wrap: wrap;
  font-size: 14px;
  color: var(--text);
  margin-top: 4px;

  span + span::before {
    content: "·";
    margin-right: 16px;
    color: var(--text-muted);
  }
}

.ritt-page__stats-elevation {
  color: var(--accent);
  font-weight: 600;
}

.ritt-page__actions-row {
  display: flex;
  align-items: center;
  gap: 8px 14px;
  flex-wrap: wrap;
  margin-top: 10px;
  font-size: 13px;
  color: var(--text-muted);
}

.ritt-page__actions-date {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
}
```

- [ ] **Step 3: Run lint + tests to confirm no breakage**

```bash
bun run lint && bun run test
```

Expected: no errors or failures.

- [ ] **Step 4: Commit**

```bash
git add src/pages/EventPage.tsx src/index.css
git commit -m "refactor: restructure event page header into title/stats/actions rows"
```

---

### Task 2: Reorder page sections — weather above map/elevation

**Files:**
- Modify: `src/pages/EventPage.tsx:266-368`

Move the date section and weather section to appear directly after the header, and move the map + elevation sections to after the weather section.

- [ ] **Step 1: Reorder the sections in `EventPage.tsx`**

Replace the current section order (lines 266–367) with the new order:

```tsx
      {/* ── Date & time pickers ── */}
      <section className="ritt-page__date-section">
        <DatePicker
          value={selectedDate}
          onChange={setSelectedDate}
          officialDate={rittData.officialDate}
        />
        <TimePicker
          startTime={startTime}
          finishTime={finishTime}
          onStartChange={setStartTime}
          onFinishChange={setFinishTime}
          onClear={() => {
            setStartTime("");
            setFinishTime("");
          }}
          distanceKm={rittData.distance}
          officialStartTime={rittData.officialStartTime}
          discipline={rittData.discipline}
        />
      </section>

      {/* ── Weather ── */}
      <section className="ritt-page__weather-section">
        <ErrorBoundary
          fallback={
            <p className="error-boundary__message">
              Kunne ikke laste værmeldingen. Sjekk nettverkstilkoblingen og prøv igjen.
            </p>
          }
        >
          {forecastOnly && selectedDate && !isForecastRange(selectedDate) ? (
            <p className="ritt-page__forecast-only-note">
              Værmeldingen er ikke klar ennå — sjekk igjen nærmere løpsdagen.
            </p>
          ) : (
            <>
              <RaceDayCountdown
                selectedDate={selectedDate}
                startWaypointWeather={weatherResults[0]?.data ?? null}
              />
              <WeatherStrip
                waypoints={rittData.waypoints}
                date={selectedDate || null}
                startTime={startTime || null}
                finishTime={finishTime || null}
                externalResults={weatherResults}
                onWaypointClick={(wp, i) =>
                  trackWaypointSelected(rittData.id, wp.label, i)
                }
              />
            </>
          )}
          {!forecastOnly && selectedDate && (
            <div className="dag-vurdering">
              {adjDifficulty && physDifficulty && (
                adjDifficulty.level !== physDifficulty.level ? (
                  <>
                    <span className="dag-vurdering__label">Dag-vurdering:</span>
                    <span className={`dag-vurdering__badge dag-vurdering__badge--${physDifficulty.level}`}>
                      {physDifficulty.label}
                    </span>
                    <span className="dag-vurdering__arrow">→</span>
                    <span className={`dag-vurdering__badge dag-vurdering__badge--${adjDifficulty.level}`}>
                      {adjDifficulty.label}
                    </span>
                    <span className="dag-vurdering__note">pga. vær</span>
                  </>
                ) : (
                  <>
                    <span className="dag-vurdering__label">Dag-vurdering:</span>
                    <span className={`dag-vurdering__badge dag-vurdering__badge--${adjDifficulty.level}`}>
                      {adjDifficulty.label}
                    </span>
                  </>
                )
              )}
            </div>
          )}
        </ErrorBoundary>
      </section>

      {/* ── Map (collapsible — already collapsed by default) ── */}
      <section className="ritt-page__map-section">
        <EventMap waypoints={rittData.waypoints} name={rittData.name} discipline={rittData.discipline} />
      </section>

      {/* ── Elevation profile (collapsible) ── */}
      {!forecastOnly && (
        <section className="ritt-page__elevation-section">
          <ElevationProfile waypoints={rittData.waypoints} distanceKm={rittData.distance} />
        </section>
      )}

      {/* ── Gear suggestion (collapsible) ── */}
      {!forecastOnly && selectedDate && (
        <section className="ritt-page__gear-section">
          <GearSuggestion
            results={weatherResults}
            waypoints={rittData.waypoints}
          />
        </section>
      )}

      {/* ── Historical weather table (collapsible — already) ── */}
      {!forecastOnly && (
        <section className="ritt-page__history-section">
          <HistoricalWeatherTable
            waypoints={rittData.waypoints}
            officialDate={rittData.officialDate}
          />
        </section>
      )}
```

Note: `GearSuggestion` is moved out of the `ErrorBoundary` — it doesn't do network fetches itself (it derives from already-fetched `weatherResults`), so it doesn't need the error boundary. Also add a `gear-section` CSS class (same padding pattern as other sections).

- [ ] **Step 2: Add `.ritt-page__gear-section` CSS in `src/index.css`**

After `.ritt-page__history-section` (around line 2619), add:

```css
.ritt-page__gear-section {
  margin-top: 24px;
  padding: 0 32px;
  @media (max-width: 1024px) {
    padding: 0 16px;
  }
}
```

- [ ] **Step 3: Run lint + tests**

```bash
bun run lint && bun run test
```

Expected: no errors or failures.

- [ ] **Step 4: Commit**

```bash
git add src/pages/EventPage.tsx src/index.css
git commit -m "refactor: move date pickers and weather above map/elevation on event page"
```

---

### Task 3: Wrap ElevationProfile and GearSuggestion in collapsible `<details>`

**Files:**
- Modify: `src/components/ElevationProfile.tsx`
- Modify: `src/components/GearSuggestion.tsx`
- Modify: `src/index.css` (add collapsible CSS for both)

Use the exact same `<details>` / `<summary>` pattern already used by `HistoricalWeatherTable` and `EventMap`.

- [ ] **Step 1: Wrap ElevationProfile output in `<details>` in `ElevationProfile.tsx`**

Read the full file first, then wrap the returned JSX:

```tsx
return (
  <details className="elevation-profile__details">
    <summary className="elevation-profile__summary">
      Høydeprofil
    </summary>
    <div className="elevation-profile__body">
      {/* existing SVG content unchanged */}
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        ...
      >
        ...
      </svg>
    </div>
  </details>
);
```

Keep all existing SVG logic unchanged — only wrap the outer return.

- [ ] **Step 2: Wrap GearSuggestion output in `<details>` in `GearSuggestion.tsx`**

Read the full file first, then wrap the returned JSX. The component returns `null` when there are no suggestions — keep that guard. Wrap only the non-null return:

```tsx
return (
  <details className="gear-suggestion__details">
    <summary className="gear-suggestion__summary">
      Utstyrstips
    </summary>
    <div className="gear-suggestion__body">
      {/* existing suggestion list unchanged */}
    </div>
  </details>
);
```

- [ ] **Step 3: Add CSS for both collapsibles in `src/index.css`**

Add after `.ritt-page__history-section` block. Use the same pattern as `.ritt-map__details` / `.history-table__details`:

```css
/* ─── Elevation profile collapsible ─────────────────────────────────── */

.elevation-profile__details {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.elevation-profile__summary {
  padding: 12px 16px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-h);
  list-style: none;
  display: flex;
  align-items: center;
  gap: 8px;
  user-select: none;
  background: var(--code-bg);
  transition: background 0.12s;

  &::-webkit-details-marker { display: none; }

  &::before {
    content: "▶";
    font-size: 10px;
    color: var(--accent);
    transition: transform 0.2s;
  }

  &:hover {
    background: var(--accent-bg);
  }
}

details[open] .elevation-profile__summary::before {
  transform: rotate(90deg);
}

.elevation-profile__body {
  padding: 16px;
  overflow-x: auto;
}

/* ─── Gear suggestion collapsible ───────────────────────────────────── */

.gear-suggestion__details {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.gear-suggestion__summary {
  padding: 12px 16px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-h);
  list-style: none;
  display: flex;
  align-items: center;
  gap: 8px;
  user-select: none;
  background: var(--code-bg);
  transition: background 0.12s;

  &::-webkit-details-marker { display: none; }

  &::before {
    content: "▶";
    font-size: 10px;
    color: var(--accent);
    transition: transform 0.2s;
  }

  &:hover {
    background: var(--accent-bg);
  }
}

details[open] .gear-suggestion__summary::before {
  transform: rotate(90deg);
}

.gear-suggestion__body {
  padding: 16px;
}
```

- [ ] **Step 4: Remove any old `.elevation-profile` wrapper CSS** that may conflict (search for `.elevation-profile {` in `index.css` and remove padding/margin that was on the outer element — the `<details>` now handles it).

- [ ] **Step 5: Run lint + tests**

```bash
bun run lint && bun run test
```

Expected: no errors or failures.

- [ ] **Step 6: Commit**

```bash
git add src/components/ElevationProfile.tsx src/components/GearSuggestion.tsx src/index.css
git commit -m "feat: collapse elevation profile and gear suggestion by default"
```

---

### Task 4: Improve weather card visual hierarchy

**Files:**
- Modify: `src/index.css` (weather card CSS ~line 2944)

Make temperature the dominant visual element; subordinate secondary info (feels-like, UV, road risk badges).

- [ ] **Step 1: Find the weather card CSS block** (starts ~line 2944 in `index.css`) and update these specific rules:

**Make the temperature bigger and bolder** — find `.weather-card__temp-hourly` and `.weather-card__temp-max` / `.weather-card__temp-min` and increase font size:

```css
.weather-card__temp-hourly {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
  color: var(--text-h);
}

.weather-card__temp-max {
  font-size: 1.6rem;
  font-weight: 700;
  line-height: 1;
  color: var(--text-h);
}

.weather-card__temp-min {
  font-size: 1.1rem;
  font-weight: 400;
  color: var(--text-muted);
}
```

**Make the weather icon bigger:**

```css
.weather-card__icon {
  font-size: 2rem;
  line-height: 1;
}
```

**Make the description slightly bolder:**

```css
.weather-card__description {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-h);
}
```

**Subordinate feels-like, precipitation detail, wind detail** — they should be clearly secondary:

```css
.weather-card__feels-like {
  font-size: 11px;
  color: var(--text-muted);
  opacity: 1; /* remove opacity trick, use muted color directly */
}

.weather-card__detail {
  font-size: 12px;
  color: var(--text);
}
```

**Add a little more internal breathing room to the card:**

```css
.weather-card {
  /* existing rules stay; change gap from 4px to 6px and padding from 16px to 18px */
  gap: 6px;
  padding: 18px 16px;
}
```

- [ ] **Step 2: Run lint + tests**

```bash
bun run lint && bun run test
```

Expected: no errors or failures.

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "style: improve weather card visual hierarchy — temperature dominant"
```

---

### Task 5: Full verification

- [ ] **Step 1: Run full CI check**

```bash
bun run lint && bun run test && bun run build
```

Expected: all pass, no TypeScript errors, build succeeds.

- [ ] **Step 2: Start dev server and manually verify**

```bash
bun run dev
```

Open an arrangement page (e.g. `/arrangement/birkebeinerrittet`) and verify:
- [ ] Header shows: h1 + difficulty badge on one line; distance · elevation · region on second line; date + URL + bookmark + share on third line (smaller/muted)
- [ ] Date pickers appear directly under the header (no map/elevation between them)
- [ ] Weather strip is the first major content block after pickers
- [ ] Map is below the weather strip (still collapsed by default)
- [ ] Elevation profile appears below map, collapsed by default with "Høydeprofil" label
- [ ] Gear suggestion appears below elevation, collapsed by default with "Utstyrstips" label
- [ ] Historical weather table is last, collapsed (unchanged)
- [ ] Temperature in weather cards is visually dominant (large, bold)
- [ ] All collapsible sections expand and collapse correctly

- [ ] **Step 3: Commit any final fixes**

```bash
git add -A
git commit -m "fix: address any visual issues found during manual review"
```
