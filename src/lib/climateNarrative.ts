// src/lib/climateNarrative.ts
import type { RittEntry } from "./arrangements";
import type { WeatherData } from "./weather";
import { getClimateStoryLabel, type ClimateStoryInput } from "./climateStory";

type WeatherCacheShape = {
  climateAverages: Record<string, WeatherData>;
  historicalByYear: Record<string, WeatherData>;
};

/**
 * Builds a 1–2 sentence Norwegian climate summary for an event, derived
 * from the pre-fetched weather-cache.json data.
 *
 * Returns null if the cache has no data for the first waypoint.
 */
export function buildClimateNarrative(
  event: RittEntry,
  cache: WeatherCacheShape
): string | null {
  if (event.waypoints.length === 0) return null;

  const first = event.waypoints[0];
  const [, mm, dd] = event.officialDate.split("-");
  const cacheKey = `${first.lat},${first.lon},${mm},${dd}`;
  const avg = cache.climateAverages[cacheKey];

  if (!avg) return null;

  const temp = Math.round(avg.tempMax);
  const waypointLabel = first.label;

  // Collect historical years for this waypoint
  const endYear = new Date().getFullYear() - 1;
  const startYear = endYear - 9;
  const years: ClimateStoryInput = [];
  for (let y = startYear; y <= endYear; y++) {
    const key = `${first.lat},${first.lon},${mm},${dd},${y}`;
    const entry = cache.historicalByYear[key];
    if (entry) {
      years.push({
        precipitation: entry.precipitation,
        windSpeed: entry.windSpeed,
        tempMax: entry.tempMax,
      });
    }
  }

  const storyLabel = years.length > 0 ? getClimateStoryLabel(years) : null;

  // Build sentence 1: temperature at start waypoint
  const monthNum = parseInt(mm, 10);
  const monthNames = [
    "januar", "februar", "mars", "april", "mai", "juni",
    "juli", "august", "september", "oktober", "november", "desember",
  ];
  const monthName = monthNames[monthNum - 1] ?? "";

  let narrative = `Historisk sett er det typisk ${temp}°C ved ${waypointLabel} i ${monthName}`;

  if (storyLabel && storyLabel !== "Variert vær") {
    narrative += ` — ${storyLabel.toLowerCase()} forekommer i flertallet av år`;
  }

  narrative += ".";

  return narrative;
}
