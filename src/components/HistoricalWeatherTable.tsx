import { useState, useEffect, useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { fetchWeather, getWeatherCache } from "../lib/weather";
import { describeWeatherCode } from "../lib/wmo";
import { avg, mode } from "../lib/stats";
import type { Waypoint, WeatherData } from "../lib/weather";
import { useDetailsOpen } from "../hooks/useDetailsOpen";

type Props = {
  waypoints: Waypoint[];
  /** The ritt's official date (YYYY-MM-DD). We use only the MM-DD part. */
  officialDate: string;
};

const HISTORY_YEARS = Array.from({ length: 10 }, (_, i) => 2015 + i); // 2015–2024

export function HistoricalWeatherTable({ waypoints, officialDate }: Props) {
  const { detailsRef, isOpen } = useDetailsOpen();
  const [historicalByYear, setHistoricalByYear] = useState<Record<string, WeatherData> | null>(null);

  // Load the weather cache eagerly on mount so it is ready before the
  // details panel is opened. This prevents all 50 queries from firing live
  // on first open while the cache JSON is still being parsed.
  useEffect(() => {
    if (historicalByYear === null) {
      void getWeatherCache().then((cache) => {
        setHistoricalByYear(cache.historicalByYear);
      });
    }
  }, [historicalByYear]);

  const [, mm, dd] = officialDate.split("-");

  // One query per (year × waypoint) = 10 × 5 = 50 queries max.
  // Flat array: year 0 wp 0, year 0 wp 1, ..., year 1 wp 0, ...
  // Cache key for historicalByYear: "lat,lon,MM,DD,YYYY"
  const queryDefs = useMemo(
    () =>
      HISTORY_YEARS.flatMap((year) =>
        waypoints.map((wp) => {
          const date = `${year}-${mm}-${dd}`;
          const cacheKey = `${wp.lat},${wp.lon},${mm},${dd},${year}`;
          const cachedData = historicalByYear?.[cacheKey];
          return {
            queryKey: ["weather-history", wp.lat, wp.lon, date] as const,
            queryFn: () => fetchWeather(wp, date),
            staleTime: Infinity,
            retry: 1,
            enabled: isOpen && !cachedData,
            initialData: cachedData,
          };
        })
      ),
    [waypoints, mm, dd, isOpen, historicalByYear]
  );

  const results = useQueries({ queries: queryDefs });

  // Re-shape results into rows keyed by year
  const rows = HISTORY_YEARS.map((year, yi) => {
    const wpResults = waypoints.map((_, wi) => results[yi * waypoints.length + wi]);
    const allLoading = wpResults.some((r) => r.isLoading);
    const allError = wpResults.every((r) => r.isError);
    const anyError = !allError && wpResults.some((r) => r.isError);
    const datas = wpResults.map((r) => r.data);

    return {
      year,
      isLoading: allLoading,
      isError: allError,
      isPartialError: anyError,
      tempMax: avg(datas.map((d) => d?.tempMax)),
      tempMin: avg(datas.map((d) => d?.tempMin)),
      precipitation: avg(datas.map((d) => d?.precipitation)),
      windSpeed: avg(datas.map((d) => d?.windSpeed)),
      weatherCode: mode(datas.map((d) => d?.weatherCode).filter((c): c is number => c != null)),
    };
  });

  return (
    <details ref={detailsRef} className="history-table__details">
      <summary className="history-table__summary">
        Historisk vær på startdagen (2015–2024)
      </summary>
      <div className="history-table__wrapper">
        <table className="history-table">
          <thead>
            <tr>
              <th>År</th>
              <th title="Gjennomsnittlig maks-temperatur">Maks °C</th>
              <th title="Gjennomsnittlig min-temperatur">Min °C</th>
              <th title="Gjennomsnittlig nedbør">Nedbør mm</th>
              <th title="Maks vindhastighet">Vind km/t</th>
              <th>Vær</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.year} className={row.isLoading ? "history-table__row--loading" : ""}>
                <td className="history-table__year">{row.year}</td>
                {row.isLoading ? (
                  <td colSpan={5} className="history-table__status">Laster…</td>
                ) : row.isError ? (
                  <td colSpan={5} className="history-table__status history-table__status--error">Ikke tilgjengelig</td>
                ) : (
                  <>
                    <td>{row.tempMax != null ? `${Math.round(row.tempMax * 10) / 10}°` : "–"}</td>
                    <td>{row.tempMin != null ? `${Math.round(row.tempMin * 10) / 10}°` : "–"}</td>
                    <td>{row.precipitation != null ? `${Math.round(row.precipitation * 10) / 10}` : "–"}</td>
                    <td>{row.windSpeed != null ? `${Math.round(row.windSpeed * 10) / 10}` : "–"}</td>
                    <td className="history-table__icon">
                      {row.weatherCode != null ? describeWeatherCode(row.weatherCode).emoji : "–"}
                      {row.isPartialError && (
                        <span className="history-table__partial-error" title="Data mangler for noen målepunkter">⚠</span>
                      )}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="history-table__note">
          Gjennomsnitt av alle målepunkter langs ruten for den aktuelle datoen hvert år.
        </p>
      </div>
    </details>
  );
}
