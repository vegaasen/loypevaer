# Feedback Snackbar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a 👍/👎 feedback snackbar to users who navigate from a list page to an event page, fire a GA4 event with the response, and suppress re-display for 30 days.

**Architecture:** A `useFeedbackPrompt` hook encapsulates trigger logic and localStorage cooldown. `FeedbackSnackbar` renders the UI and calls the hook. `EventPage` mounts the snackbar. `EventCard` and `RunningEventRow` pass router state so the hook can detect list-page origin.

**Tech Stack:** React 18, React Router v6, TypeScript strict, Vitest, gtag.js (already configured in `index.html`), plain CSS.

---

### Task 1: Add `trackFeedback` to analytics

**Files:**
- Modify: `src/lib/analytics.ts`
- Test: `src/lib/analytics.test.ts` (create)

- [ ] **Step 1: Write the failing test**

Create `src/lib/analytics.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { trackFeedback } from "./analytics";

describe("trackFeedback", () => {
  let gtagSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    gtagSpy = vi.fn();
    vi.stubGlobal("gtag", gtagSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fires user_feedback with value 5 and event_id for thumbs up", () => {
    trackFeedback(5, "birken-2025");
    expect(gtagSpy).toHaveBeenCalledWith("event", "user_feedback", {
      feedback_value: 5,
      event_id: "birken-2025",
    });
  });

  it("fires user_feedback with value 1 for thumbs down", () => {
    trackFeedback(1, "birken-2025");
    expect(gtagSpy).toHaveBeenCalledWith("event", "user_feedback", {
      feedback_value: 1,
      event_id: "birken-2025",
    });
  });

  it("is a no-op when gtag is undefined", () => {
    vi.unstubAllGlobals();
    expect(() => trackFeedback(5, "test")).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
bun run test src/lib/analytics.test.ts
```

Expected: FAIL — `trackFeedback is not a function`

- [ ] **Step 3: Add `trackFeedback` to `src/lib/analytics.ts`**

Append after the last function in the file:

```ts
/**
 * Fired when a user submits feedback via the snackbar prompt.
 * value: 5 = thumbs up, 1 = thumbs down (extensible to full 1–5 scale).
 */
export function trackFeedback(value: 1 | 5, eventId: string): void {
  safeGtagEvent("user_feedback", {
    feedback_value: value,
    event_id: eventId,
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
bun run test src/lib/analytics.test.ts
```

Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/analytics.ts src/lib/analytics.test.ts
git commit -m "feat: add trackFeedback GA4 event to analytics"
```

---

### Task 2: Implement `useFeedbackPrompt` hook

**Files:**
- Create: `src/hooks/useFeedbackPrompt.ts`
- Test: `src/hooks/useFeedbackPrompt.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/hooks/useFeedbackPrompt.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useFeedbackPrompt } from "./useFeedbackPrompt";

const STORAGE_KEY = "loypevaer:feedback-last-shown";

// Mock react-router-dom useLocation
vi.mock("react-router-dom", () => ({
  useLocation: vi.fn(),
}));

import { useLocation } from "react-router-dom";

const mockUseLocation = vi.mocked(useLocation);

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("useFeedbackPrompt", () => {
  it("returns visible=true when arriving from / and no cooldown", () => {
    mockUseLocation.mockReturnValue({
      state: { from: "/" },
      pathname: "/arrangement/test",
      search: "",
      hash: "",
      key: "default",
    });

    const { result } = renderHook(() => useFeedbackPrompt());
    expect(result.current.visible).toBe(true);
  });

  it("returns visible=true when arriving from /lop and no cooldown", () => {
    mockUseLocation.mockReturnValue({
      state: { from: "/lop" },
      pathname: "/arrangement/test",
      search: "",
      hash: "",
      key: "default",
    });

    const { result } = renderHook(() => useFeedbackPrompt());
    expect(result.current.visible).toBe(true);
  });

  it("returns visible=false when no router state", () => {
    mockUseLocation.mockReturnValue({
      state: null,
      pathname: "/arrangement/test",
      search: "",
      hash: "",
      key: "default",
    });

    const { result } = renderHook(() => useFeedbackPrompt());
    expect(result.current.visible).toBe(false);
  });

  it("returns visible=false when arriving from an unrelated route", () => {
    mockUseLocation.mockReturnValue({
      state: { from: "/gpx" },
      pathname: "/arrangement/test",
      search: "",
      hash: "",
      key: "default",
    });

    const { result } = renderHook(() => useFeedbackPrompt());
    expect(result.current.visible).toBe(false);
  });

  it("returns visible=false within 30-day cooldown", () => {
    const recent = new Date();
    recent.setDate(recent.getDate() - 5); // 5 days ago
    localStorage.setItem(STORAGE_KEY, recent.toISOString());

    mockUseLocation.mockReturnValue({
      state: { from: "/" },
      pathname: "/arrangement/test",
      search: "",
      hash: "",
      key: "default",
    });

    const { result } = renderHook(() => useFeedbackPrompt());
    expect(result.current.visible).toBe(false);
  });

  it("returns visible=true after 30-day cooldown has expired", () => {
    const old = new Date();
    old.setDate(old.getDate() - 31); // 31 days ago
    localStorage.setItem(STORAGE_KEY, old.toISOString());

    mockUseLocation.mockReturnValue({
      state: { from: "/" },
      pathname: "/arrangement/test",
      search: "",
      hash: "",
      key: "default",
    });

    const { result } = renderHook(() => useFeedbackPrompt());
    expect(result.current.visible).toBe(true);
  });

  it("writes timestamp to localStorage when visible=true", () => {
    mockUseLocation.mockReturnValue({
      state: { from: "/" },
      pathname: "/arrangement/test",
      search: "",
      hash: "",
      key: "default",
    });

    renderHook(() => useFeedbackPrompt());
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
  });

  it("dismiss() sets visible to false", () => {
    mockUseLocation.mockReturnValue({
      state: { from: "/" },
      pathname: "/arrangement/test",
      search: "",
      hash: "",
      key: "default",
    });

    const { result } = renderHook(() => useFeedbackPrompt());
    expect(result.current.visible).toBe(true);
    result.current.dismiss();
    expect(result.current.visible).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
bun run test src/hooks/useFeedbackPrompt.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement `src/hooks/useFeedbackPrompt.ts`**

```ts
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const STORAGE_KEY = "loypevaer:feedback-last-shown";
const COOLDOWN_DAYS = 30;
const LIST_ROUTES = new Set(["/", "/lop"]);

function isCooledDown(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return true;
    const last = new Date(stored).getTime();
    const now = Date.now();
    const days = (now - last) / (1000 * 60 * 60 * 24);
    return days > COOLDOWN_DAYS;
  } catch {
    return true;
  }
}

function recordShown(): void {
  try {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
  } catch {
    // private mode — silently skip
  }
}

interface FeedbackPromptState {
  visible: boolean;
  dismiss: () => void;
}

export function useFeedbackPrompt(): FeedbackPromptState {
  const location = useLocation();
  const from =
    (location.state as { from?: string } | null)?.from ?? null;

  const shouldShow = from !== null && LIST_ROUTES.has(from) && isCooledDown();

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (shouldShow) {
      setVisible(true);
      recordShown();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run once on mount

  return {
    visible,
    dismiss: () => setVisible(false),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
bun run test src/hooks/useFeedbackPrompt.test.ts
```

Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useFeedbackPrompt.ts src/hooks/useFeedbackPrompt.test.ts
git commit -m "feat: add useFeedbackPrompt hook with 30-day localStorage cooldown"
```

---

### Task 3: Build `FeedbackSnackbar` component

**Files:**
- Create: `src/components/FeedbackSnackbar.tsx`
- Test: `src/components/FeedbackSnackbar.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/components/FeedbackSnackbar.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FeedbackSnackbar } from "./FeedbackSnackbar";
import * as analytics from "../lib/analytics";

vi.mock("../hooks/useFeedbackPrompt", () => ({
  useFeedbackPrompt: vi.fn(),
}));

vi.mock("../lib/analytics", () => ({
  trackFeedback: vi.fn(),
}));

import { useFeedbackPrompt } from "../hooks/useFeedbackPrompt";
const mockUseFeedbackPrompt = vi.mocked(useFeedbackPrompt);

beforeEach(() => {
  vi.clearAllMocks();
});

function makeMock(visible: boolean) {
  const dismiss = vi.fn();
  mockUseFeedbackPrompt.mockReturnValue({ visible, dismiss });
  return dismiss;
}

describe("FeedbackSnackbar", () => {
  it("renders nothing when visible=false", () => {
    makeMock(false);
    const { container } = render(<FeedbackSnackbar eventId="test" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders question and buttons when visible=true", () => {
    makeMock(true);
    render(<FeedbackSnackbar eventId="test" />);
    expect(
      screen.getByText(/Er værmeldingen nyttig/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /👍/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /👎/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /×/i })).toBeInTheDocument();
  });

  it("calls trackFeedback(5, eventId) and dismiss on 👍", async () => {
    const dismiss = makeMock(true);
    render(<FeedbackSnackbar eventId="birken-2025" />);
    await userEvent.click(screen.getByRole("button", { name: /👍/i }));
    expect(analytics.trackFeedback).toHaveBeenCalledWith(5, "birken-2025");
    expect(dismiss).toHaveBeenCalled();
  });

  it("calls trackFeedback(1, eventId) and dismiss on 👎", async () => {
    const dismiss = makeMock(true);
    render(<FeedbackSnackbar eventId="birken-2025" />);
    await userEvent.click(screen.getByRole("button", { name: /👎/i }));
    expect(analytics.trackFeedback).toHaveBeenCalledWith(1, "birken-2025");
    expect(dismiss).toHaveBeenCalled();
  });

  it("calls dismiss only (no trackFeedback) on ×", async () => {
    const dismiss = makeMock(true);
    render(<FeedbackSnackbar eventId="birken-2025" />);
    await userEvent.click(screen.getByRole("button", { name: /×/i }));
    expect(analytics.trackFeedback).not.toHaveBeenCalled();
    expect(dismiss).toHaveBeenCalled();
  });

  it("calls dismiss (no trackFeedback) after 15s auto-dismiss", async () => {
    vi.useFakeTimers();
    const dismiss = makeMock(true);
    render(<FeedbackSnackbar eventId="birken-2025" />);
    await act(async () => {
      vi.advanceTimersByTime(15000);
    });
    expect(analytics.trackFeedback).not.toHaveBeenCalled();
    expect(dismiss).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
bun run test src/components/FeedbackSnackbar.test.tsx
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement `src/components/FeedbackSnackbar.tsx`**

```tsx
import { useEffect } from "react";
import { useFeedbackPrompt } from "../hooks/useFeedbackPrompt";
import { trackFeedback } from "../lib/analytics";

interface Props {
  eventId: string;
}

export function FeedbackSnackbar({ eventId }: Props) {
  const { visible, dismiss } = useFeedbackPrompt();

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      dismiss();
    }, 15_000);
    return () => clearTimeout(timer);
  }, [visible, dismiss]);

  if (!visible) return null;

  function handleVote(value: 1 | 5) {
    trackFeedback(value, eventId);
    dismiss();
  }

  return (
    <div className="feedback-snackbar" role="status" aria-live="polite">
      <p className="feedback-snackbar__question">
        Er værmeldingen nyttig for planleggingen din?
      </p>
      <div className="feedback-snackbar__actions">
        <button
          className="feedback-snackbar__btn"
          onClick={() => handleVote(5)}
          aria-label="👍"
        >
          👍
        </button>
        <button
          className="feedback-snackbar__btn"
          onClick={() => handleVote(1)}
          aria-label="👎"
        >
          👎
        </button>
        <button
          className="feedback-snackbar__dismiss"
          onClick={dismiss}
          aria-label="×"
        >
          ×
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
bun run test src/components/FeedbackSnackbar.test.tsx
```

Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/FeedbackSnackbar.tsx src/components/FeedbackSnackbar.test.tsx
git commit -m "feat: add FeedbackSnackbar component"
```

---

### Task 4: Pass router `state.from` in list link components

**Files:**
- Modify: `src/components/EventCard.tsx`
- Modify: `src/components/RunningEventRow.tsx`

- [ ] **Step 1: Update `EventCard.tsx`**

Find the `<Link to={`/arrangement/${id}`}` in `src/components/EventCard.tsx` and add `state={{ from: "/" }}`:

```tsx
<Link
  to={`/arrangement/${id}`}
  state={{ from: "/" }}
  className={`ritt-card${planned ? " ritt-card--planned" : ""}...`}
>
```

(Preserve the existing `className` exactly — only add the `state` prop.)

- [ ] **Step 2: Update `RunningEventRow.tsx`**

Find the `<Link to={`/arrangement/${id}`}` in `src/components/RunningEventRow.tsx` and add `state={{ from: "/lop" }}`:

```tsx
<Link
  to={`/arrangement/${id}`}
  state={{ from: "/lop" }}
  className="running-row ..."
>
```

(Preserve the existing `className` exactly — only add the `state` prop.)

- [ ] **Step 3: Run the full test suite to confirm no regressions**

```bash
bun run test
```

Expected: all tests pass

- [ ] **Step 4: Commit**

```bash
git add src/components/EventCard.tsx src/components/RunningEventRow.tsx
git commit -m "feat: pass router state.from on list-to-event links"
```

---

### Task 5: Mount snackbar in `EventPage`

**Files:**
- Modify: `src/pages/EventPage.tsx`

- [ ] **Step 1: Add import**

At the top of `src/pages/EventPage.tsx`, after the existing imports, add:

```tsx
import { FeedbackSnackbar } from "../components/FeedbackSnackbar";
```

- [ ] **Step 2: Mount the component**

In the JSX returned by `EventPage`, add `<FeedbackSnackbar eventId={id ?? ""} />` just before the closing `</div>` of the root element (so it appears at the end of the page, outside the content flow):

```tsx
      {/* ... existing content ... */}
      <FeedbackSnackbar eventId={id ?? ""} />
    </div>
  );
```

- [ ] **Step 3: Run the full test suite**

```bash
bun run test
```

Expected: all tests pass

- [ ] **Step 4: Commit**

```bash
git add src/pages/EventPage.tsx
git commit -m "feat: mount FeedbackSnackbar on EventPage"
```

---

### Task 6: Add snackbar styles

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Append snackbar CSS to `src/index.css`**

Add at the end of the file:

```css
/* ── Feedback Snackbar ──────────────────────────────────────── */
@keyframes snackbar-slide-up {
  from {
    opacity: 0;
    transform: translateY(1.5rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.feedback-snackbar {
  position: fixed;
  bottom: 1.5rem;
  left: 1rem;
  right: 1rem;
  max-width: 480px;
  margin-inline: auto;
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 0.75rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  padding: 0.875rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  z-index: 1000;
  animation: snackbar-slide-up 0.25s ease-out both;
}

.feedback-snackbar__question {
  flex: 1;
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
  color: var(--color-text, #1a202c);
}

.feedback-snackbar__actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
}

.feedback-snackbar__btn {
  background: none;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 0.5rem;
  font-size: 1.25rem;
  line-height: 1;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  transition: background 0.15s;
}

.feedback-snackbar__btn:hover {
  background: var(--color-surface-hover, #f7fafc);
}

.feedback-snackbar__dismiss {
  background: none;
  border: none;
  font-size: 1.1rem;
  color: var(--color-text-muted, #718096);
  cursor: pointer;
  padding: 0.25rem 0.375rem;
  line-height: 1;
  border-radius: 0.25rem;
  transition: color 0.15s;
}

.feedback-snackbar__dismiss:hover {
  color: var(--color-text, #1a202c);
}
```

- [ ] **Step 2: Run lint and build to confirm no issues**

```bash
bun run lint && bun run build
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat: add feedback snackbar styles"
```

---

### Task 7: Final verification

- [ ] **Step 1: Run the full suite**

```bash
bun run lint && bun run test && bun run build
```

Expected: lint clean, all tests pass, build succeeds

- [ ] **Step 2: Manual smoke test**

```bash
bun run dev
```

1. Open `http://localhost:5173/`
2. Click any event card → verify snackbar slides up from bottom
3. Click 👍 → snackbar disappears, GA4 event visible in browser devtools Network tab (request to `google-analytics.com` with `user_feedback`)
4. Navigate back and click another event → snackbar should **not** appear (cooldown written)
5. Clear `loypevaer:feedback-last-shown` from localStorage and set it to 31 days ago → navigate to an event via the home page → snackbar appears again

- [ ] **Step 3: Commit if any fixups needed, otherwise done**
