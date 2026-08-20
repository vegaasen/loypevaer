import { Link } from "react-router-dom";
import type { EventWeatherStats } from "../data/weather-stats.types";

type MetricKey = "comfortScore" | "avgTempMax" | "avgPrecipitation" | "avgWindSpeed";

interface Props {
  items: EventWeatherStats[];
  metric: MetricKey;
  ascending?: boolean;
  limit?: number;
  label: string;
  formatValue: (val: number) => string;
  emptyMetricLabel?: string;
}

export function WeatherRankingList({
  items,
  metric,
  ascending = false,
  limit = 5,
  label,
  formatValue,
  emptyMetricLabel = "Ikke nok data",
}: Props) {
  const withData = items.filter((e) => e[metric] !== null && e.dataYears > 0);
  const withoutData = items.filter((e) => e[metric] === null || e.dataYears === 0);

  const sorted = [...withData].sort((a, b) => {
    const av = a[metric] as number;
    const bv = b[metric] as number;
    return ascending ? av - bv : bv - av;
  });

  const displayed = sorted.slice(0, limit);

  return (
    <div className="weather-ranking">
      <h4 className="weather-ranking__label">{label}</h4>
      <ol className="weather-ranking__list">
        {displayed.map((event, i) => (
          <li key={event.id} className="weather-ranking__item">
            <span className="weather-ranking__rank">#{i + 1}</span>
            <span className="weather-ranking__name">
              <Link to={`/arrangement/${event.id}`}>{event.name}</Link>
              <span className="weather-ranking__region">{event.region}</span>
            </span>
            <span className="weather-ranking__value">
              {formatValue(event[metric] as number)}
              <span className="weather-ranking__years" title={`Basert på ${event.dataYears} år med data`}>
                ({event.dataYears} år)
              </span>
            </span>
          </li>
        ))}
        {displayed.length === 0 && withoutData.length > 0 && (
          <li className="weather-ranking__item weather-ranking__item--no-data">
            <span className="weather-ranking__no-data">{emptyMetricLabel}</span>
          </li>
        )}
      </ol>
    </div>
  );
}
