import type { WeatherData } from "../lib/weather";
import { describeWeatherCode } from "../lib/wmo";
import type { Waypoint } from "../lib/weather";
import { windRelativeLabel, degreesToCompass } from "../lib/wind";

type Props = {
  waypoint: Waypoint;
  data: WeatherData | undefined;
  isLoading: boolean;
  isError: boolean;
  /** Expected arrival time, e.g. "10:00". Present only in hourly/timing mode. */
  arrivalTime?: string;
  /** Route bearing at this waypoint (degrees). Used to classify head/tail/crosswind. */
  routeBearing?: number;
};

/** Determines warning CSS modifier classes based on weather thresholds. */
function warningClasses(data: WeatherData, routeBearing?: number): string[] {
  const classes: string[] = [];

  // Use hourly values when available (timing mode), otherwise daily
  const temp = data.hourlyTemp ?? data.tempMin;
  const precip = data.hourlyPrecipitation ?? data.precipitation;
  const windSpeed = data.hourlyWindSpeed ?? data.windSpeed;
  const windDir = data.hourlyWindDirection ?? data.windDirection;

  if (temp < 0) {
    classes.push("weather-card--warn-freeze");
  } else if (temp < 10) {
    classes.push("weather-card--warn-cold");
  }

  if (precip > 0.5) {
    classes.push("weather-card--warn-rain");
  }

  // Headwind warning: only when we know the route direction
  if (windDir !== undefined && routeBearing !== undefined && windSpeed > 10) {
    const label = windRelativeLabel(windDir, routeBearing);
    if (label === "Motvind") {
      classes.push("weather-card--warn-wind");
    }
  }

  return classes;
}

export function WeatherCard({ waypoint, data, isLoading, isError, arrivalTime, routeBearing }: Props) {
  const { label } = waypoint;

  const extraClasses =
    data && !isLoading && !isError
      ? warningClasses(data, routeBearing).join(" ")
      : "";

  return (
    <div className={`weather-card${extraClasses ? " " + extraClasses : ""}`}>
      <div className="weather-card__label">{label}</div>
      {waypoint.altitude != null && (
        <div className="weather-card__altitude">{waypoint.altitude} m o.h.</div>
      )}

      {arrivalTime && (
        <div className="weather-card__arrival">~{arrivalTime}</div>
      )}

      {isLoading && (
        <div className="weather-card__skeleton" aria-hidden="true">
          <div className="weather-card__skeleton-icon" />
          <div className="weather-card__skeleton-line weather-card__skeleton-line--wide" />
          <div className="weather-card__skeleton-line weather-card__skeleton-line--medium" />
          <div className="weather-card__skeleton-line weather-card__skeleton-line--narrow" />
        </div>
      )}

      {isError && (
        <div className="weather-card__error">Kunne ikke hente vær</div>
      )}

      {data && (() => {
        const { label: wLabel, emoji } = describeWeatherCode(data.weatherCode);

        // Effective wind direction and speed for display
        const windDir = data.hourlyWindDirection ?? data.windDirection;
        const windSpeed = data.hourlyWindSpeed ?? data.windSpeed;

        // Wind direction label
        let windDirLabel: string | null = null;
        if (windDir !== undefined) {
          if (routeBearing !== undefined) {
            windDirLabel = windRelativeLabel(windDir, routeBearing);
          } else {
            windDirLabel = degreesToCompass(windDir);
          }
        }

        // Feels-like temperature for display
        const feelsLike =
          data.hourlyFeelsLike ??
          (data.feelsLikeMax != null ? data.feelsLikeMax : undefined);

        // Actual temp for display
        const showHourly = data.hourlyTemp != null;

        return (
          <>
            {data.source === "climate-average" && (
              <span className="weather-card__badge">Klimasnitt</span>
            )}
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
            </div>
            {feelsLike != null && (
              <div className="weather-card__feels-like">
                Føles som {feelsLike}°
              </div>
            )}
            <div className="weather-card__detail">
              <span title="Nedbør">
                🌧 {data.precipitation} mm
                {data.precipitationProbability != null && (
                  <span className="weather-card__precip-prob"> · {data.precipitationProbability}%</span>
                )}
              </span>
            </div>
            <div className="weather-card__detail">
              <span title="Vind">
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
                {windDirLabel && (
                  <span className="weather-card__wind-dir"> · {windDirLabel}</span>
                )}
              </span>
            </div>
          </>
        );
      })()}

      {!isLoading && !isError && !data && (
        <div className="weather-card__placeholder">Velg dato for å se vær</div>
      )}
    </div>
  );
}
