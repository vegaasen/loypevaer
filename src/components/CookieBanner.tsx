import { useCookieConsent } from "../hooks/useCookieConsent";

export function CookieBanner() {
  const { consent, accept, decline } = useCookieConsent();

  // Already decided — don't render
  if (consent !== null) return null;

  return (
    <div className="cookie-banner" role="region" aria-label="Informasjonskapsel-samtykke">
      <p className="cookie-banner__text">
        Vi bruker anonyme analysedata for å gjøre siden bedre.{" "}
        <a
          href="https://policies.google.com/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="cookie-banner__link"
        >
          Les mer
        </a>
      </p>
      <div className="cookie-banner__actions">
        <button
          type="button"
          className="cookie-banner__btn cookie-banner__btn--decline"
          onClick={decline}
        >
          Kun nødvendige
        </button>
        <button
          type="button"
          className="cookie-banner__btn cookie-banner__btn--accept"
          onClick={accept}
        >
          Godta
        </button>
      </div>
    </div>
  );
}
