import type { WaypointWeather } from "../hooks/useWeather";
import type { Waypoint } from "./weather";
import { resolveWeatherValues } from "./weather";
import { routeBearingForWaypoint, windRelativeLabel } from "./wind";

const WIND_SIGNIFICANT = 3; // m/s

export function dominantWind(
  results: WaypointWeather[],
  waypoints: Waypoint[],
): "Medvind" | "Motvind" | "Sidevind" | null {
  const labels: Array<"Medvind" | "Motvind" | "Sidevind"> = [];

  results.forEach((r, i) => {
    if (!r.data) return;
    const { windDirection, windSpeed } = resolveWeatherValues(r.data);
    if (windDirection === undefined || windSpeed < WIND_SIGNIFICANT) return;
    const bearing = routeBearingForWaypoint(waypoints, i);
    if (bearing === null) return;
    labels.push(windRelativeLabel(windDirection, bearing));
  });

  if (labels.length === 0) return null;

  const counts: Record<string, number> = {};
  for (const l of labels) counts[l] = (counts[l] ?? 0) + 1;

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const [topLabel, topCount] = sorted[0];

  if (topCount / labels.length > 0.5) {
    return topLabel as "Medvind" | "Motvind" | "Sidevind";
  }
  return null;
}
