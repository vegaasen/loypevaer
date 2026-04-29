import type { WaypointWeather } from "../hooks/useWeather";
import { windRelativeLabel, routeBearingForWaypoint } from "../lib/wind";
import type { Waypoint } from "../lib/weather";
import { resolveWeatherValues } from "../lib/weather";

type Suggestion = {
  key: string;
  icon: string;
  text: string;
  severity: "info" | "warn" | "danger";
};

function buildSuggestions(
  results: WaypointWeather[],
  waypoints: Waypoint[]
): Suggestion[] {
  const loaded = results.filter((r) => r.data != null);
  if (loaded.length === 0) return [];

  const suggestions: Suggestion[] = [];

  const temps = loaded.map((r) => resolveWeatherValues(r.data!).temp);
  const minTemp = Math.min(...temps);

  const precipValues = loaded.map((r) => resolveWeatherValues(r.data!).precipitation);
  const maxPrecip = Math.max(...precipValues);

  const windSpeeds = loaded.map((r) => resolveWeatherValues(r.data!).windSpeed);

  // Check for headwind at any waypoint
  const hasSignificantHeadwind = loaded.some((r, i) => {
    const { windDirection: windDir, windSpeed } = resolveWeatherValues(r.data!);
    if (windDir === undefined || windSpeed <= 10) return false;
    const bearing = routeBearingForWaypoint(waypoints, i);
    if (bearing === null) return false;
    return windRelativeLabel(windDir, bearing) === "Motvind";
  });

  const maxWindSpeed = Math.max(...windSpeeds);

  // --- Temperature rules ---
  if (minTemp < 0) {
    suggestions.push({
      key: "freeze",
      icon: "🧊",
      text: "Under 0 °C: vinterhansker, balaklava og varmende lag anbefalt",
      severity: "danger",
    });
  } else if (minTemp < 5) {
    suggestions.push({
      key: "very-cold",
      icon: "🥶",
      text: "Under 5 °C: votter, hette og ekstra lag",
      severity: "danger",
    });
  } else if (minTemp < 10) {
    suggestions.push({
      key: "cold",
      icon: "🧊",
      text: "Under 10 °C: armbeskyttelse og langfingrede hansker anbefalt",
      severity: "warn",
    });
  }

  // --- Rain rules ---
  if (maxPrecip > 2) {
    suggestions.push({
      key: "heavy-rain",
      icon: "🌧",
      text: "Mye nedbør: regnjakke og regnbukse anbefalt",
      severity: "danger",
    });
  } else if (maxPrecip > 0.5) {
    suggestions.push({
      key: "light-rain",
      icon: "🌦",
      text: "Lett nedbør: regnjakke anbefalt",
      severity: "warn",
    });
  }

  // --- Wind rules ---
  if (hasSignificantHeadwind && maxWindSpeed > 20) {
    suggestions.push({
      key: "headwind-strong",
      icon: "💨",
      text: "Sterk motvind: vindtett plagg og juster forventet fart",
      severity: "danger",
    });
  } else if (hasSignificantHeadwind) {
    suggestions.push({
      key: "headwind",
      icon: "💨",
      text: "Motvind underveis: vindtett plagg anbefalt",
      severity: "warn",
    });
  } else if (maxWindSpeed > 20) {
    suggestions.push({
      key: "strong-wind",
      icon: "💨",
      text: "Sterk vind: vindtett plagg anbefalt",
      severity: "warn",
    });
  }

  // --- All-clear ---
  if (suggestions.length === 0) {
    suggestions.push({
      key: "ok",
      icon: "✅",
      text: "Gode forhold — standardutstyr holder",
      severity: "info",
    });
  }

  return suggestions;
}

type Props = {
  results: WaypointWeather[];
  waypoints: Waypoint[];
};

export function GearSuggestion({ results, waypoints }: Props) {
  const hasAnyData = results.some((r) => r.data != null);
  const isLoading = results.some((r) => r.isLoading);

  if (isLoading || !hasAnyData) return null;

  const suggestions = buildSuggestions(results, waypoints);
  if (suggestions.length === 0) return null;

  return (
    <div className="gear-suggestion">
      <div className="gear-suggestion__heading">Bekledningsråd</div>
      <ul className="gear-suggestion__list">
        {suggestions.map((s) => (
          <li
            key={s.key}
            className={`gear-suggestion__item gear-suggestion__item--${s.severity}`}
          >
            <span className="gear-suggestion__icon">{s.icon}</span>
            <span>{s.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
