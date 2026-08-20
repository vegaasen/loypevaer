import type { BestWorstYear, EventWeatherStats } from "../data/weather-stats.types";
import type { Discipline } from "../lib/arrangements";
import { DISCIPLINE_LABEL_WITH_EMOJI } from "../lib/disciplines";
import { BestWorstYearCard } from "./BestWorstYearCard";
import { TrendBadge } from "./TrendBadge";
import { WeatherRankingList } from "./WeatherRankingList";

interface Props {
  discipline: Discipline;
  events: EventWeatherStats[];
}

type WithBestYear = EventWeatherStats & { bestYear: BestWorstYear };
type WithWorstYear = EventWeatherStats & { worstYear: BestWorstYear };

/** Picks the event with the best single historical year (highest bestYear.comfortScore). */
function pickBestEvent(events: EventWeatherStats[]): WithBestYear | null {
  const withData = events.filter((e): e is WithBestYear => e.bestYear !== null);
  if (withData.length === 0) return null;
  return withData.reduce((a, b) => (b.bestYear.comfortScore > a.bestYear.comfortScore ? b : a));
}

/** Picks the event with the worst single historical year (lowest worstYear.comfortScore). */
function pickWorstEvent(events: EventWeatherStats[]): WithWorstYear | null {
  const withData = events.filter((e): e is WithWorstYear => e.worstYear !== null);
  if (withData.length === 0) return null;
  return withData.reduce((a, b) => (b.worstYear.comfortScore < a.worstYear.comfortScore ? b : a));
}

/** Events with a meaningful temp trend (|slope| ≥ 0.05). */
function eventsWithTrend(
  events: EventWeatherStats[],
): Array<EventWeatherStats & { tempTrend: number }> {
  return events
    .filter(
      (e): e is EventWeatherStats & { tempTrend: number } =>
        e.tempTrend !== null && Math.abs(e.tempTrend) >= 0.05,
    )
    .sort((a, b) => Math.abs(b.tempTrend) - Math.abs(a.tempTrend))
    .slice(0, 3);
}

export function DisciplineStatsSection({ discipline, events }: Props) {
  const label = DISCIPLINE_LABEL_WITH_EMOJI[discipline];
  const hasAny = events.length > 0;
  const bestEvent = pickBestEvent(events);
  const worstEvent = pickWorstEvent(events);
  const trending = eventsWithTrend(events);

  return (
    <section className="stats-section">
      <h2 className="stats-section__title">{label}</h2>
      {!hasAny ? (
        <p className="stats-section__empty">Ingen arrangement i denne disiplinen.</p>
      ) : (
        <>
          <div className="stats-section__grid">
            <WeatherRankingList
              items={events}
              metric="comfortScore"
              label="Beste vær (komfort)"
              formatValue={(v) => `${v}/100`}
            />
            <WeatherRankingList
              items={events}
              metric="avgTempMax"
              label="Varmeste"
              formatValue={(v) => `${v} °C`}
            />
            <WeatherRankingList
              items={events}
              metric="avgTempMax"
              ascending
              label="Kaldeste"
              formatValue={(v) => `${v} °C`}
            />
            <WeatherRankingList
              items={events}
              metric="avgPrecipitation"
              label="Mest nedbør"
              formatValue={(v) => `${v} mm`}
            />
            <WeatherRankingList
              items={events}
              metric="avgWindSpeed"
              label="Mest vind"
              formatValue={(v) => `${v} m/s`}
            />
          </div>

          {(bestEvent ?? worstEvent) && (
            <div className="stats-section__callouts">
              {bestEvent && (
                <BestWorstYearCard
                  label={`Beste år — ${bestEvent.name}`}
                  year={bestEvent.bestYear}
                  variant="best"
                />
              )}
              {worstEvent && (
                <BestWorstYearCard
                  label={`Verste år — ${worstEvent.name}`}
                  year={worstEvent.worstYear}
                  variant="worst"
                />
              )}
            </div>
          )}

          {trending.length > 0 && (
            <div className="stats-section__trends">
              <h3 className="stats-section__trends-title">Temperaturtrend (10 år)</h3>
              <ul className="stats-section__trends-list">
                {trending.map((e) => (
                  <li key={e.id} className="stats-section__trend-item">
                    <span className="stats-section__trend-name">{e.name}</span>
                    <TrendBadge slope={e.tempTrend} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}
