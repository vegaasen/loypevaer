import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
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
      <div className="ritt-page ritt-page--not-found">
        <h1>404</h1>
        <p>Siden finnes ikke.</p>
        <Link to="/">Tilbake til oversikt</Link>
      </div>
    </>
  );
}
