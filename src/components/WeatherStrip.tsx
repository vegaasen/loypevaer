import { useWeather, type WeatherResult } from "../hooks/useWeather";
import { isForecastRange, isYrRange, getWeatherCache, getHistoricalYears } from "../lib/weather";
import { WeatherCard } from "./WeatherCard";
import type { Waypoint } from "../lib/weather";
import { calcWaypointTimes, formatArrivalTime } from "../lib/timing";
import { routeBearingForWaypoint } from "../lib/wind";
import { useEffect, useState } from "react";
import type { ClimateStoryInput } from "../lib/climateStory";

type Props = {
  waypoints: Waypoint[];
  date: string | null;
  startTime?: string | null;
  finishTime?: string | null;
  /** Optional pre-fetched results. If provided, skips the internal useWeather call. */
  externalResults?: WeatherResult[];
  /** Optional callback fired when a waypoint card is clicked. */
  onWaypointClick?: (waypoint: Waypoint, index: number) => void;
};

export function WeatherStrip({ waypoints, date, startTime, finishTime, externalResults, onWaypointClick }: Props) {
  const timingActive =
    date != null &&
    startTime != null &&
    startTime !== "" &&
    finishTime != null &&
    finishTime !== "";

  const n = waypoints.length;
  const dynamicFractions = Array.from(
    { length: n },
    (_, i) => (n === 1 ? 0 : i / (n - 1))
  );

  const datetimes = timingActive
    ? calcWaypointTimes(date, startTime, finishTime, dynamicFractions)
    : null;

  const internalResults = useWeather(externalResults ? [] : waypoints, date, datetimes);
  const results = externalResults ?? internalResults;

  const mode =
    date == null
      ? null
      : isYrRange(date)
      ? "yr-forecast"
      : isForecastRange(date)
      ? "forecast"
      : "climate-average";

  const [historicalYearsPerWaypoint, setHistoricalYearsPerWaypoint] = useState<ClimateStoryInput[]>([]);

  useEffect(() => {
    if (!date) return;
    let cancelled = false;
    getWeatherCache()
      .then((cache) => {
        if (cancelled) return;
        const all = waypoints.map((wp) =>
          getHistoricalYears(cache, wp.lat, wp.lon, date)
        );
        setHistoricalYearsPerWaypoint(all);
      })
      .catch(() => {
        if (!cancelled) setHistoricalYearsPerWaypoint([]);
      });
    return () => {
      cancelled = true;
    };
  }, [waypoints, date]);

  return (
    <div className="weather-strip">
      {date && (
        <div className="weather-strip__banner">
          {mode === "yr-forecast"
            ? "Viser værvarsel fra Yr / MET Norway (opptil 9 dager)"
            : mode === "forecast"
            ? "Viser værvarsel fra Open-Meteo (dager 10–16)"
            : "Viser klimagjennomsnitt (historiske data 2015–2024)"}
          {timingActive && " · Vær ved forventet ankomsttid"}
        </div>
      )}
      <div className="weather-strip__cards">
        {results.map(({ waypoint, data, isLoading, isError }, i) => (
          <WeatherCard
            key={`${waypoint.lat}-${waypoint.lon}`}
            waypoint={waypoint}
            data={data}
            isLoading={isLoading}
            isError={isError}
            arrivalTime={datetimes ? formatArrivalTime(datetimes[i]) : undefined}
            datetime={datetimes ? datetimes[i] : undefined}
            routeBearing={routeBearingForWaypoint(waypoints, i) ?? undefined}
            onClick={onWaypointClick ? () => onWaypointClick(waypoint, i) : undefined}
            date={date}
            historicalYears={date ? historicalYearsPerWaypoint[i] : undefined}
          />
        ))}
      </div>
    </div>
  );
}
