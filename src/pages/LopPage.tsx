import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { EventCard } from "../components/EventCard";
import { useMyEvents } from "../hooks/useMyEvents";
import { allArrangements } from "../lib/arrangements";
import { SITE_URL } from "../lib/seo";
import { daysUntil, formatCountdown } from "../lib/dates";
import { groupByYearMonth } from "../lib/grouping";

const lopingRaces = allArrangements.filter((r) => r.discipline === "løping");

const MONTH_NAMES = [
  "Januar", "Februar", "Mars", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Desember",
];

function monthName(month: number): string {
  return MONTH_NAMES[month] ?? "";
}

type DistanceFilter = "alle" | "10k" | "halvmaraton" | "maraton";

const DISTANCE_LABELS: Record<DistanceFilter, string> = {
  alle: "Alle",
  "10k": "≤ 10 km",
  halvmaraton: "Halvmaraton",
  maraton: "Maraton",
};

function matchesDistance(distance: number, filter: DistanceFilter): boolean {
  if (filter === "alle") return true;
  if (filter === "10k") return distance <= 10;
  if (filter === "halvmaraton") return distance > 10 && distance <= 22;
  if (filter === "maraton") return distance > 22;
  return true;
}

export function LopPage() {
  const { isPlanned, add, remove } = useMyEvents();
  const [search, setSearch] = useState("");
  const [distanceFilter, setDistanceFilter] = useState<DistanceFilter>("alle");

  const searchQuery = search.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      lopingRaces.filter(
        (r) =>
          matchesDistance(r.distance, distanceFilter) &&
          (!searchQuery || r.name.toLowerCase().includes(searchQuery) || r.region.toLowerCase().includes(searchQuery)),
      ),
    [searchQuery, distanceFilter],
  );

  const grouped = useMemo(() => groupByYearMonth(filtered), [filtered]);
  const years = useMemo(
    () => [...grouped.keys()].sort((a, b) => b - a),
    [grouped],
  );

  const pageTitle = "Løpsvær – Vær for norske løp | Løypevær";
  const description = `Løypevær gir deg løpsvær og sanntidsvarsler for ${lopingRaces.length} norske løp — 10 km, halvmaraton og maraton. Sjekk temperatur, vind og nedbør langs hele ruten.`;
  const pageUrl = `${SITE_URL}/lop`;

  function handleToggle(id: string, officialDate: string, e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (isPlanned(id)) {
      remove(id);
    } else {
      add(id, { date: officialDate, startTime: "", finishTime: "" });
    }
  }

  return (
    <div className="home-page">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content="løpsvær, maratonvær, halvmaratonvær, 10 km vær, løp vær Norge, vær løpsdag, norske løp vær" />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:locale" content="nb_NO" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={description} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Norske løp – løpsvær og værmeldinger",
            url: pageUrl,
            numberOfItems: lopingRaces.length,
            itemListElement: lopingRaces.map((r, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: r.name,
              url: `${SITE_URL}/arrangement/${r.id}`,
            })),
          })}
        </script>
      </Helmet>

      <section className="home-page__hero">
        <div className="home-page__hero-eyebrow">Løping</div>
        <h1>Sjekk været.<br />Løp forberedt.</h1>
        <p className="home-page__hero-sub">
          Sanntidsvarsler for hvert nøkkelpunkt langs ruten — kun for løp innenfor
          16-dagersvinduet. Ingen historikk, bare aktuelt vær.
        </p>
        <div className="home-page__hero-stats">
          <span><strong>{lopingRaces.length}</strong> løp</span>
        </div>
      </section>

      <div className="home-page__filter">
        <div role="group" aria-label="Filtrer etter distanse" className="home-page__filter-pills">
          {(["alle", "10k", "halvmaraton", "maraton"] as DistanceFilter[]).map((d) => (
            <button
              key={d}
              className={`home-page__filter-pill${distanceFilter === d ? " home-page__filter-pill--active" : ""}`}
              onClick={() => setDistanceFilter(d)}
              aria-pressed={distanceFilter === d}
            >
              {DISTANCE_LABELS[d]}
            </button>
          ))}
        </div>
        <input
          type="search"
          className="home-page__search"
          placeholder="Filtrer løp…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Filtrer løp"
        />
      </div>

      <main className="home-page__sections">
        {years.length === 0 && (
          <p className="home-page__empty">Ingen løp funnet.</p>
        )}
        {years.map((year) => {
          const byMonth = grouped.get(year)!;
          const months = [...byMonth.keys()].sort((a, b) => a - b);
          return (
            <section key={year} className="home-page__year-section">
              <h2 className="home-page__year-heading">{year}</h2>
              {months.map((month) => (
                <div key={month} className="home-page__month-section">
                  <h3 className="home-page__month-heading">{monthName(month)}</h3>
                  <div className="home-page__grid">
                    {byMonth.get(month)!.map((r) => (
                      <EventCard
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
                        onTogglePlanned={(e) => handleToggle(r.id, r.officialDate, e)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </section>
          );
        })}
      </main>

      <div className="home-page__cta-banner" style={{ marginTop: "var(--space-xl)" }}>
        <div className="home-page__cta-banner-text">
          <div className="home-page__cta-banner-eyebrow">Sykkel, langrenn og triathlon?</div>
          <h2>Se alle utholdenhetsarrangement</h2>
          <p>Sjekk værvarsler og historiske klimasnitt for lange ritt, langrenn og triathlon.</p>
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
