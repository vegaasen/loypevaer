import { Link } from "react-router-dom";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__links">
        <Link to="/hva-er-loypevaer">Hva er løypevær?</Link>
        <Link to="/endringslogg">Endringslogg</Link>
        <a
          href="https://github.com/vegaasen/loypevaer/issues/new?template=suggest-ritt.yml"
          target="_blank"
          rel="noopener noreferrer"
        >
          Foreslå et arrangement
        </a>
      </div>
      <div className="site-footer__meta">
        <span>
          Data:{" "}
          <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer">
            Open-Meteo
          </a>{" "}
          &{" "}
          <a href="https://www.openstreetmap.org" target="_blank" rel="noopener noreferrer">
            OpenStreetMap
          </a>
        </span>
        <span>
          Kokt sammen av{" "}
          <a href="https://www.vegaasen.com" target="_blank" rel="noopener noreferrer">
            Vegard Aasen
          </a>
        </span>
      </div>
    </footer>
  );
}
