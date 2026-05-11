# Feedback Snackbar — Design Spec

## Summary

A non-blocking feedback snackbar shown once to users who navigate from a list page (`/` or `/lop`) to an individual event page (`/arrangement/:id`). The user can answer 👍 or 👎, or dismiss. Responses are sent to GA4. The prompt re-appears after a 30-day cooldown.

---

## Trigger conditions

The snackbar is shown on `EventPage` mount **only when all of the following are true:**

1. The user arrived via React Router navigation from `/` or `/lop` (detected via `location.state.from` — set by the `<Link>` components in `EventCard` and `RunningEventRow`).
2. More than 30 days have elapsed since the last time the snackbar was shown (or it has never been shown).

If either condition fails, the snackbar is not mounted.

---

## Cooldown storage

- **localStorage key:** `loypevaer:feedback-last-shown`
- **Value:** ISO timestamp string of when the snackbar was last displayed.
- Written immediately when the snackbar appears (not when the user answers), so that repeated navigation in the same session doesn't show it again.
- After 30 days the key is effectively expired and the snackbar may show again.

---

## UI

- Fixed position, bottom of viewport: `position: fixed; bottom: 1.5rem; left: 1rem; right: 1rem` (max-width capped at ~480px, centred on desktop).
- Slides up from below via a CSS `@keyframes` animation on mount.
- Content:
  - Short question: **"Er værmeldingen nyttig for planleggingen din?"**
  - Two emoji buttons: 👍 and 👎
  - A small dismiss link/button: `×`
- On 👍, 👎 or `×`: fires the appropriate GA4 event (see below), then the snackbar fades out and unmounts.
- Auto-dismisses silently (no GA event) after **15 seconds** if the user takes no action.
- Styled with existing CSS custom properties — no new component library.

---

## GA4 event

Function in `src/lib/analytics.ts`:

```ts
trackFeedback(value: 1 | 5, eventId: string): void
```

- GA4 event name: `user_feedback`
- Parameters: `{ feedback_value: 1 | 5, event_id: string }`
- `1` = 👎 (lowest end of a future 1–5 scale), `5` = 👍 (highest end).
- Dismiss (`×`) and auto-dismiss do **not** fire this event.

---

## Files

| File | Action |
|---|---|
| `src/lib/analytics.ts` | Add `trackFeedback()` |
| `src/hooks/useFeedbackPrompt.ts` | New hook — trigger logic + localStorage cooldown |
| `src/components/FeedbackSnackbar.tsx` | New component — renders UI, calls hook + analytics |
| `src/components/EventCard.tsx` | Pass `state={{ from: "/" }}` on `<Link>` |
| `src/components/RunningEventRow.tsx` | Pass `state={{ from: "/lop" }}` on `<Link>` |
| `src/pages/EventPage.tsx` | Mount `<FeedbackSnackbar eventId={id} />` |
| `src/index.css` | Snackbar styles + slide-up animation |

---

## Out of scope

- No server-side storage of responses — GA4 only.
- No follow-up questions or free-text input.
- No A/B testing.
- No admin dashboard — use GA4 directly.
