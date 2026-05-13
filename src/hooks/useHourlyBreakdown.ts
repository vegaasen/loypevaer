import { useQuery } from "@tanstack/react-query";
import { fetchHourlyBreakdown } from "../lib/weather";
import type { Waypoint, HourlyEntry } from "../lib/weather";

export type HourlyBreakdownResult = {
  data: HourlyEntry[] | undefined;
  isLoading: boolean;
  isError: boolean;
};

/**
 * Lazily fetches all 24 hourly weather entries for a waypoint on a given date.
 * The query is only executed when `enabled` is true (e.g. when the card is expanded).
 */
export function useHourlyBreakdown(
  waypoint: Waypoint,
  date: string | null | undefined,
  enabled: boolean
): HourlyBreakdownResult {
  const result = useQuery({
    queryKey: ["hourly-breakdown", waypoint.lat, waypoint.lon, date],
    queryFn: () => fetchHourlyBreakdown(waypoint, date!),
    enabled: enabled && !!date,
  });

  return {
    data: result.data,
    isLoading: result.isLoading,
    isError: result.isError,
  };
}
