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
 *
 * @param arrivalDatetime - Full ISO datetime ("YYYY-MM-DDTHH:00") for the waypoint's arrival.
 *   When provided, the fetch uses this date instead of `date` (selectedDate fallback).
 */
export function useHourlyBreakdown(
  waypoint: Waypoint,
  date: string | null | undefined,
  enabled: boolean,
  arrivalDatetime?: string | null
): HourlyBreakdownResult {
  const fetchDate = arrivalDatetime?.split("T")[0] ?? date;
  const result = useQuery({
    queryKey: ["hourly-breakdown", waypoint.lat, waypoint.lon, fetchDate],
    queryFn: () => fetchHourlyBreakdown(waypoint, fetchDate!),
    enabled: enabled && !!fetchDate,
  });

  return {
    data: result.data,
    isLoading: result.isLoading,
    isError: result.isError,
  };
}
