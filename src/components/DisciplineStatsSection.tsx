import type { Discipline } from "../lib/arrangements";
import { DISCIPLINE_LABEL_WITH_EMOJI } from "../lib/disciplines";
import type { EventWeatherStats } from "../data/weather-stats.types";
import { WeatherRankingList } from "./WeatherRankingList";
import { BestWorstYearCard } from "./BestWorstYearCard";
import { TrendBadge } from "./TrendBadge";

interface Props {
  discipline: Discipline;
  events: EventWeatherStats[];
}

/** Picks the event with the best single historical year (highest bestYear.comfortScore). */
function pickBestEvent(events: EventWeatherStats[]): EventWeatherStats | null {
  const withData = events.filter((e) => e.bestYear !== null);
  if (withData.length === 0) return null;
  return withData.reduce((a, b) =>
    b.bestYear!.comfortScore > a.bestYear!.comfortScore ? b : a
  );
}

/** Picks the event with the worst single historical year (lowest worstYear.comfortScore). */
function pickWorstEvent(events: EventWeatherStats[]): EventWeatherStats | null {
  const withData = events.filter((e) => e.worstYear !== null);
  if (withData.length === 0) return null;
  return withData.reduce((a, b) =>
    b.worstYear!.comfortScore < a.worstYear!.comfortScore ? b : a
  );
}

/** Events with a meaningful temp trend (|slope| ≥ 0.05). */
function eventsWithTrend(events: EventWeatherStats[]): EventWeatherStats[] {
  return events
    .filter((e) => e.tempTrend !== null && Math.abs(e.tempTrend) >= 0.05)
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
              {bestEvent?.bestYear && (
                <BestWorstYearCard
                  label={`Beste år — ${bestEvent.name}`}
                  year={bestEvent.bestYear}
                  variant="best"
                />
              )}
              {worstEvent?.worstYear && (
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
                    <TrendBadge slope={e.tempTrend!} />
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
