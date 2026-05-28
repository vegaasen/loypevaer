# Compact Past Events Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render past events as compact single-line rows (name + date only) instead of full cards, reducing scroll distance on the home page.

**Architecture:** Add a CSS variant class `ritt-card--past-compact` that transforms the card into a narrow horizontal strip showing only event name (left) and formatted date (right). The grid wrapping past events in each month group switches to a single-column list via an `allPast` check in HomePage, requiring minimal JS changes — mostly CSS additions.

**Tech Stack:** React, TypeScript, CSS (plain, existing `index.css`), Vitest + React Testing Library

---

### Task 1: Add CSS for compact past card

**Files:**
- Modify: `src/index.css` (after the existing `.ritt-card--past:hover` block, around line 1491)

- [ ] **Step 1: Add the compact variant CSS**

Open `src/index.css`. After the `.ritt-card--past:hover` block (line 1491), insert:

```css
/* Compact layout for past events — name + date only, single-line strip */
.ritt-card--past-compact {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  gap: 12px;
  opacity: 0.5;
  filter: saturate(0.25);
  min-height: 0;
}

.ritt-card--past-compact:hover {
  opacity: 0.8;
  filter: saturate(0.5);
}

/* Hide the meta row and footer inside compact past cards */
.ritt-card--past-compact .ritt-card__meta,
.ritt-card--past-compact .ritt-card__footer {
  display: none;
}

/* Name text: no wrapping, truncate with ellipsis */
.ritt-card--past-compact .ritt-card__name {
  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

/* Compact past date: shown via a data attribute on the card link itself */
.ritt-card--past-compact::after {
  content: attr(data-date);
  font-size: 0.78rem;
  color: var(--text-muted);
  white-space: nowrap;
  flex-shrink: 0;
}

/* Override the grid to single-column when all items in it are compact */
.home-page__grid--past-list {
  grid-template-columns: 1fr;
  gap: 4px;
}
```

- [ ] **Step 2: Preview in browser**

Run `bun run dev` and verify no CSS parse errors in the terminal. The styles won't be visible yet — that comes in Task 2.

---

### Task 2: Apply compact class in EventCard

**Files:**
- Modify: `src/components/EventCard.tsx`

- [ ] **Step 1: Add `data-date` attribute and compact class to the Link**

In `EventCard.tsx`, find the `return` statement. Replace it with:

```tsx
  const dateStr = displayDate ?? officialDate;
  const formattedDate = formatNorwegianDate(dateStr);
  const isCancelled = dateStatus === "cancelled";
  const isCompactPast = isPast && !planned && !isCancelled;

  return (
    <Link
      to={`/arrangement/${id}`}
      state={{ from: "/" }}
      className={[
        "ritt-card",
        planned ? "ritt-card--planned" : "",
        isPast ? "ritt-card--past" : "",
        isCompactPast ? "ritt-card--past-compact" : "",
        isCancelled ? "ritt-card--cancelled" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-date={isCompactPast ? formattedDate : undefined}
    >
```

Keep the rest of the JSX unchanged. The CSS hides `.ritt-card__meta` and `.ritt-card__footer` for compact cards, and `::after` displays the date via `data-date`.

- [ ] **Step 2: Run the app and manually verify**

`bun run dev` → open the home page. Past events should render as slim single-line rows with name on the left and date on the right.

---

### Task 3: Switch past-only month grids to single-column layout

**Files:**
- Modify: `src/pages/HomePage.tsx`

- [ ] **Step 1: Compute `allPast` per month group and apply CSS class**

Inside `HomePage.tsx`, find the `months.map((month) => (` block (around line 344). Replace it with:

```tsx
{months.map((month) => {
  const monthEvents = byMonth.get(month)!;
  const allPast = monthEvents.every(
    (r) => daysUntil(r.officialDate) < 0
  );
  return (
    <div key={month} id={`month-${year}-${month}`} className="home-page__month-section">
      <h3 className="home-page__month-heading">
        <a href={`#month-${year}-${month}`} className="home-page__month-anchor">
          {monthName(month)}
        </a>
        {monthEvents.length > 1 && (
          <span className="month-count-badge">{monthEvents.length}</span>
        )}
      </h3>
      <div className={`home-page__grid${allPast ? " home-page__grid--past-list" : ""}`}>
        {monthEvents.map((r) => (
          <EventCard
            key={r.id}
            id={r.id}
            name={r.name}
            officialDate={r.officialDate}
            distance={r.distance}
            distanceLabel={r.distanceLabel}
            region={r.region}
            discipline={r.discipline}
            planned={isPlanned(r.id)}
            isPast={daysUntil(r.officialDate) < 0}
            dateStatus={r.dateStatus}
            onTogglePlanned={(e) => handleToggle(r.id, r.officialDate, e)}
          />
        ))}
      </div>
    </div>
  );
})}
```

- [ ] **Step 2: Verify in browser**

`bun run dev` → scroll to a past month. Past months should have a tight single-column list. Months with mixed future/past events keep the regular grid.

---

### Task 4: Update EventCard tests

**Files:**
- Modify: `src/components/EventCard.test.tsx`

- [ ] **Step 1: Check existing past test still passes**

```bash
bun run test src/components/EventCard.test.tsx
```

Expected: all existing tests pass (the `ritt-card--past` class is still applied).

- [ ] **Step 2: Add tests for compact past behaviour**

Find the test block for `isPast` and add after it:

```tsx
it("applies ritt-card--past-compact when isPast=true and not planned and not cancelled", () => {
  render(<EventCard {...baseProps} isPast={true} />);
  expect(screen.getByRole("link")).toHaveClass("ritt-card--past-compact");
});

it("does NOT apply ritt-card--past-compact when isPast=true but planned=true", () => {
  render(<EventCard {...baseProps} isPast={true} planned={true} />);
  expect(screen.getByRole("link")).not.toHaveClass("ritt-card--past-compact");
});

it("does NOT apply ritt-card--past-compact when isPast=true but cancelled", () => {
  render(<EventCard {...baseProps} isPast={true} dateStatus="cancelled" />);
  expect(screen.getByRole("link")).not.toHaveClass("ritt-card--past-compact");
});

it("sets data-date attribute on compact past card", () => {
  render(<EventCard {...baseProps} isPast={true} officialDate="2025-03-14" />);
  const link = screen.getByRole("link");
  expect(link).toHaveAttribute("data-date");
});
```

(`baseProps` = whatever the existing test file uses for the minimum required props.)

- [ ] **Step 3: Run tests**

```bash
bun run test src/components/EventCard.test.tsx
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/EventCard.tsx src/index.css src/pages/HomePage.tsx src/components/EventCard.test.tsx
git commit -m "feat: compact single-line rows for past events"
```

---

### Task 5: Full verification

- [ ] **Step 1: Lint**

```bash
bun run lint
```

Expected: no errors.

- [ ] **Step 2: Full test suite**

```bash
bun run test
```

Expected: all tests pass.

- [ ] **Step 3: Build**

```bash
bun run build
```

Expected: clean build, no TypeScript errors.
