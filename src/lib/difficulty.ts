import type { WaypointWeather } from "../hooks/useWeather";
import type { Waypoint } from "./weather";
import { windRelativeLabel, routeBearingForWaypoint } from "./wind";

type DifficultyLevel = "lett" | "moderat" | "krevende" | "hardt";

export type DifficultyResult = {
  label: string;
  level: DifficultyLevel;
};

const LEVEL_LABELS: Record<DifficultyLevel, string> = {
  lett: "Lett",
  moderat: "Moderat",
  krevende: "Krevende",
  hardt: "Hardt",
};

/**
 * Computes a unitless physical difficulty score based on distance and
 * elevation gain alone. No weather factors included.
 *
 * Thresholds: <2 Lett · 2–5 Moderat · 5–10 Krevende · >10 Hardt
 */
export function physicalScore(distanceKm: number, elevationGain: number): number {
  return distanceKm / 50 + elevationGain / 500;
}

/**
 * Returns an additive weather adjustment to the physical score based on
 * temperature, precipitation and wind conditions across all waypoints.
 */
export function weatherAdjustment(
  results: WaypointWeather[],
  waypoints: Waypoint[]
): number {
  const loaded = results.filter((r) => r.data != null);
  if (loaded.length === 0) return 0;

  let adj = 0;

  // Temperature
  const temps = loaded.map((r) => r.data!.hourlyTemp ?? r.data!.tempMin);
  const minTemp = Math.min(...temps);
  if (minTemp < 0) adj += 2;
  else if (minTemp < 5) adj += 1;
  else if (minTemp < 10) adj += 0.5;

  // Precipitation
  const precips = loaded.map(
    (r) => r.data!.hourlyPrecipitation ?? r.data!.precipitation
  );
  const maxPrecip = Math.max(...precips);
  if (maxPrecip > 2) adj += 2;
  else if (maxPrecip > 0.5) adj += 1;

  // Wind
  const windSpeeds = loaded.map(
    (r) => r.data!.hourlyWindSpeed ?? r.data!.windSpeed
  );
  const maxWind = Math.max(...windSpeeds);
  const hasHeadwind = loaded.some((r, i) => {
    const windDir = r.data!.hourlyWindDirection ?? r.data!.windDirection;
    const windSpeed = r.data!.hourlyWindSpeed ?? r.data!.windSpeed;
    if (windDir === undefined || windSpeed <= 10) return false;
    const bearing = routeBearingForWaypoint(waypoints, i);
    return bearing !== null && windRelativeLabel(windDir, bearing) === "Motvind";
  });

  if (hasHeadwind && maxWind > 20) adj += 1.5;
  else if (hasHeadwind) adj += 0.5;

  return adj;
}

/** Converts a numeric score to a labelled difficulty result. */
export function scoreToLabel(score: number): DifficultyResult {
  let level: DifficultyLevel;
  if (score < 2) level = "lett";
  else if (score < 5) level = "moderat";
  else if (score < 10) level = "krevende";
  else level = "hardt";
  return { label: LEVEL_LABELS[level], level };
}
