import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { trackUserSuggestion } from "../lib/analytics";
import { FeedbackModal } from "./FeedbackModal";

export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { pathname } = useLocation();
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  function handleSubmit(text: string) {
    trackUserSuggestion(text, pathname);
    setIsOpen(false);
    setSubmitted(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setSubmitted(false), 4000);
  }

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return (
    <>
      <button className="feedback-fab" onClick={() => setIsOpen(true)} aria-label="Tilbakemelding">
        Tilbakemelding
      </button>
      {submitted && (
        <div className="feedback-fab__confirmation" role="status" aria-live="polite">
          Takk for tilbakemeldingen!
        </div>
      )}
      <FeedbackModal isOpen={isOpen} onClose={() => setIsOpen(false)} onSubmit={handleSubmit} />
    </>
  );
}
