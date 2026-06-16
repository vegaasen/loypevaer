import { Link } from "react-router-dom";
import { PageMeta } from "../components/PageMeta";
import { SITE_URL } from "../lib/seo";
import changelogData from "../data/changelog.json";
import type { ChangelogEntry } from "../data/changelog.types";

const pageUrl = `${SITE_URL}/endringslogg`;
const pageTitle = "Endringslogg – hva er nytt i Løypevær?";
const description =
  "Oversikt over nye funksjoner og rettelser i Løypevær — automatisk generert fra kodehistorikken.";

const changelog = changelogData as ChangelogEntry[];

export function EndringsloggPage() {
  return (
    <div className="ritt-page">
      <PageMeta
        title={pageTitle}
        description={description}
        canonicalUrl={pageUrl}
        ogType="article"
      />

      <Link to="/" className="ritt-page__back-link">← Alle arrangement</Link>

      <header className="ritt-page__header">
        <div className="ritt-page__title-row">
          <h1>Endringslogg</h1>
        </div>
        <p className="ritt-page__lead">
          Nye funksjoner og rettelser i Løypevær — generert automatisk fra
          kodehistorikken.
        </p>
      </header>

      <div className="ritt-page__article">
        {changelog.length === 0 ? (
          <p className="endringslogg__empty">Ingen endringer registrert ennå.</p>
        ) : (
          <ol className="endringslogg__list">
            {changelog.map((entry) => (
              <li key={entry.sha} className="endringslogg__entry">
                <div className="endringslogg__meta">
                  <span
                    className={`endringslogg__badge endringslogg__badge--${entry.type}`}
                  >
                    {entry.type}
                  </span>
                  {entry.scope && (
                    <span className="endringslogg__scope">{entry.scope}</span>
                  )}
                  <time
                    className="endringslogg__date"
                    dateTime={entry.date}
                  >
                    {entry.date}
                  </time>
                  <a
                    className="endringslogg__sha"
                    href={entry.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Vis commit ${entry.shortSha} på GitHub`}
                  >
                    {entry.shortSha}
                  </a>
                </div>
                <p className="endringslogg__subject">{entry.subject}</p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
