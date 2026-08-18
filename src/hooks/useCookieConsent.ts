import { useCallback, useState } from "react";

export type ConsentValue = "granted" | "denied";

const STORAGE_KEY = "loypevaer:cookie-consent";

function readStorage(): ConsentValue | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "granted" || raw === "denied") return raw;
  } catch {
    // private mode or quota error — treat as no consent
  }
  return null;
}

function writeStorage(value: ConsentValue): void {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // ignore
  }
}

function updateGtagConsent(value: ConsentValue): void {
  if (typeof gtag === "undefined") return;
  gtag("consent", "update", { analytics_storage: value });
}

export function useCookieConsent() {
  const [consent, setConsent] = useState<ConsentValue | null>(readStorage);

  const accept = useCallback(() => {
    writeStorage("granted");
    updateGtagConsent("granted");
    setConsent("granted");
  }, []);

  const decline = useCallback(() => {
    writeStorage("denied");
    updateGtagConsent("denied");
    setConsent("denied");
  }, []);

  return { consent, accept, decline };
}
