import { useWeather, isForecastRange } from "../hooks/useWeather";
import { WeatherCard } from "./WeatherCard";
import type { Waypoint } from "../lib/weather";

type Props = {
  waypoints: Waypoint[];
  date: string | null;
};

export function WeatherStrip({ waypoints, date }: Props) {
  const results = useWeather(waypoints, date);

  const mode =
    date == null
      ? null
      : isForecastRange(date)
      ? "forecast"
      : "climate-average";

  return (
    <div className="weather-strip">
      {date && (
        <div className="weather-strip__banner">
          {mode === "forecast"
            ? "Viser værvarsel fra Open-Meteo (opptil 16 dager)"
            : "Viser klimagjennomsnitt (historiske data 2015–2024)"}
        </div>
      )}
      <div className="weather-strip__cards">
        {results.map(({ waypoint, data, isLoading, isError }) => (
          <WeatherCard
            key={`${waypoint.lat}-${waypoint.lon}`}
            waypoint={waypoint}
            data={data}
            isLoading={isLoading}
            isError={isError}
          />
        ))}
      </div>
    </div>
  );
}
