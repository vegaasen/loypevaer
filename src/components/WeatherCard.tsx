import { memo, useState } from "react";
import { useHourlyBreakdown } from "../hooks/useHourlyBreakdown";
import type { ClimateStoryInput } from "../lib/climateStory";
import type { Waypoint, WeatherData } from "../lib/weather";
import { resolveWeatherValues } from "../lib/weather";
import {
  PRECIP_HEAVY,
  PRECIP_LIGHT,
  TEMP_COLD,
  TEMP_FREEZE,
  WIND_SIGNIFICANT,
} from "../lib/weatherThresholds";
import { degreesToCompass, windRelativeLabel } from "../lib/wind";
import { describeWeatherCode } from "../lib/wmo";
import { ClimateHistoryBadge } from "./ClimateHistoryBadge";
import { HourlyBreakdown } from "./HourlyBreakdown";

type Props = {
  waypoint: Waypoint;
  data: WeatherData | undefined;
  isLoading: boolean;
  isError: boolean;
  /** Expected arrival time, e.g. "10:00". Present only in hourly/timing mode. */
  arrivalTime?: string;
  /** Route bearing at this waypoint (degrees). Used to classify head/tail/crosswind. */
  routeBearing?: number;
  /** Optional click handler, e.g. for analytics. */
  onClick?: () => void;
  /** Selected date ("YYYY-MM-DD"). Enables the hourly breakdown toggle when present. */
  date?: string | null;
  /** Historical year-entries for climate storytelling badge. */
  historicalYears?: ClimateStoryInput;
  /** Full ISO arrival datetime for this waypoint ("YYYY-MM-DDTHH:00"). Used to fetch the correct calendar day in the hourly breakdown. */
  datetime?: string | null;
  /** Approximate distance along the route (km). Shown only for intermediate waypoints. */
  approximateDistanceKm?: number;
};

/** Determines warning CSS modifier classes based on weather thresholds. */
function warningClasses(data: WeatherData, routeBearing?: number): string[] {
  const classes: string[] = [];
  const {
    temp,
    precipitation: precip,
    windSpeed,
    windDirection: windDir,
  } = resolveWeatherValues(data);

  if (temp < TEMP_FREEZE) {
    classes.push("weather-card--warn-freeze");
  } else if (temp < TEMP_COLD) {
    classes.push("weather-card--warn-cold");
  }

  if (precip > PRECIP_LIGHT) {
    classes.push("weather-card--warn-rain");
  }

  // Headwind warning: only when we know the route direction
  if (windDir !== undefined && routeBearing !== undefined && windSpeed > WIND_SIGNIFICANT) {
    const label = windRelativeLabel(windDir, routeBearing);
    if (label === "Motvind") {
      classes.push("weather-card--warn-wind");
    }
  }

  return classes;
}

/** UV index → Norwegian level label + CSS modifier */
function uvLevel(uv: number): { label: string; mod: string } {
  if (uv >= 11) return { label: "Ekstremt", mod: "extreme" };
  if (uv >= 8) return { label: "Veldig høy", mod: "very-high" };
  if (uv >= 6) return { label: "Høy", mod: "high" };
  if (uv >= 3) return { label: "Moderat", mod: "moderate" };
  return { label: "Lav", mod: "low" };
}

/** Wet road / ice risk based on temperature and precipitation */
function roadRisk(data: WeatherData): "ice" | "slush" | "wet" | null {
  const { temp, precipitation: precip } = resolveWeatherValues(data);
  if (precip <= 0) return null;
  if (temp < TEMP_FREEZE) return "ice";
  if (temp < 3 && precip > PRECIP_LIGHT) return "slush";
  if (temp >= 3 && precip > PRECIP_HEAVY) return "wet";
  return null;
}

const ROAD_RISK_LABELS: Record<"ice" | "slush" | "wet", { icon: string; label: string }> = {
  ice: { icon: "❄️", label: "Isfare" },
  slush: { icon: "⚠️", label: "Glatt vei" },
  wet: { icon: "💧", label: "Fuktig vei" },
};

/** Renders the loaded weather data content inside a WeatherCard. */
function WeatherCardContent({
  data,
  routeBearing,
  hasDate,
  timingActive,
}: {
  data: WeatherData;
  routeBearing?: number;
  hasDate: boolean;
  timingActive: boolean;
}) {
  const { label: wLabel, emoji } = describeWeatherCode(data.weatherCode);

  // Effective wind direction and speed for display
  const { windSpeed, windDirection: windDir } = resolveWeatherValues(data);

  // Wind direction label
  let windDirLabel: string | null = null;
  if (windDir !== undefined) {
    windDirLabel =
      routeBearing !== undefined
        ? windRelativeLabel(windDir, routeBearing)
        : degreesToCompass(windDir);
  }

  // Feels-like temperature for display
  const feelsLike =
    data.hourlyFeelsLike ?? (data.feelsLikeMax != null ? data.feelsLikeMax : undefined);

  const showHourly = data.hourlyTemp != null;

  // Temperature trend — only show when difference is ≥ 0.5°
  const trend = data.tempTrend != null && Math.abs(data.tempTrend) >= 0.5 ? data.tempTrend : null;

  // UV index — only show when UV is notable (≥ 3)
  const showUv = data.uvIndex != null && data.uvIndex >= 3;

  // Road risk
  const risk = roadRisk(data);

  // Wind: hide entirely when no date is selected. Show "(snitt)" label when it
  // is a daytime average (no timing set) rather than an exact arrival-hour value.
  const showWind = hasDate;
  // Suppress "snitt" when timing is active (hourlyWindSpeed set) OR when an
  // arrival time was computed (timingActive) — the latter covers the edge case
  // where the data is still loading/stale but timing is clearly engaged.
  const windIsAvg =
    data.windSpeedIsAverage === true && data.hourlyWindSpeed == null && !timingActive;

  return (
    <>
      {data.source === "climate-average" && <span className="weather-card__badge">Klimasnitt</span>}
      <div className="weather-card__icon">{emoji}</div>
      <div className="weather-card__description">{wLabel}</div>
      <div className="weather-card__temps">
        {showHourly ? (
          <span className="weather-card__temp-hourly">{data.hourlyTemp}°</span>
        ) : (
          <>
            <span className="weather-card__temp-max">{data.tempMax}°</span>
            {" / "}
            <span className="weather-card__temp-min">{data.tempMin}°</span>
          </>
        )}
        {trend !== null && (
          <span
            className={`weather-card__trend weather-card__trend--${trend > 0 ? "up" : "down"}`}
            title={`${trend > 0 ? "Varmere" : "Kaldere"} enn i går (${trend > 0 ? "+" : ""}${trend}°)`}
          >
            {trend > 0 ? "↑" : "↓"}
            {trend > 0 ? "+" : ""}
            {trend}°
          </span>
        )}
      </div>
      {feelsLike != null && <div className="weather-card__feels-like">Føles som {feelsLike}°</div>}
      <div className="weather-card__detail">
        <span title="Nedbør">
          🌧 {data.hourlyPrecipitation ?? data.precipitation} mm
          {data.precipitationProbability != null && (
            <span className="weather-card__precip-prob"> · {data.precipitationProbability}%</span>
          )}
        </span>
      </div>
      {risk && (
        <div className="weather-card__detail">
          <span className={`weather-card__road-risk weather-card__road-risk--${risk}`}>
            {ROAD_RISK_LABELS[risk].icon} {ROAD_RISK_LABELS[risk].label}
          </span>
        </div>
      )}
      {showWind && (
        <div className="weather-card__detail">
          <span title={windIsAvg ? "Gjennomsnittlig vind 06:00–18:00" : "Vind"}>
            💨 {windSpeed} km/t
            {windDir !== undefined && (
              <span
                className="weather-card__wind-arrow"
                style={{ transform: `rotate(${windDir}deg)` }}
                aria-hidden="true"
              >
                ↑
              </span>
            )}
            {windDirLabel && <span className="weather-card__wind-dir"> · {windDirLabel}</span>}
            {windIsAvg && (
              <span className="weather-card__wind-avg" title="Gjennomsnitt 06:00–18:00">
                {" "}
                · snitt
              </span>
            )}
          </span>
        </div>
      )}
      {showUv && (
        <div className="weather-card__detail">
          <span className={`weather-card__uv weather-card__uv--${uvLevel(data.uvIndex!).mod}`}>
            ☀️ UV {data.uvIndex} · {uvLevel(data.uvIndex!).label}
          </span>
        </div>
      )}
    </>
  );
}

export const WeatherCard = memo(function WeatherCard({
  waypoint,
  data,
  isLoading,
  isError,
  arrivalTime,
  routeBearing,
  onClick,
  date,
  historicalYears,
  datetime,
  approximateDistanceKm,
}: Props) {
  const { label } = waypoint;
  const [expanded, setExpanded] = useState(false);

  // Parse the arrival hour from the full ISO datetime (preferred) or the display-only arrivalTime string
  const arrivalHour: number | undefined = datetime
    ? parseInt(datetime.split("T")[1]?.split(":")[0] ?? "", 10)
    : arrivalTime
      ? parseInt(arrivalTime.split(":")[0], 10)
      : undefined;

  const {
    data: hourlyEntries,
    isLoading: hourlyLoading,
    isError: hourlyError,
  } = useHourlyBreakdown(waypoint, date, expanded, datetime);

  const extraClasses =
    data && !isLoading && !isError ? warningClasses(data, routeBearing).join(" ") : "";

  return (
    <div
      className={`weather-card${extraClasses ? ` ${extraClasses}` : ""}`}
      onClick={onClick}
      style={onClick ? { cursor: "pointer" } : undefined}
    >
      <div className="weather-card__label">
        {approximateDistanceKm != null && (
          <span className="weather-card__distance">~{Math.round(approximateDistanceKm)} km · </span>
        )}
        {label}
      </div>
      {waypoint.altitude != null && (
        <div className="weather-card__altitude">{waypoint.altitude} m o.h.</div>
      )}

      {arrivalTime && (
        <div
          className="weather-card__arrival"
          title={
            data?.hourlyIsApproximate
              ? "Yr-data ikke tilgjengelig for nøyaktig tidspunkt — viser interpolert/nærmeste verdi"
              : undefined
          }
        >
          {data?.hourlyIsApproximate ? "≈" : "~"}
          {arrivalTime}
        </div>
      )}

      {isLoading && (
        <div className="weather-card__skeleton" aria-hidden="true">
          <div className="weather-card__skeleton-icon" />
          <div className="weather-card__skeleton-line weather-card__skeleton-line--wide" />
          <div className="weather-card__skeleton-line weather-card__skeleton-line--medium" />
          <div className="weather-card__skeleton-line weather-card__skeleton-line--narrow" />
        </div>
      )}

      {isError && <div className="weather-card__error">Kunne ikke hente vær</div>}

      {data && (
        <WeatherCardContent
          data={data}
          routeBearing={routeBearing}
          hasDate={!!date}
          timingActive={!!arrivalTime}
        />
      )}

      {historicalYears && historicalYears.length > 0 && (
        <>
          <hr className="weather-card__climate-divider" />
          <ClimateHistoryBadge years={historicalYears} />
        </>
      )}

      {!isLoading && !isError && !data && (
        <div className="weather-card__placeholder">Velg dato for å se vær</div>
      )}

      {data && date && (
        <button
          className="weather-card__hourly-toggle"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          aria-expanded={expanded}
        >
          {expanded ? "▴ Skjul time for time" : "▾ Time for time"}
        </button>
      )}

      {expanded && data && date && (
        <div className="weather-card__hourly-panel">
          {hourlyLoading && <div className="weather-card__hourly-loading">Laster...</div>}
          {hourlyError && (
            <div className="weather-card__hourly-error">Kunne ikke hente timedata</div>
          )}
          {hourlyEntries && <HourlyBreakdown entries={hourlyEntries} highlightHour={arrivalHour} />}
        </div>
      )}
    </div>
  );
});
