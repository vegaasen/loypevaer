import { useEffect, useMemo, useRef, useState } from "react";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { EventCard } from "../components/EventCard";
import { PageMeta } from "../components/PageMeta";
import { useFilterContext } from "../context/useFilterContext";
import { useMyEvents } from "../hooks/useMyEvents";
import { allArrangements as ritt, getNextPerDiscipline, type RittEntry } from "../lib/arrangements";
import { FeaturedEventCard } from "../components/FeaturedEventCard";
import { FILTER_DISCIPLINE_LABEL } from "../lib/disciplines";
import { SITE_URL } from "../lib/seo";
import { allArrangements as allForJsonLd } from "../lib/arrangements";
import { daysUntil, formatCountdown, parseDateLocal } from "../lib/dates";
import { groupByYearMonth } from "../lib/grouping";
import { monthName } from "../lib/month";

type Discipline = "alle" | "landevei" | "terreng" | "langrenn" | "triathlon" | "ultraløp" | "løping";

export function HomePage() {
  const description =
    `Sjekk rittvær og værvarsler for ${ritt.length} norske utholdenhetsarrangement — sykkelritt, langrenn, triathlon og ultraløp. Se temperatur, vind og nedbør punkt for punkt langs løypa, tilpasset din starttid.`;

  const { plannedIds, isPlanned, getPlanned, add, remove } = useMyEvents();
  const { discipline, setDiscipline } = useFilterContext();
  const [search, setSearch] = useState("");

  const totalSykkel = useMemo(() => ritt.filter((r) => r.discipline === "landevei" || r.discipline === "terreng").length, []);
  const totalLangrenn = useMemo(() => ritt.filter((r) => r.discipline === "langrenn").length, []);
  const totalLoping = useMemo(() => ritt.filter((r) => r.discipline === "ultraløp").length, []);
  const totalTriathlon = useMemo(() => ritt.filter((r) => r.discipline === "triathlon").length, []);
  const totalKortereLop = useMemo(() => ritt.filter((r) => r.discipline === "løping").length, []);

  const debouncedSearch = useDebouncedValue(search);
  const searchQuery = debouncedSearch.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      ritt
        .filter((r) => r.discipline !== "løping")
        .filter((r) => discipline === "alle" || r.discipline === discipline)
        .filter((r) => !searchQuery || r.name.toLowerCase().includes(searchQuery) || r.region.toLowerCase().includes(searchQuery)),
    [discipline, searchQuery]
  );

  const grouped = useMemo(() => groupByYearMonth(filtered), [filtered]);
  const years = useMemo(() => [...grouped.keys()].sort((a, b) => b - a), [grouped]);

  const featuredEvents = useMemo(
    () => getNextPerDiscipline(ritt.filter((r) => r.discipline !== "løping")),
    []
  );

  const plannedRaces = useMemo(
    () =>
      plannedIds
        .map((id) => ritt.find((r) => r.id === id))
        .filter((r): r is RittEntry => r !== undefined && r.dateStatus !== "cancelled")
        .sort((a, b) => {
          const da = getPlanned(a.id)?.date ?? a.officialDate;
          const db = getPlanned(b.id)?.date ?? b.officialDate;
          return parseDateLocal(da).getTime() - parseDateLocal(db).getTime();
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [plannedIds]
  );


  function handleToggle(id: string, officialDate: string, e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (isPlanned(id)) {
      remove(id);
    } else {
      add(id, { date: officialDate, startTime: "", finishTime: "" });
    }
  }

  const feature1Ref = useRef<HTMLDivElement>(null);
  const feature2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const refs = [feature1Ref.current, feature2Ref.current].filter(
      (el): el is HTMLDivElement => el !== null
    );

    refs.forEach((el) => el.classList.add("js-animate"));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    refs.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="home-page">
      <PageMeta
        title="Løypevær – Rittvær og vær for norske utholdenhetsarrangement"
        description={description}
        canonicalUrl={SITE_URL}
      />
      <Helmet>
        <meta name="keywords" content="rittvær, sykkelritt vær, langrenn vær, triathlon vær, ultraløp vær, løpsvær, værmelding ritt, etappevær" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Løypevær",
            url: SITE_URL,
            description,
            inLanguage: "nb-NO",
            potentialAction: {
              "@type": "SearchAction",
              target: `${SITE_URL}/arrangement/{id}`,
              "query-input": "required name=id",
            },
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Norske utholdenhetsarrangement – rittvær og værmeldinger",
            url: SITE_URL,
            numberOfItems: allForJsonLd.length,
            itemListElement: allForJsonLd.map((r, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: r.name,
              url: `${SITE_URL}/arrangement/${r.id}`,
            })),
          })}
        </script>
      </Helmet>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="home-page__hero">
        <div className="home-page__hero-eyebrow">Sykkel · Langrenn · Triathlon · Ultraløp</div>
        <h1>
          <span className="hero-weather-word" aria-label="Sjekk været">
            <span aria-hidden="true">Vind.</span>
            <span aria-hidden="true">Sol.</span>
            <span aria-hidden="true">Regn.</span>
            <span aria-hidden="true">Snø.</span>
          </span>
          <br />Kom forberedt til start.
        </h1>
        <p className="home-page__hero-sub">
          Temperaturen på toppen, vinden i motbakkene, nedbøren ved mål —
          timebasert vær langs hele løypa, tilpasset din starttid.
        </p>
        <a href="#alle-arrangement" className="home-page__hero-cta">
          Finn ditt arrangement →
        </a>
        <div className="home-page__hero-stats">
          <span><strong>{ritt.length}</strong> arrangement totalt</span>
          {totalSykkel > 0 && <span><strong>{totalSykkel}</strong> sykkel</span>}
          {totalLangrenn > 0 && <span><strong>{totalLangrenn}</strong> langrenn</span>}
          {totalLoping > 0 && <span><strong>{totalLoping}</strong> ultraløp</span>}
          {totalTriathlon > 0 && <span><strong>{totalTriathlon}</strong> triathlon</span>}
          {totalKortereLop > 0 && <span><strong>{totalKortereLop}</strong> kortere løp</span>}
        </div>
      </section>

      {/* ── Feature sections ──────────────────────────────────────────── */}
      <div className="home-page__features">

        <div className="home-page__feature" ref={feature1Ref}>
          <div className="home-page__feature-text">
            <div className="home-page__feature-eyebrow">Punkt for punkt</div>
            <h2>Vær for hele løypa — ikke bare starten</h2>
            <p>
              Vi henter værvarsler for alle nøkkelpunktene langs ruten — start,
              topp, nedstigning og mål. Du ser temperatur, vind og nedbør akkurat der det
              teller, ikke bare ved startstreken.
            </p>
          </div>
          <div className="home-page__feature-visual">
            <svg className="home-page__feature-visual-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
              <line x1="9" y1="3" x2="9" y2="18" />
              <line x1="15" y1="6" x2="15" y2="21" />
            </svg>
            <div className="home-page__feature-visual-title">Etappepunkter</div>
            <ul className="home-page__feature-visual-items">
              <li className="home-page__feature-visual-item">Start — 200 moh. &nbsp;☁️ 12°C</li>
              <li className="home-page__feature-visual-item">Toppunkt — 890 moh. &nbsp;🌨️ 4°C</li>
              <li className="home-page__feature-visual-item">Mellompassering — 560 moh. &nbsp;🌦️ 8°C</li>
              <li className="home-page__feature-visual-item">Mål — 180 moh. &nbsp;⛅ 14°C</li>
            </ul>
          </div>
        </div>

        <div className="home-page__feature home-page__feature--reverse" ref={feature2Ref}>
          <div className="home-page__feature-text">
            <div className="home-page__feature-eyebrow">Alltid relevant data</div>
            <h2>Langt frem i tid? Vi bruker 15 års historikk.</h2>
            <p>
              Innenfor 16 dager henter vi live-varsler direkte fra Open-Meteo for hvert
              punkt langs ruten. For arrangement lenger frem i tid bruker vi historiske
              klimasnitt fra de siste 15 årene — samme dato, samme sted.
              Du vet alltid hva slags vær du kan forvente.
            </p>
          </div>
          <div className="home-page__feature-visual">
            <svg className="home-page__feature-visual-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            <div className="home-page__feature-visual-title">Datakilder</div>
            <ul className="home-page__feature-visual-items">
              <li className="home-page__feature-visual-item">Timebasert varsel (0–16 dager)</li>
              <li className="home-page__feature-visual-item">Klimasnitt (historisk gjennomsnitt)</li>
              <li className="home-page__feature-visual-item">Smarte bekledningsråd basert på data</li>
              <li className="home-page__feature-visual-item">Føreforhold (is, slaps, vått)</li>
            </ul>
          </div>
        </div>

      </div>

      {/* ── Filter + search ───────────────────────────────────────────── */}
      <div id="alle-arrangement" className="home-page__filter">
        <div role="group" aria-label="Filtrer etter disiplin" className="home-page__filter-pills">
          {(["alle", "landevei", "terreng", "langrenn", "triathlon", "ultraløp", "løping"] as Discipline[]).map((d) => (
            <button
              key={d}
              className={`home-page__filter-pill${discipline === d ? " home-page__filter-pill--active" : ""}`}
              onClick={() => setDiscipline(d)}
              aria-pressed={discipline === d}
            >
              {FILTER_DISCIPLINE_LABEL[d]}
            </button>
          ))}
        </div>
        <input
          type="search"
          className="home-page__search"
          placeholder="Filtrer arrangement…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Filtrer arrangement"
        />
      </div>

      {/* ── Mine ritt ─────────────────────────────────────────────────── */}
      {plannedRaces.length > 0 ? (
        <section className="home-page__mine-section">
          <h2 className="home-page__mine-heading">Mine arrangement</h2>
          <div className="home-page__grid">
            {plannedRaces.map((r) => {
              const entry = getPlanned(r.id);
              const date = entry?.date ?? r.officialDate;
              return (
                <EventCard
                  key={r.id}
                  id={r.id}
                  name={r.name}
                  officialDate={r.officialDate}
                  distance={r.distance}
                  distanceLabel={r.distanceLabel}
                  region={r.region}
                  discipline={r.discipline}
                  displayDate={entry?.date}
                  countdown={formatCountdown(date)}
                  planned
                  isPast={daysUntil(date) < 0}
                  dateStatus={r.dateStatus}
                  onTogglePlanned={(e) => handleToggle(r.id, r.officialDate, e)}
                />
              );
            })}
          </div>
        </section>
      ) : (
        <p className="home-page__mine-hint">
          Trykk 📍 på et arrangement for å lagre det her — så finner du det raskt igjen.
        </p>
      )}

      {/* ── Featured (neste per disiplin) ────────────────────────────── */}
      {featuredEvents.length > 0 && discipline === "alle" && (
        <section className="home-page__featured-section">
          <h2 className="home-page__featured-heading">Neste arrangement</h2>
          <div className="home-page__featured-grid">
            {featuredEvents.map((r) => (
              <FeaturedEventCard
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
                dateStatus={r.dateStatus}
                onTogglePlanned={(e) => handleToggle(r.id, r.officialDate, e)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── All ritt grid / Løping promo ──────────────────────────────── */}
      {discipline === "løping" ? (
        <section className="home-page__lop-promo" aria-label="Løping har egen side">
          <div className="home-page__lop-promo-content">
            <div className="home-page__feature-eyebrow">Løping</div>
            <h2>Kortere løp har sin egen side</h2>
            <p>
              Sentrumsløpet, Birkebeinerløpet og mange andre kortere løp finner du på løpesiden.
              Der viser vi sanntidsvarsler for løpsdagen — temperatur, vind og nedbør der det teller.
            </p>
            <Link to="/lop" className="home-page__lop-teaser-btn">
              Se alle løp →
            </Link>
          </div>
        </section>
      ) : (
        <main className="home-page__sections">
          {filtered.length === 0 && (
            <p className="home-page__empty">Ingen arrangement funnet.</p>
          )}
          {years.map((year) => {
            const byMonth = grouped.get(year)!;
            const months = [...byMonth.keys()].sort((a, b) => a - b);
            return (
              <section key={year} className="home-page__year-section">
                <h2 className="home-page__year-heading">{year}</h2>
                {months.map((month) => {
                  const monthEvents = byMonth.get(month)!;
                  const allPast = monthEvents.every(
                    (r) => daysUntil(r.officialDate) < 0
                  );
                  return (
                    <div key={month} id={`month-${year}-${month}`} className="home-page__month-section">
                      <h3 className="home-page__month-heading">
                        <a href={`#month-${year}-${month}`} className="home-page__month-anchor">
                          {monthName(month)}
                        </a>
                        {monthEvents.length > 1 && (
                          <span className="month-count-badge">{monthEvents.length}</span>
                        )}
                      </h3>
                      <div className={`home-page__grid${allPast ? " home-page__grid--past-list" : ""}`}>
                        {monthEvents.map((r) => (
                          <EventCard
                            key={r.id}
                            id={r.id}
                            name={r.name}
                            officialDate={r.officialDate}
                            distance={r.distance}
                            distanceLabel={r.distanceLabel}
                            region={r.region}
                            discipline={r.discipline}
                            planned={isPlanned(r.id)}
                            isPast={daysUntil(r.officialDate) < 0}
                            dateStatus={r.dateStatus}
                            onTogglePlanned={(e) => handleToggle(r.id, r.officialDate, e)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </section>
            );
          })}
        </main>
      )}

      {/* ── Løping teaser ─────────────────────────────────────────────── */}
      <section className="home-page__lop-teaser">
        <div className="home-page__lop-teaser-text">
          <div className="home-page__feature-eyebrow">Løping</div>
          <h2>Kortere løp fortjener like godt værvarsel.</h2>
          <p>
            Vi holder oversikt over kortere løp som Sentrumsløpet og Birkebeinerløpet.
            Her viser vi sanntidsvarsler for løpsdagen — temperatur, vind og nedbør der det teller.
          </p>
        </div>
        <Link to="/lop" className="home-page__lop-teaser-btn">
          Kortere løp →
        </Link>
      </section>


    </div>
  );
}
