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

  const [visible, setVisible] = useState<boolean>(shouldShow);

  useEffect(() => {
    if (shouldShow) {
      recordShown();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally runs once on mount

  return {
    visible,
    dismiss: () => setVisible(false),
  };
}
