import { useEffect, useState } from "react";
import { useWeather, type WeatherResult } from "../hooks/useWeather";
import type { ClimateStoryInput } from "../lib/climateStory";
import { dominantWind } from "../lib/dominantWind";
import { calcWaypointTimes, formatArrivalTime } from "../lib/timing";
import type { Waypoint } from "../lib/weather";
import { getHistoricalYears, getWeatherCache, isForecastRange, isYrRange } from "../lib/weather";
import { routeBearingForWaypoint } from "../lib/wind";
import { WeatherCard } from "./WeatherCard";

type Props = {
  waypoints: Waypoint[];
  date: string | null;
  startTime?: string | null;
  finishTime?: string | null;
  /** Optional pre-fetched results. If provided, skips the internal useWeather call. */
  externalResults?: WeatherResult[];
  /** Optional callback fired when a waypoint card is clicked. */
  onWaypointClick?: (waypoint: Waypoint, index: number) => void;
  /** Optional callback fired when all waypoints are loaded, with the dominant wind direction. */
  onWindSummary?: (summary: "Medvind" | "Motvind" | "Sidevind" | null) => void;
};

export function WeatherStrip({
  waypoints,
  date,
  startTime,
  finishTime,
  externalResults,
  onWaypointClick,
  onWindSummary,
}: Props) {
  const timingActive =
    date != null &&
    startTime != null &&
    startTime !== "" &&
    finishTime != null &&
    finishTime !== "";

  const n = waypoints.length;
  const dynamicFractions = Array.from({ length: n }, (_, i) => (n === 1 ? 0 : i / (n - 1)));

  const datetimes = timingActive
    ? calcWaypointTimes(date, startTime, finishTime, dynamicFractions)
    : null;

  const internalResults = useWeather(externalResults ? [] : waypoints, date, datetimes);
  const results = externalResults ?? internalResults;

  useEffect(() => {
    if (!onWindSummary) return;
    const allLoaded = results.every((r) => !r.isLoading);
    if (!allLoaded) return;
    onWindSummary(dominantWind(results, waypoints));
  }, [results, waypoints, onWindSummary]);

  const mode =
    date == null
      ? null
      : isYrRange(date)
        ? "yr-forecast"
        : isForecastRange(date)
          ? "forecast"
          : "climate-average";

  const [historicalYearsPerWaypoint, setHistoricalYearsPerWaypoint] = useState<ClimateStoryInput[]>(
    [],
  );

  useEffect(() => {
    if (!date) return;
    let cancelled = false;
    getWeatherCache()
      .then((cache) => {
        if (cancelled) return;
        const all = waypoints.map((wp) => getHistoricalYears(cache, wp.lat, wp.lon, date));
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
      <div className="weather-strip__footer">
        <span className="weather-strip__swipe-hint">← Sveip for å se alle punkter →</span>
        {date && (
          <span className="weather-strip__banner">
            <i>
              {mode === "yr-forecast"
                ? "Viser værvarsel fra Yr / MET Norway (opptil 9 dager)"
                : mode === "forecast"
                  ? "Viser værvarsel fra Open-Meteo (dager 10–16)"
                  : "Viser klimagjennomsnitt (historiske data 2015–2024)"}
              {timingActive && " · Vær ved forventet ankomsttid"}
            </i>
          </span>
        )}
      </div>
    </div>
  );
}
