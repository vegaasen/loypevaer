import { Fragment, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { PageMeta } from "../components/PageMeta";
import { RunningEventRow } from "../components/RunningEventRow";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useMyEvents } from "../hooks/useMyEvents";
import { allArrangements, type RittEntry } from "../lib/arrangements";
import { daysUntil, formatCountdown } from "../lib/dates";
import { groupByYearMonth } from "../lib/grouping";
import { monthName } from "../lib/month";
import { SITE_URL } from "../lib/seo";

const langrennRaces = allArrangements.filter((r) => r.discipline === "langrenn");

export function LangrennPage() {
  const { isPlanned, add, remove } = useMyEvents();
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("");

  const debouncedSearch = useDebouncedValue(search);
  const searchQuery = debouncedSearch.trim().toLowerCase();

  const regions = useMemo(
    () => [...new Set(langrennRaces.map((r) => r.region))].sort((a, b) => a.localeCompare(b, "nb")),
    [],
  );

  const filtered = useMemo(
    () =>
      langrennRaces.filter(
        (r) =>
          (region === "" || r.region === region) &&
          (!searchQuery ||
            r.name.toLowerCase().includes(searchQuery) ||
            r.region.toLowerCase().includes(searchQuery)),
      ),
    [searchQuery, region],
  );

  const grouped = useMemo(() => groupByYearMonth(filtered), [filtered]);
  const now = useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const years = useMemo(() => [...grouped.keys()].sort((a, b) => b - a), [grouped]);
  // The on-snow season runs Oct–May, spanning a calendar year boundary. From June
  // onwards, next year's races are next season — the immediately relevant one —
  // so they belong in the main list, not tucked away under "Kommende sesonger".
  const seasonCutoffYear = currentMonth >= 5 ? currentYear + 1 : currentYear;
  const currentAndPastYears = useMemo(
    () => years.filter((y) => y <= seasonCutoffYear),
    [years, seasonCutoffYear],
  );
  const futureYears = useMemo(
    () => years.filter((y) => y > seasonCutoffYear),
    [years, seasonCutoffYear],
  );
  const nextSeasonYear =
    seasonCutoffYear === currentYear + 1 && grouped.has(currentYear + 1) ? currentYear + 1 : null;
  // currentAndPastYears is sorted descending, so next season would otherwise land
  // above the current year. Reorder so it's current year, then next season, then past.
  const displayYears = useMemo(() => {
    if (!nextSeasonYear) return currentAndPastYears;
    const rest = currentAndPastYears.filter((y) => y !== nextSeasonYear);
    const currentIdx = rest.indexOf(currentYear);
    return [...rest.slice(0, currentIdx + 1), nextSeasonYear, ...rest.slice(currentIdx + 1)];
  }, [currentAndPastYears, nextSeasonYear, currentYear]);

  const pageTitle = "Langrennvær – Vær for norske skirenn | Løypevær";
  const description = `Sjekk langrennvær og skiføre for ${langrennRaces.length} norske skirenn — fra Birkebeinerrittet til lokale turrenn. Sanntidsvarsler for temperatur, vind og snøforhold langs hele løypa, tilpasset din starttid.`;
  const pageUrl = `${SITE_URL}/langrenn`;

  function handleToggle(id: string, officialDate: string, e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (isPlanned(id)) {
      remove(id);
    } else {
      add(id, { date: officialDate, startTime: "", finishTime: "" });
    }
  }

  function renderMonth(year: number, month: number, monthEvents: RittEntry[]) {
    const isCurrentMonth = year === currentYear && month === currentMonth;
    const isCollapsedMonth =
      monthEvents.every((r) => daysUntil(r.officialDate) < 0) && !isCurrentMonth;
    const monthInner = (
      <div id={`month-${year}-${month}`} className="home-page__month-section">
        <div className="lop-list">
          {monthEvents.map((r) => (
            <RunningEventRow
              key={r.id}
              id={r.id}
              name={r.name}
              officialDate={r.officialDate}
              distance={r.distance}
              distanceLabel={r.distanceLabel}
              region={r.region}
              discipline={r.discipline}
              countdown={formatCountdown(r.officialDate)}
              planned={isPlanned(r.id)}
              isPast={daysUntil(r.officialDate) < 0}
              dateStatus={r.dateStatus}
              fromPath="/langrenn"
              showCategory={false}
              onTogglePlanned={(e) => handleToggle(r.id, r.officialDate, e)}
            />
          ))}
        </div>
      </div>
    );
    if (isCollapsedMonth) {
      return (
        <details key={`${year}-${month}`} className="home-page__month-details">
          <summary className="home-page__month-heading home-page__month-summary">
            <span className="home-page__month-summary-label">
              {monthName(month)}
              <span className="month-count-badge">{monthEvents.length}</span>
            </span>
          </summary>
          {monthInner}
        </details>
      );
    }
    return (
      <Fragment key={`${year}-${month}`}>
        <h3 className="home-page__month-heading">
          <a href={`#month-${year}-${month}`} className="home-page__month-anchor">
            {monthName(month)}
          </a>
          {monthEvents.length > 1 && (
            <span className="month-count-badge">{monthEvents.length}</span>
          )}
        </h3>
        {monthInner}
      </Fragment>
    );
  }

  return (
    <div className="home-page">
      <PageMeta title={pageTitle} description={description} canonicalUrl={pageUrl} />
      <Helmet>
        <meta
          name="keywords"
          content="langrennvær, skirenn vær, skiføre, rennvær, Birkebeinerrittet vær, skiskyting vær, skirenn Norge"
        />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Norske skirenn – langrennvær og værmeldinger",
            url: pageUrl,
            numberOfItems: langrennRaces.length,
            itemListElement: langrennRaces.map((r, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: r.name,
              url: `${SITE_URL}/arrangement/${r.id}`,
            })),
          })}
        </script>
      </Helmet>

      <section className="home-page__hero">
        <div className="home-page__hero-eyebrow">Langrenn</div>
        <h1>
          Sjekk skiføret.
          <br />
          Gå forberedt.
        </h1>
        <p className="home-page__hero-sub">
          Sjekk temperatur, vind og snøforhold langs hele løypa — sanntidsvarsler for skirenn
          innenfor 16 dager. Tilpasset din starttid.
        </p>
        <p className="home-page__hero-sub">
          Rennene hentes fra Norges Skiforbunds arrangementskalender, i tillegg til håndplukkede
          klassikere som Birkebeinerrittet.
        </p>
        <div className="home-page__hero-stats">
          <span>
            <strong>{langrennRaces.length}</strong> skirenn
          </span>
        </div>
      </section>

      <div className="home-page__filter">
        <div className="home-page__filter-controls">
          <select
            className="home-page__filter-select"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            aria-label="Filtrer etter region"
          >
            <option value="">Alle regioner</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <input
            type="search"
            className="home-page__search"
            placeholder="Filtrer skirenn…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Filtrer skirenn"
          />
        </div>
      </div>

      <main className="home-page__sections">
        {years.length === 0 && <p className="home-page__empty">Ingen skirenn funnet.</p>}
        {displayYears.map((year) => {
          const byMonth = grouped.get(year)!;
          const months = [...byMonth.keys()].sort((a, b) => a - b);
          const isPastYear = year < currentYear;
          const yearContent = (
            <>{months.map((month) => renderMonth(year, month, byMonth.get(month)!))}</>
          );
          if (isPastYear) {
            return (
              <details key={year} className="home-page__year-details">
                <summary className="home-page__year-heading home-page__year-summary">
                  {year}
                </summary>
                <section className="home-page__year-section">{yearContent}</section>
              </details>
            );
          }
          return (
            <section key={year} className="home-page__year-section">
              <h2 className="home-page__year-heading">{year}</h2>
              {yearContent}
            </section>
          );
        })}
        {futureYears.length > 0 && (
          <details className="home-page__future-years">
            <summary className="home-page__future-years-summary">
              Kommende sesonger ({futureYears.sort((a, b) => a - b).join(", ")})
            </summary>
            {futureYears.map((year) => {
              const byMonth = grouped.get(year)!;
              const months = [...byMonth.keys()].sort((a, b) => a - b);
              return (
                <section key={year} className="home-page__year-section">
                  <h2 className="home-page__year-heading">{year}</h2>
                  {months.map((month) => renderMonth(year, month, byMonth.get(month)!))}
                </section>
              );
            })}
          </details>
        )}
      </main>

      <div className="home-page__cta-banner" style={{ marginTop: "var(--space-xl)" }}>
        <div className="home-page__cta-banner-text">
          <div className="home-page__cta-banner-eyebrow">Sykkel, løping og triathlon?</div>
          <h2>Se alle utholdenhetsarrangement</h2>
          <p>Sjekk værvarsler og historiske klimasnitt for lange ritt, løp og triathlon.</p>
        </div>
        <div className="home-page__cta-banner-action">
          <Link to="/" className="home-page__cta-banner-btn">
            Tilbake til oversikt →
          </Link>
        </div>
      </div>
    </div>
  );
}
