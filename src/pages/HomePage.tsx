import { useMemo, useState } from "react";
import { RittCard } from "../components/RittCard";
import { useMyRitt } from "../hooks/useMyRitt";
import { usePageTitle } from "../hooks/usePageTitle";
import ritt from "../data/ritt.json";

type Race = (typeof ritt)[number];
type Discipline = "alle" | "landevei" | "terreng";

function groupByYearMonth(races: Race[]): Map<number, Map<number, Race[]>> {
  const sorted = [...races].sort(
    (a, b) => new Date(a.officialDate).getTime() - new Date(b.officialDate).getTime()
  );
  const grouped = new Map<number, Map<number, Race[]>>();
  for (const race of sorted) {
    const d = new Date(race.officialDate);
    const year = d.getFullYear();
    const month = d.getMonth(); // 0-indexed
    if (!grouped.has(year)) grouped.set(year, new Map());
    const byMonth = grouped.get(year)!;
    if (!byMonth.has(month)) byMonth.set(month, []);
    byMonth.get(month)!.push(race);
  }
  return grouped;
}

function monthName(month: number): string {
  return new Date(2000, month, 1).toLocaleDateString("nb-NO", { month: "long" });
}

/** Returns the number of days from today to dateStr (negative = past). */
function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/** Returns a Norwegian countdown string relative to today. */
function formatCountdown(dateStr: string): string {
  const diff = daysUntil(dateStr);
  if (diff === 0) return "i dag";
  if (diff === 1) return "i morgen";
  if (diff === -1) return "i går";
  if (diff > 0) return `om ${diff} dager`;
  return `${Math.abs(diff)} dager siden`;
}


const DISCIPLINE_LABELS: Record<Discipline, string> = {
  alle: "Alle",
  landevei: "Landevei",
  terreng: "Terreng",
};

export function HomePage() {
  usePageTitle("Rittvær");
  const { plannedIds, isPlanned, getPlanned, add, remove } = useMyRitt();
  const [discipline, setDiscipline] = useState<Discipline>("alle");
  const [search, setSearch] = useState("");

  const totalLandevei = useMemo(() => ritt.filter((r) => r.discipline === "landevei").length, []);
  const totalTerreng = useMemo(() => ritt.filter((r) => r.discipline === "terreng").length, []);

  const searchQuery = search.trim().toLowerCase();
  const filtered = ritt
    .filter((r) => discipline === "alle" || r.discipline === discipline)
    .filter((r) => !searchQuery || r.name.toLowerCase().includes(searchQuery));
  const grouped = groupByYearMonth(filtered);
  // Years descending (newest first, oldest at bottom)
  const years = [...grouped.keys()].sort((a, b) => b - a);

  const upcomingRaces = filtered
    .filter((r) => {
      const days = daysUntil(r.officialDate);
      return days >= 0 && days <= 14;
    })
    .sort((a, b) => new Date(a.officialDate).getTime() - new Date(b.officialDate).getTime());

  const plannedRaces = plannedIds
    .map((id) => ritt.find((r) => r.id === id))
    .filter((r): r is Race => r !== undefined)
    // Sort by saved date
    .sort((a, b) => {
      const da = getPlanned(a.id)?.date ?? a.officialDate;
      const db = getPlanned(b.id)?.date ?? b.officialDate;
      return new Date(da).getTime() - new Date(db).getTime();
    });

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
      <header className="home-page__header">
        <h1>Rittvær</h1>
        <p>Sjekk været langs ruten for norske sykkelritt</p>
        <div className="home-page__header-stats">
          <span className="home-page__header-stat">
            <strong>{ritt.length}</strong> ritt totalt
          </span>
          <span className="home-page__header-stat">
            <strong>{totalLandevei}</strong> landevei
          </span>
          <span className="home-page__header-stat">
            <strong>{totalTerreng}</strong> terreng
          </span>
        </div>
      </header>

      <div className="home-page__filter">
        {(["alle", "landevei", "terreng"] as Discipline[]).map((d) => (
          <button
            key={d}
            className={`home-page__filter-pill${discipline === d ? " home-page__filter-pill--active" : ""}`}
            onClick={() => setDiscipline(d)}
          >
            {DISCIPLINE_LABELS[d]}
          </button>
        ))}
        <input
          type="search"
          className="home-page__search"
          placeholder="Søk etter ritt…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Søk etter ritt"
        />
      </div>

      {plannedRaces.length > 0 && (
        <section className="home-page__mine-section">
          <h2 className="home-page__mine-heading">Mine ritt</h2>
          <div className="home-page__grid">
            {plannedRaces.map((r) => {
              const entry = getPlanned(r.id);
              const date = entry?.date ?? r.officialDate;
              return (
                <RittCard
                  key={r.id}
                  id={r.id}
                  name={r.name}
                  officialDate={r.officialDate}
                  distance={r.distance}
                  region={r.region}
                  discipline={r.discipline as "landevei" | "terreng"}
                  displayDate={entry?.date}
                  countdown={formatCountdown(date)}
                  planned
                  onTogglePlanned={(e) => handleToggle(r.id, r.officialDate, e)}
                />
              );
            })}
          </div>
        </section>
      )}

      {upcomingRaces.length > 0 && (
        <section className="home-page__upcoming-section">
          <h2 className="home-page__upcoming-heading">Kommer snart</h2>
          <div className="home-page__grid">
            {upcomingRaces.map((r) => (
              <RittCard
                key={r.id}
                id={r.id}
                name={r.name}
                officialDate={r.officialDate}
                distance={r.distance}
                region={r.region}
                discipline={r.discipline as "landevei" | "terreng"}
                countdown={formatCountdown(r.officialDate)}
                planned={isPlanned(r.id)}
                onTogglePlanned={(e) => handleToggle(r.id, r.officialDate, e)}
              />
            ))}
          </div>
        </section>
      )}

      <main className="home-page__sections">
        {filtered.length === 0 && (
          <p className="home-page__empty">Ingen ritt funnet.</p>
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
                       <RittCard
                         key={r.id}
                         id={r.id}
                         name={r.name}
                         officialDate={r.officialDate}
                         distance={r.distance}
                         region={r.region}
                         discipline={r.discipline as "landevei" | "terreng"}
                         planned={isPlanned(r.id)}
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
    </div>
  );
}
