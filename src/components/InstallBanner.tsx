// src/components/InstallBanner.tsx
import { useInstallPrompt } from "../hooks/useInstallPrompt";

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandaloneMode(): boolean {
  return "standalone" in navigator && (navigator as unknown as Record<string, unknown>).standalone === true;
}

export function InstallBanner() {
  const { canInstall, promptInstall, dismiss } = useInstallPrompt();

  const showIosBanner = isIos() && !isInStandaloneMode() && !canInstall;

  if (!canInstall && !showIosBanner) return null;

  if (showIosBanner) {
    return (
      <div className="install-banner install-banner--ios" role="banner">
        <div className="install-banner__content">
          <span className="install-banner__text">
            📲 Trykk <strong>Del</strong>{" "}
            <span className="install-banner__share-icon">⬆</span>,{" "}
            velg <strong>Legg til på hjemskjermen</strong>
          </span>
          <div className="install-banner__actions">
            <button
              className="install-banner__dismiss"
              aria-label="Lukk"
              onClick={dismiss}
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="install-banner" role="banner">
      <div className="install-banner__content">
        <span className="install-banner__text">
          📲 <strong>Løypevær på hjemskjermen</strong>
          <span className="install-banner__sub"> — ett trykk til rute og værvarsler</span>
        </span>
        <div className="install-banner__actions">
          <button className="install-banner__cta" onClick={() => void promptInstall()}>
            Legg til
          </button>
          <button className="install-banner__dismiss" aria-label="Lukk" onClick={dismiss}>
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
