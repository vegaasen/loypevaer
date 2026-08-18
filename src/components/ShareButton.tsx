import { useState } from "react";
import "./ShareButton.css";

type Props = {
  url: string;
  label?: string;
};

export function ShareButton({ url, label = "Del" }: Props) {
  const [copied, setCopied] = useState<"idle" | "copied" | "error">("idle");

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ url });
        return;
      } catch {
        // User cancelled or API unavailable — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied("copied");
      setTimeout(() => setCopied("idle"), 2500);
    } catch {
      setCopied("error");
      setTimeout(() => setCopied("idle"), 2500);
    }
  }

  return (
    <>
      <button className="share-button" onClick={() => void handleShare()} aria-label={label}>
        <svg
          className="share-button__icon"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M11 2.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM5 5.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM11 8.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM8.5 6.5l-3 2M8.5 9.5l-3-2" />
        </svg>
        {label}
      </button>
      {copied !== "idle" && (
        <div className="share-snackbar" role="status" aria-live="polite">
          {copied === "copied" ? "Kopiert!" : "Kunne ikke kopiere lenken"}
        </div>
      )}
    </>
  );
}
