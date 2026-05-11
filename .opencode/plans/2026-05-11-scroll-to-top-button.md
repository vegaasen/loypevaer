# Scroll-to-Top Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fixed "scroll to top" arrow button that appears at the bottom-center of the page after the user has scrolled 300px down, and smoothly scrolls back to the top when clicked.

**Architecture:** New `ScrollToTopButton` component with a `useEffect` scroll listener. Visibility is toggled via a CSS class (`scroll-top-btn--visible`). Styles live in `App.css` alongside other fixed-overlay UI. Component is mounted in `App.tsx` inside `RouterContent`.

**Tech Stack:** React, TypeScript (strict), Vitest + Testing Library, plain CSS custom properties

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/components/ScrollToTopButton.tsx` | Component logic + markup |
| Create | `src/components/ScrollToTopButton.test.tsx` | Unit tests |
| Modify | `src/App.css` | Styles for the button |
| Modify | `src/App.tsx` | Mount the component |

---

### Task 1: Write failing tests for `ScrollToTopButton`

**Files:**
- Create: `src/components/ScrollToTopButton.test.tsx`

- [ ] **Step 1: Create the test file**

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ScrollToTopButton } from "./ScrollToTopButton";

describe("ScrollToTopButton", () => {
  beforeEach(() => {
    Object.defineProperty(window, "scrollY", { value: 0, writable: true, configurable: true });
    window.scrollTo = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("is not visible when scrollY is 0", () => {
    render(<ScrollToTopButton />);
    const btn = screen.getByRole("button", { name: /tilbake til toppen/i });
    expect(btn).not.toHaveClass("scroll-top-btn--visible");
  });

  it("becomes visible after scrolling past 300px", () => {
    render(<ScrollToTopButton />);
    act(() => {
      Object.defineProperty(window, "scrollY", { value: 350, writable: true, configurable: true });
      fireEvent.scroll(window);
    });
    const btn = screen.getByRole("button", { name: /tilbake til toppen/i });
    expect(btn).toHaveClass("scroll-top-btn--visible");
  });

  it("becomes hidden again when scrolling back above 300px", () => {
    render(<ScrollToTopButton />);
    act(() => {
      Object.defineProperty(window, "scrollY", { value: 350, writable: true, configurable: true });
      fireEvent.scroll(window);
    });
    act(() => {
      Object.defineProperty(window, "scrollY", { value: 100, writable: true, configurable: true });
      fireEvent.scroll(window);
    });
    const btn = screen.getByRole("button", { name: /tilbake til toppen/i });
    expect(btn).not.toHaveClass("scroll-top-btn--visible");
  });

  it("calls window.scrollTo({ top: 0, behavior: 'smooth' }) on click", () => {
    render(<ScrollToTopButton />);
    act(() => {
      Object.defineProperty(window, "scrollY", { value: 400, writable: true, configurable: true });
      fireEvent.scroll(window);
    });
    fireEvent.click(screen.getByRole("button", { name: /tilbake til toppen/i }));
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });
});
```

- [ ] **Step 2: Run tests — expect them to fail (component doesn't exist yet)**

```bash
bun run test src/components/ScrollToTopButton.test.tsx
```

Expected: FAIL — "Cannot find module './ScrollToTopButton'"

---

### Task 2: Implement `ScrollToTopButton` component

**Files:**
- Create: `src/components/ScrollToTopButton.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { useEffect, useState } from "react";

export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 300);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      type="button"
      className={`scroll-top-btn${visible ? " scroll-top-btn--visible" : ""}`}
      onClick={handleClick}
      aria-label="Tilbake til toppen"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="18 15 12 9 6 15" />
      </svg>
    </button>
  );
}
```

- [ ] **Step 2: Run tests — expect them to pass**

```bash
bun run test src/components/ScrollToTopButton.test.tsx
```

Expected: PASS (4 tests)

- [ ] **Step 3: Commit**

```bash
git add src/components/ScrollToTopButton.tsx src/components/ScrollToTopButton.test.tsx
git commit -m "feat: add ScrollToTopButton component with scroll listener"
```

---

### Task 3: Add CSS styles to `App.css`

**Files:**
- Modify: `src/App.css`

- [ ] **Step 1: Append the following block to the end of `src/App.css`**

```css
/* ── Scroll-to-top button ────────────────────────────────────────── */

.scroll-top-btn {
  position: fixed;
  bottom: 1.75rem;
  left: 50%;
  transform: translateX(-50%) translateY(8px);
  z-index: 900;

  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border: none;
  border-radius: 50%;
  background: var(--accent, #3d6b35);
  color: #fff;
  cursor: pointer;
  box-shadow: var(--shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.18));

  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s, transform 0.15s;

  &:hover {
    opacity: 0.88;
    transform: translateX(-50%) translateY(6px);
  }

  &:active {
    transform: translateX(-50%) translateY(8px);
  }
}

.scroll-top-btn--visible {
  opacity: 1;
  pointer-events: auto;
  transform: translateX(-50%) translateY(0);

  &:hover {
    transform: translateX(-50%) translateY(-2px);
  }

  &:active {
    transform: translateX(-50%) translateY(0);
  }
}
```

- [ ] **Step 2: Verify the build still compiles**

```bash
bun run build
```

Expected: success, no errors

- [ ] **Step 3: Commit**

```bash
git add src/App.css
git commit -m "style: add scroll-to-top button styles"
```

---

### Task 4: Mount component in `App.tsx`

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add import at top of `App.tsx`** (after the existing imports, before `./App.css`)

```tsx
import { ScrollToTopButton } from "./components/ScrollToTopButton";
```

- [ ] **Step 2: Add `<ScrollToTopButton />` inside `RouterContent`, after `<SiteFooter />`**

The `RouterContent` function should become:

```tsx
function RouterContent() {
  usePageTracking();
  return (
    <>
      <NavBar />
      <Suspense fallback={<div className="page-loading" aria-label="Laster…" />}>
        <Routes>
          <Route index element={<HomePage />} />
          <Route path="/arrangement/:id" element={<EventPage />} />
          <Route path="/lop" element={<LopPage />} />
          <Route path="/gpx" element={<GpxPage />} />
          <Route path="/hva-er-rittvaer" element={<HvaErRittvaerPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      <SiteFooter />
      <ScrollToTopButton />
    </>
  );
}
```

- [ ] **Step 3: Run the full verification suite**

```bash
bun run lint && bun run test && bun run build
```

Expected: all pass, no errors or warnings

- [ ] **Step 4: Final commit**

```bash
git add src/App.tsx
git commit -m "feat: mount ScrollToTopButton in app layout"
```
