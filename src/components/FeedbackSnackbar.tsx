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
