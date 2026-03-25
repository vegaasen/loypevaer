import { useQuery } from "@tanstack/react-query";
import { fetchWeather, isForecastRange } from "../lib/weather";
import type { Waypoint, WeatherData } from "../lib/weather";

export type WaypointWeather = {
  waypoint: Waypoint;
  data: WeatherData | undefined;
  isLoading: boolean;
  isError: boolean;
};

export function useWeather(
  waypoints: Waypoint[],
  date: string | null
): WaypointWeather[] {
  // Run one query per waypoint. All disabled when no date is selected.
  const queries = waypoints.map((wp) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useQuery<WeatherData>({
      queryKey: ["weather", wp.lat, wp.lon, date],
      queryFn: () => fetchWeather(wp, date!),
      enabled: !!date,
      staleTime: 1000 * 60 * 10, // 10 minutes
      retry: 2,
    })
  );

  return waypoints.map((wp, i) => ({
    waypoint: wp,
    data: queries[i].data,
    isLoading: queries[i].isLoading,
    isError: queries[i].isError,
  }));
}

export { isForecastRange };
