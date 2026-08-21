import { useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (text: string) => void;
}

const MAX_LENGTH = 280;

export function FeedbackModal({ isOpen, onClose, onSubmit }: Props) {
  const [text, setText] = useState("");

  if (!isOpen) return null;

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setText("");
    onClose();
  }

  function handleCancel() {
    setText("");
    onClose();
  }

  return (
    <div
      className="feedback-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-heading"
    >
      <div className="feedback-modal">
        <h2 id="feedback-modal-heading" className="feedback-modal__heading">
          Hva ønsker du å endre eller savner du?
        </h2>
        <textarea
          className="feedback-modal__textarea"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
          maxLength={MAX_LENGTH}
          rows={4}
          placeholder="Skriv din tilbakemelding her…"
          aria-label="Tilbakemelding"
        />
        <p className="feedback-modal__char-count">
          {text.length} / {MAX_LENGTH}
        </p>
        <div className="feedback-modal__actions">
          <button
            className="feedback-modal__submit"
            onClick={handleSubmit}
            disabled={!text.trim()}
          >
            Send
          </button>
          <button className="feedback-modal__cancel" onClick={handleCancel}>
            Avbryt
          </button>
        </div>
      </div>
    </div>
  );
}
