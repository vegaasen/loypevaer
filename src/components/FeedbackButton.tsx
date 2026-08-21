import { useState } from "react";
import { useLocation } from "react-router-dom";
import { trackUserSuggestion } from "../lib/analytics";
import { FeedbackModal } from "./FeedbackModal";

export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { pathname } = useLocation();

  function handleSubmit(text: string) {
    trackUserSuggestion(text, pathname);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  }

  return (
    <>
      <button
        className="feedback-fab"
        onClick={() => setIsOpen(true)}
        aria-label="Tilbakemelding"
      >
        Tilbakemelding
      </button>
      {submitted && (
        <div className="feedback-fab__confirmation" role="status" aria-live="polite">
          Takk for tilbakemeldingen!
        </div>
      )}
      <FeedbackModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={handleSubmit}
      />
    </>
  );
}
