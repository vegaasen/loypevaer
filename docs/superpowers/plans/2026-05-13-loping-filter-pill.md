# Løping Filter Pill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Løping" filter pill to the home page that, when active, replaces the event list with a promo banner linking to `/lop`.

**Architecture:** Extend the local `Discipline` type in `HomePage.tsx` to include `"løping"`, add it to the pill array, and conditionally render a promo block in the `<main>` area when `discipline === "løping"`. No new state, no new files, no performance impact — the existing `filtered` useMemo already excludes løping events, so the list will simply be empty when that pill is active; we intercept before that renders.

**Tech Stack:** React, TypeScript strict, React Router `<Link>`, plain CSS in `src/index.css`

---

### Task 1: Add "Løping" pill to the filter

**Files:**
- Modify: `src/pages/HomePage.tsx:17` (type) and `src/pages/HomePage.tsx:200` (pill array)

- [ ] **Step 1: Extend the local Discipline type**

In `src/pages/HomePage.tsx` line 17, change:
```ts
type Discipline = "alle" | "landevei" | "terreng" | "langrenn" | "triathlon" | "ultraløp";
```
to:
```ts
type Discipline = "alle" | "landevei" | "terreng" | "langrenn" | "triathlon" | "ultraløp" | "løping";
```

- [ ] **Step 2: Add "løping" to the pill array**

In `src/pages/HomePage.tsx` line 200, change:
```tsx
{(["alle", "landevei", "terreng", "langrenn", "triathlon", "ultraløp"] as Discipline[]).map((d) => (
```
to:
```tsx
{(["alle", "landevei", "terreng", "langrenn", "triathlon", "ultraløp", "løping"] as Discipline[]).map((d) => (
```

- [ ] **Step 3: Verify TypeScript still compiles**

```bash
bun run build
```
Expected: no type errors.

---

### Task 2: Render promo block when løping pill is active

**Files:**
- Modify: `src/pages/HomePage.tsx:281-325` (main section)
- Modify: `src/index.css` (add `.home-page__lop-promo` styles)

- [ ] **Step 1: Replace the `<main>` block with a conditional**

In `src/pages/HomePage.tsx`, replace lines 281–325 (the entire `<main className="home-page__sections">` block) with:

```tsx
      {/* ── All ritt grid / Løping promo ──────────────────────────────── */}
      {discipline === "løping" ? (
        <section className="home-page__lop-promo" aria-label="Løping har egen side">
          <div className="home-page__lop-promo-content">
            <div className="home-page__feature-eyebrow">Løping</div>
            <h2>Kortere løp har sin egen side</h2>
            <p>
              Sentrumsløpet, Birkebeinerløpet og mange andre kortere løp finner du på løpesiden.
              Der viser vi sanntidsvarsler for løpsdagen — temperatur, vind og nedbør der det teller.
            </p>
            <Link to="/lop" className="home-page__lop-teaser-btn">
              Se alle løp →
            </Link>
          </div>
        </section>
      ) : (
        <main className="home-page__sections">
          {filtered.length === 0 && (
            <p className="home-page__empty">Ingen arrangement funnet.</p>
          )}
          {years.map((year) => {
            const byMonth = grouped.get(year)!;
            const months = [...byMonth.keys()].sort((a, b) => a - b);
            return (
              <section key={year} className="home-page__year-section">
                <h2 className="home-page__year-heading">{year}</h2>
                {months.map((month) => (
                  <div key={month} id={`month-${year}-${month}`} className="home-page__month-section">
                    <h3 className="home-page__month-heading">
                      <a href={`#month-${year}-${month}`} className="home-page__month-anchor">
                        {monthName(month)}
                      </a>
                      {byMonth.get(month)!.length > 1 && (
                        <span className="month-count-badge">{byMonth.get(month)!.length}</span>
                      )}
                    </h3>
                    <div className="home-page__grid">
                      {byMonth.get(month)!.map((r) => (
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
                ))}
              </section>
            );
          })}
        </main>
      )}
```

- [ ] **Step 2: Add CSS for the promo block**

In `src/index.css`, after the `.home-page__lop-teaser-btn:hover` block (after line 993), add:

```css
/* ─── Løping filter promo block ─────────────────────────────────────── */

.home-page__lop-promo {
  margin: var(--section-gap) 24px;
  padding: 48px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 20px;

  @media (max-width: 900px) {
    padding: 32px 28px;
    margin: 40px 16px;
  }
}

.home-page__lop-promo-content {
  max-width: 540px;
}

.home-page__lop-promo-content h2 {
  font-size: 1.4rem;
  font-weight: 700;
  margin: var(--space-xs) 0;
}

.home-page__lop-promo-content p {
  color: var(--text-secondary);
  font-size: 0.95rem;
  max-width: 48ch;
  margin: 0.5rem 0 1.5rem;
}
```

- [ ] **Step 3: Verify build and lint pass**

```bash
bun run lint && bun run build
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/HomePage.tsx src/index.css
git commit -m "feat: add Løping filter pill with promo block on home page"
```
