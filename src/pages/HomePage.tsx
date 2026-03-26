import { RittCard } from "../components/RittCard";
import ritt from "../data/ritt.json";

type Race = (typeof ritt)[number];

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

export function HomePage() {
  const grouped = groupByYearMonth(ritt);
  // Years descending (newest first, oldest at bottom)
  const years = [...grouped.keys()].sort((a, b) => b - a);

  return (
    <div className="home-page">
      <header className="home-page__header">
        <h1>Rittvær</h1>
        <p>Sjekk været langs ruten for norske sykkelritt</p>
      </header>
      <main className="home-page__sections">
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
