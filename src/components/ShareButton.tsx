import { useState, useEffect, useRef } from "react";

const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

type CopyState = "idle" | "copied" | "error";

export function ShareButton() {
  const [state, setState] = useState<CopyState>("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    };
  }, []);

  async function handleShare() {
    try {
      if (canNativeShare) {
        await navigator.share({ url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
      }
      setState("copied");
    } catch {
      setState("error");
    }
    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setState("idle"), 2000);
  }

  const label =
    state === "copied" ? (canNativeShare ? "Delt!" : "Kopiert!") : state === "error" ? "Feil" : "Del lenke";

  return (
    <button
      className={`ritt-page__bookmark-btn ritt-page__share-btn${state !== "idle" ? ` ritt-page__share-btn--${state}` : ""}`}
      onClick={() => void handleShare()}
      title="Kopier lenke til utklippstavlen"
      aria-live="polite"
    >
      {label}
    </button>
  );
}
