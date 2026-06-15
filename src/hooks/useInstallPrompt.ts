// src/hooks/useInstallPrompt.ts
import { useState, useEffect, useRef, useCallback } from "react";

// BeforeInstallPromptEvent is not in the standard TypeScript lib
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "pwa-install-dismissed";
const IOS_DISMISSED_KEY = "pwa-ios-install-dismissed";

export function useInstallPrompt() {
  const deferred = useRef<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [iosDismissed, setIosDismissed] = useState(
    () => !!localStorage.getItem(IOS_DISMISSED_KEY)
  );

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return;

    function handler(e: Event) {
      e.preventDefault();
      deferred.current = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    }

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferred.current) return;
    await deferred.current.prompt();
    deferred.current = null;
    setCanInstall(false);
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISSED_KEY, "1");
    localStorage.setItem(IOS_DISMISSED_KEY, "1");
    deferred.current = null;
    setCanInstall(false);
    setIosDismissed(true);
  }, []);

  return { canInstall, iosDismissed, promptInstall, dismiss };
}
