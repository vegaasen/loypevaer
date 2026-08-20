import { Link } from "react-router-dom";
import { DisciplineStatsSection } from "../components/DisciplineStatsSection";
import { PageMeta } from "../components/PageMeta";
import weatherStatsData from "../data/weather-stats.json";
import type { EventWeatherStats, WeatherStatsData } from "../data/weather-stats.types";
import type { Discipline } from "../lib/arrangements";
import { SITE_URL } from "../lib/seo";

const pageUrl = `${SITE_URL}/statistikk`;
const pageTitle = "Værstastistikk – historisk vær per arrangement";
const description =
  "Historisk væroversikt for norske sykkelritt, langrenn, triathlon og ultraløp — rangert etter komfort, temperatur, nedbør og vind.";

const stats = weatherStatsData as unknown as WeatherStatsData;

const DISCIPLINE_ORDER: Discipline[] = [
  "landevei",
  "gravel",
  "terreng",
  "cx",
  "langrenn",
  "triathlon",
  "ultraløp",
  "løping",
];

function groupByDiscipline(events: EventWeatherStats[]): Map<Discipline, EventWeatherStats[]> {
  const map = new Map<Discipline, EventWeatherStats[]>();
  for (const d of DISCIPLINE_ORDER) map.set(d, []);
  for (const event of events) {
    const d = event.discipline as Discipline;
    if (map.has(d)) {
      map.get(d)!.push(event);
    } else {
      map.set(d, [event]);
    }
  }
  return map;
}

const grouped = groupByDiscipline(stats.events);
const generatedDate = new Date(stats.generatedAt).toLocaleDateString("nb-NO", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function StatistikkPage() {
  return (
    <div className="ritt-page">
      <PageMeta
        title={pageTitle}
        description={description}
        canonicalUrl={pageUrl}
        ogType="website"
      />

      <Link to="/" className="ritt-page__back-link">
        ← Alle arrangement
      </Link>

      <header className="ritt-page__header">
        <div className="ritt-page__title-row">
          <h1>Værstastistikk</h1>
        </div>
        <p className="ritt-page__lead">
          Historiske værtall for norske utholdenhetsarrangement — basert på opptil 10 år med
          arkivdata fra Open-Meteo. Rangeringene viser snittforhold på arrangementsdagen.
        </p>
        <p className="stats-page__updated">Sist oppdatert: {generatedDate}</p>
      </header>

      <div className="stats-page__sections">
        {DISCIPLINE_ORDER.map((discipline) => {
          const events = grouped.get(discipline) ?? [];
          if (events.length === 0) return null;
          return (
            <DisciplineStatsSection key={discipline} discipline={discipline} events={events} />
          );
        })}
      </div>
    </div>
  );
}
