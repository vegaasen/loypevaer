import type { Waypoint, WeatherData } from "./weather";

export type WeatherResult = {
  waypoint: Waypoint;
  data: WeatherData | null;
  loading: boolean;
  error: unknown;
};

/**
 * Builds a short weather summary for og:description.
 * Returns null if no weather data is available yet.
 * Example: "Start: 12°C, lett bris · Toppen: 8°C, stiv kuling · Mål: 14°C, svak vind"
 */
export function buildOgDescription(
  waypoints: Waypoint[],
  weatherResults: WeatherResult[]
): string | null {
  const parts: string[] = [];

  for (const result of weatherResults) {
    if (!result.data) continue;
    const temp = Math.round(result.data.hourlyTemp ?? result.data.tempMax);
    const wind = windLabel(result.data.hourlyWindSpeed ?? result.data.windSpeed);
    parts.push(`${result.waypoint.label}: ${temp}°C, ${wind}`);
  }

  if (parts.length === 0) return null;
  return parts.join(" · ");
}

function windLabel(ms: number): string {
  if (ms < 0.3) return "stille";
  if (ms < 1.6) return "flau vind";
  if (ms < 3.4) return "svak vind";
  if (ms < 5.5) return "lett bris";
  if (ms < 8.0) return "laber bris";
  if (ms < 10.8) return "frisk bris";
  if (ms < 13.9) return "liten kuling";
  if (ms < 17.2) return "stiv kuling";
  if (ms < 20.8) return "sterk kuling";
  if (ms < 24.5) return "liten storm";
  if (ms < 28.5) return "full storm";
  return "orkan";
}

/**
 * Returns the path to the static og:image for a discipline.
 * baseUrl should be import.meta.env.BASE_URL (no trailing slash needed).
 */
export function getOgImagePath(discipline: string, baseUrl: string): string {
  const base = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const file = disciplineToOgFile(discipline);
  return `${base}/og/${file}`;
}

function disciplineToOgFile(discipline: string): string {
  switch (discipline) {
    case "landevei":
    case "terreng":
    case "cx":
    case "gravel":
      return "sykkel.jpg";
    case "langrenn":
      return "langrenn.jpg";
    case "triathlon":
      return "triathlon.jpg";
    case "løping":
    case "ultraløp":
      return "lop.jpg";
    default:
      return "default.jpg";
  }
}
