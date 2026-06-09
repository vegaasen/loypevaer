import type { WaypointWeather } from "../hooks/useWeather";
import { windRelativeLabel, routeBearingForWaypoint } from "../lib/wind";
import type { Waypoint } from "../lib/weather";
import { resolveWeatherValues } from "../lib/weather";
import {
  TEMP_FREEZE,
  TEMP_VERY_COLD,
  TEMP_COLD,
  PRECIP_LIGHT,
  PRECIP_HEAVY,
  WIND_SIGNIFICANT,
  WIND_STRONG,
} from "../lib/weatherThresholds";
import { buildPackingList } from "../lib/packingList";
import { PackingList } from "./PackingList";

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
  const maxTemp = Math.max(...temps);

  const precipValues = loaded.map((r) => resolveWeatherValues(r.data!).precipitation);
  const maxPrecip = Math.max(...precipValues);

  const windSpeeds = loaded.map((r) => resolveWeatherValues(r.data!).windSpeed);

  // Check for headwind at any waypoint
  const hasSignificantHeadwind = loaded.some((r, i) => {
    const { windDirection: windDir, windSpeed } = resolveWeatherValues(r.data!);
    if (windDir === undefined || windSpeed <= WIND_SIGNIFICANT) return false;
    const bearing = routeBearingForWaypoint(waypoints, i);
    if (bearing === null) return false;
    return windRelativeLabel(windDir, bearing) === "Motvind";
  });

  const maxWindSpeed = Math.max(...windSpeeds);

  // --- Range advisory ---
  const tempRange = maxTemp - minTemp;
  if (tempRange > 6) {
    suggestions.push({
      key: "temp-range",
      icon: "🌡",
      text: `Temperaturen varierer fra ${Math.round(minTemp)}°C til ${Math.round(maxTemp)}°C langs løypa — kle deg for starten og planlegg å lettkle deg underveis`,
      severity: "warn",
    });
  }

  // --- Wind direction change advisory ---
  const windLabels = loaded.map((r, i) => {
    const { windDirection, windSpeed } = resolveWeatherValues(r.data!);
    if (windDirection === undefined || windSpeed <= WIND_SIGNIFICANT) return null;
    const bearing = routeBearingForWaypoint(waypoints, i);
    if (bearing === null) return null;
    return windRelativeLabel(windDirection, bearing);
  });
  const hasHeadwind = windLabels.some((l) => l === "Motvind");
  const hasTailwind = windLabels.some((l) => l === "Medvind");
  if (hasHeadwind && hasTailwind) {
    const headwindIdx = windLabels.findIndex((l) => l === "Motvind");
    const headwindLabel = waypoints[headwindIdx]?.label ?? "en del av løypa";
    suggestions.push({
      key: "wind-direction-change",
      icon: "💨",
      text: `Vindretningen endrer seg langs løypa — motvind ved ${headwindLabel}, medvind mot slutten`,
      severity: "info",
    });
  }

  // --- Temperature rules ---
  if (minTemp < TEMP_FREEZE) {
    suggestions.push({
      key: "freeze",
      icon: "🧊",
      text: "Under 0 °C: vinterhansker, balaklava og varmende lag anbefalt",
      severity: "danger",
    });
  } else if (minTemp < TEMP_VERY_COLD) {
    suggestions.push({
      key: "very-cold",
      icon: "🥶",
      text: "Under 5 °C: votter, hette og ekstra lag",
      severity: "danger",
    });
  } else if (minTemp < TEMP_COLD) {
    suggestions.push({
      key: "cold",
      icon: "🧊",
      text: "Under 10 °C: armbeskyttelse og langfingrede hansker anbefalt",
      severity: "warn",
    });
  }

  // --- Rain rules ---
  if (maxPrecip > PRECIP_HEAVY) {
    suggestions.push({
      key: "heavy-rain",
      icon: "🌧",
      text: "Mye nedbør: regnjakke og regnbukse anbefalt",
      severity: "danger",
    });
  } else if (maxPrecip > PRECIP_LIGHT) {
    suggestions.push({
      key: "light-rain",
      icon: "🌦",
      text: "Lett nedbør: regnjakke anbefalt",
      severity: "warn",
    });
  }

  // --- Wind rules ---
  if (hasSignificantHeadwind && maxWindSpeed > WIND_STRONG) {
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
  } else if (maxWindSpeed > WIND_STRONG) {
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
  discipline?: string;
};

export function GearSuggestion({ results, waypoints, discipline = "landevei" }: Props) {
  const hasAnyData = results.some((r) => r.data != null);
  const isLoading = results.some((r) => r.isLoading);

  if (isLoading || !hasAnyData) return null;

  const suggestions = buildSuggestions(results, waypoints);
  if (suggestions.length === 0) return null;

  const packingItems = buildPackingList(results, discipline);

  return (
    <details className="gear-suggestion__details">
      <summary className="gear-suggestion__summary">
        Utstyrstips
      </summary>
      <div className="gear-suggestion__body">
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
          <PackingList items={packingItems} />
        </div>
      </div>
    </details>
  );
}
