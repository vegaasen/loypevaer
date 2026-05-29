# Error Resilience and ErrorBoundary Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix a crash on arrangement pages with empty waypoints, and redesign all error/not-found states to use a consistent, styled card with NavBar and navigation actions.

**Architecture:** Move `ErrorBoundary` inside `BrowserRouter` so it has router context; add a shared `.status-card` CSS pattern used by the ErrorBoundary fallback, EventPage not-found state, EventPage no-waypoints state, and NotFoundPage. Guard the JSON-LD block in EventPage against empty waypoints.

**Tech Stack:** React 18, React Router v6, react-helmet-async, plain CSS (CSS custom properties, no component library), Vitest, Bun

---

## File Map

| File | Change |
|---|---|
| `src/App.tsx` | Move `<ErrorBoundary>` inside `<BrowserRouter>` (and inside `<QueryClientProvider>`) |
| `src/components/ErrorBoundary.tsx` | Import `NavBar`; redesign default fallback with `.status-card` layout + NavBar + two action buttons |
| `src/pages/EventPage.tsx` | Add "no waypoints" render state after the not-found guard; guard JSON-LD block; redesign not-found render with `.status-card` |
| `src/pages/NotFoundPage.tsx` | Redesign with `.status-card` classes |
| `src/index.css` | Replace `.error-boundary` block with new `.status-page` / `.status-card` / `.status-card__*` classes; keep `.error-boundary__message` (used as inline fallback in EventPage weather section) |

---

### Task 1: Add `.status-page` and `.status-card` CSS

**Files:**
- Modify: `src/index.css` (around line 3672 — the `/* ─── Error boundary ───` block)

- [ ] **Step 1: Replace the `.error-boundary` block in `src/index.css`**

Find the block starting at line 3672:
```css
/* ─── Error boundary ─────────────────────────────────────────────────── */

.error-boundary {
  ...
}
.error-boundary__message { ... }
.error-boundary__retry { ... }
```

Replace it entirely with:

```css
/* ─── Status pages (error, not-found, no-data) ────────────────────── */

.status-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 48px 16px 80px;
  min-height: calc(100vh - var(--nav-height));
  background: var(--bg);

  @media (max-width: 1024px) {
    padding: 32px 16px 60px;
  }
}

.status-card {
  width: 100%;
  max-width: 540px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  padding: 36px 40px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  @media (max-width: 600px) {
    padding: 24px 20px;
  }
}

.status-card__title {
  font-family: var(--heading);
  font-size: 22px;
  font-weight: 600;
  color: var(--text-h);
  margin: 0;
}

.status-card__body {
  font-size: 14px;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.6;
}

.status-card__notice {
  font-size: 13px;
  color: var(--text-muted);
  background: var(--bg-subtle);
  border: 1px solid var(--border);
  border-radius: calc(var(--radius) / 2);
  padding: 10px 14px;
  margin: 4px 0;
}

.status-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 8px;
  align-items: center;
}

.status-card__btn {
  font: inherit;
  font-size: 13px;
  color: var(--accent);
  background: transparent;
  border: 1px solid var(--accent-border);
  border-radius: var(--radius);
  padding: 6px 14px;
  cursor: pointer;
  transition: background 0.12s;
  text-decoration: none;
  display: inline-block;

  &:hover {
    background: var(--accent-bg);
  }
}

.status-card__link {
  font-size: 13px;
  color: var(--accent);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

/* ─── Error boundary inline (weather section) ───────────────────────── */

.error-boundary__message {
  font-size: 14px;
  color: #ef4444;
}
```

- [ ] **Step 2: Verify no CSS syntax errors**

```bash
bun run build 2>&1 | head -30
```

Expected: build succeeds (or only fails on TS errors unrelated to CSS).

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "style: add status-page and status-card CSS for error/not-found states"
```

---

### Task 2: Redesign `NotFoundPage`

**Files:**
- Modify: `src/pages/NotFoundPage.tsx`

- [ ] **Step 1: Rewrite `NotFoundPage.tsx`**

```tsx
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { PageMeta } from "../components/PageMeta";
import { SITE_URL } from "../lib/seo";

export function NotFoundPage() {
  return (
    <>
      <PageMeta
        title="Siden finnes ikke – Løypevær"
        description="Siden du leter etter finnes ikke."
        canonicalUrl={`${SITE_URL}/404`}
      />
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="status-page">
        <div className="status-card">
          <h1 className="status-card__title">Siden finnes ikke</h1>
          <p className="status-card__body">
            Adressen du besøkte finnes ikke. Den kan ha blitt flyttet eller slettet.
          </p>
          <div className="status-card__actions">
            <Link to="/" className="status-card__btn">
              ← Tilbake til forsiden
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Verify build passes**

```bash
bun run build 2>&1 | tail -10
```

Expected: no TypeScript errors from this file.

- [ ] **Step 3: Commit**

```bash
git add src/pages/NotFoundPage.tsx
git commit -m "feat: redesign NotFoundPage with status-card style"
```

---

### Task 3: Fix `EventPage` — redesign not-found state + add no-waypoints state + guard JSON-LD

**Files:**
- Modify: `src/pages/EventPage.tsx`

This task has three changes in one file:

1. Guard the JSON-LD `<script>` block against empty waypoints (line ~208)
2. Redesign the early `!rittData` return (lines 136–143)
3. Add a new early return for `rittData.waypoints.length === 0`

- [ ] **Step 1: Guard the JSON-LD block**

In `EventPage.tsx`, find the `<Helmet>` block starting at line 187. Replace the `location` object inside the JSON-LD script:

Old (lines 203–211):
```tsx
            location: {
              "@type": "Place",
              name: rittData.region,
              geo: {
                "@type": "GeoCoordinates",
                latitude: rittData.waypoints[0].lat,
                longitude: rittData.waypoints[0].lon,
              },
            },
```

New:
```tsx
            location: {
              "@type": "Place",
              name: rittData.region,
              ...(rittData.waypoints.length > 0
                ? {
                    geo: {
                      "@type": "GeoCoordinates",
                      latitude: rittData.waypoints[0].lat,
                      longitude: rittData.waypoints[0].lon,
                    },
                  }
                : {}),
            },
```

- [ ] **Step 2: Redesign the not-found early return (lines 136–143)**

Old:
```tsx
  if (!rittData) {
    return (
      <div className="ritt-page ritt-page--not-found">
        <p>Fant ikke arrangement med id «{id}».</p>
        <Link to="../">Tilbake til oversikt</Link>
      </div>
    );
  }
```

New:
```tsx
  if (!rittData) {
    return (
      <div className="status-page">
        <div className="status-card">
          <h1 className="status-card__title">Arrangement ikke funnet</h1>
          <p className="status-card__body">
            Fant ikke arrangement med id <em>{id}</em>. Det kan ha blitt fjernet eller endret.
          </p>
          <div className="status-card__actions">
            <Link to="/" className="status-card__btn">
              ← Alle arrangement
            </Link>
          </div>
        </div>
      </div>
    );
  }
```

- [ ] **Step 3: Add no-waypoints early return immediately after the not-found guard**

After the `if (!rittData)` block (after line 143), add:

```tsx
  if (rittData.waypoints.length === 0) {
    const isCancelled = rittData.dateStatus === "cancelled";
    return (
      <>
        <PageMeta
          title={pageTitle}
          description={pageDescription}
          canonicalUrl={pageUrl}
        />
        <div className="status-page">
          <div className="status-card">
            <h1 className="status-card__title">{rittData.name}</h1>
            <p className="status-card__body">
              {rittData.distanceLabel ?? `${rittData.distance} km`}
              {rittData.region ? ` · ${rittData.region}` : ""}
              {" · "}
              {formatNorwegianDate(rittData.officialDate)}
            </p>
            {isCancelled && (
              <p className="status-card__notice">
                Dette arrangementet er avlyst.
              </p>
            )}
            {rittData.url && (
              <a
                href={rittData.url}
                target="_blank"
                rel="noopener noreferrer"
                className="status-card__link"
              >
                Offisiell nettside ↗
              </a>
            )}
            <p className="status-card__notice">
              Rutedata er ikke tilgjengelig ennå – kart, høydeprofil og værvarsler vises når løypa er lagt inn.
            </p>
            <div className="status-card__actions">
              <Link to="/" className="status-card__btn">
                ← Alle arrangement
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }
```

Note: `formatNorwegianDate` is already imported at line 23. `PageMeta` is already imported. No new imports needed.

- [ ] **Step 4: Run TypeScript check**

```bash
bun run build 2>&1 | grep -E "error TS|EventPage"
```

Expected: no errors from `EventPage.tsx`.

- [ ] **Step 5: Commit**

```bash
git add src/pages/EventPage.tsx
git commit -m "fix: handle empty waypoints in EventPage — guard JSON-LD, add no-waypoints state, redesign not-found"
```

---

### Task 4: Move `ErrorBoundary` inside `BrowserRouter` in `App.tsx`

**Files:**
- Modify: `src/App.tsx`

This gives the ErrorBoundary fallback access to router context (needed for `<Link>` and `<NavBar>`).

- [ ] **Step 1: Restructure `App.tsx`**

Current structure:
```tsx
function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <RouterContent />
        </BrowserRouter>
        <ReloadPrompt />
        <CookieBanner />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
```

New structure — move `ErrorBoundary` inside `BrowserRouter`:
```tsx
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <ErrorBoundary>
          <RouterContent />
        </ErrorBoundary>
      </BrowserRouter>
      <ReloadPrompt />
      <CookieBanner />
    </QueryClientProvider>
  );
}
```

Note: `ReloadPrompt` and `CookieBanner` move outside `ErrorBoundary` — they are independent portals/toasts and don't need to be inside the boundary.

- [ ] **Step 2: Verify build**

```bash
bun run build 2>&1 | tail -10
```

Expected: clean build.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "refactor: move ErrorBoundary inside BrowserRouter to give fallback router context"
```

---

### Task 5: Redesign `ErrorBoundary` default fallback

**Files:**
- Modify: `src/components/ErrorBoundary.tsx`

Now that the boundary is inside `BrowserRouter`, we can use `<Link>` and `<NavBar>` in the fallback.

- [ ] **Step 1: Rewrite `ErrorBoundary.tsx`**

```tsx
import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { NavBar } from "./NavBar";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
  resetKey: number;
};

function ChildrenContainer({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, resetKey: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <>
          <NavBar />
          <div className="status-page">
            <div className="status-card">
              <h2 className="status-card__title">Noe gikk galt</h2>
              <p className="status-card__body">
                En uventet feil oppstod. Du kan prøve igjen, eller gå tilbake til forsiden.
              </p>
              <div className="status-card__actions">
                <button
                  className="status-card__btn"
                  onClick={() =>
                    this.setState((s) => ({
                      hasError: false,
                      error: null,
                      resetKey: s.resetKey + 1,
                    }))
                  }
                >
                  Prøv igjen
                </button>
                <Link to="/" className="status-card__link">
                  ← Gå til forsiden
                </Link>
              </div>
            </div>
          </div>
        </>
      );
    }

    return (
      <ChildrenContainer key={this.state.resetKey}>
        {this.props.children}
      </ChildrenContainer>
    );
  }
}
```

- [ ] **Step 2: Run full verification**

```bash
bun run lint && bun run test && bun run build
```

Expected: lint clean, all tests pass, build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/ErrorBoundary.tsx
git commit -m "feat: redesign ErrorBoundary fallback with NavBar, status-card style, and home link"
```
