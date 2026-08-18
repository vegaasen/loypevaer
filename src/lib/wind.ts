import type { Waypoint } from "./weather";

/**
 * Computes the initial bearing (azimuth) in degrees from `from` to `to`.
 * Uses the haversine formula. Returns 0–360°.
 */
export function bearingBetween(from: Waypoint, to: Waypoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const dLon = toRad(to.lon - from.lon);

  const x = Math.sin(dLon) * Math.cos(lat2);
  const y = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  const bearing = (Math.atan2(x, y) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

/**
 * Returns the approximate route bearing for a waypoint at `index` within
 * the ordered `waypoints` array. Uses the bearing toward the next point
 * (or from the previous point for the last waypoint).
 *
 * Returns null if fewer than 2 waypoints are provided.
 */
export function routeBearingForWaypoint(waypoints: Waypoint[], index: number): number | null {
  if (waypoints.length < 2) return null;
  if (index < waypoints.length - 1) {
    return bearingBetween(waypoints[index], waypoints[index + 1]);
  }
  // Last waypoint — use bearing from the previous point (same direction of travel)
  return bearingBetween(waypoints[index - 1], waypoints[index]);
}

/**
 * Classifies wind relative to the direction of travel.
 *
 * @param windDeg      Meteorological wind direction (degrees the wind is coming FROM).
 * @param routeBearing Direction of travel (degrees, 0–360).
 * @returns "Medvind" | "Motvind" | "Sidevind"
 *
 * The wind vector points in the direction `windDeg + 180` (i.e. where the wind
 * is blowing TO). We compute the angle between that vector and the route bearing.
 * ≤45° = tailwind, >135° = headwind, otherwise crosswind.
 */
export function windRelativeLabel(
  windDeg: number,
  routeBearing: number,
): "Medvind" | "Motvind" | "Sidevind" {
  const windTo = (windDeg + 180) % 360;
  let diff = Math.abs(windTo - routeBearing) % 360;
  if (diff > 180) diff = 360 - diff;

  if (diff <= 45) return "Medvind";
  if (diff >= 135) return "Motvind";
  return "Sidevind";
}

/**
 * Converts wind degrees to an 8-point compass label (N, NE, E, …).
 * Used as a fallback when route bearing is unknown.
 */
export function degreesToCompass(deg: number): string {
  if (!Number.isFinite(deg)) return "?";
  const dirs = ["N", "NØ", "Ø", "SØ", "S", "SV", "V", "NV"];
  return dirs[Math.round(deg / 45) % 8];
}
