import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { PageMeta } from "../components/PageMeta";
import { SITE_URL } from "../lib/seo";

export function NotFoundPage() {
  return (
    <>
      <PageMeta
        title="Siden finnes ikke – Løypevær"
        description="Siden du leter etter finnes ikke."
        canonicalUrl={`${SITE_URL}/404`}
      />
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="status-page">
        <div className="status-card">
          <h1 className="status-card__title">Siden finnes ikke</h1>
          <p className="status-card__body">
            Adressen du besøkte finnes ikke. Den kan ha blitt flyttet eller slettet.
          </p>
          <div className="status-card__actions">
            <Link to="/" className="status-card__btn">
              ← Tilbake til forsiden
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
