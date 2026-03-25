import { RittCard } from "../components/RittCard";
import ritt from "../data/ritt.json";

export function HomePage() {
  const sorted = [...ritt].sort(
    (a, b) => new Date(a.officialDate).getTime() - new Date(b.officialDate).getTime()
  );

  return (
    <div className="home-page">
      <header className="home-page__header">
        <h1>Rittvær</h1>
        <p>Sjekk været langs ruten for norske sykkelritt</p>
      </header>
      <main className="home-page__grid">
        {sorted.map((r) => (
          <RittCard
            key={r.id}
            id={r.id}
            name={r.name}
            officialDate={r.officialDate}
            distance={r.distance}
            region={r.region}
          />
        ))}
      </main>
    </div>
  );
}
