import type { WeatherData } from "../lib/weather";
import { describeWeatherCode } from "../lib/wmo";
import type { Waypoint } from "../lib/weather";

type Props = {
  waypoint: Waypoint;
  data: WeatherData | undefined;
  isLoading: boolean;
  isError: boolean;
};

export function WeatherCard({ waypoint, data, isLoading, isError }: Props) {
  const { label } = waypoint;

  return (
    <div className="weather-card">
      <div className="weather-card__label">{label}</div>

      {isLoading && (
        <div className="weather-card__loading">Laster...</div>
      )}

      {isError && (
        <div className="weather-card__error">Kunne ikke hente vær</div>
      )}

      {data && (() => {
        const { label: wLabel, emoji } = describeWeatherCode(data.weatherCode);
        return (
          <>
            {data.source === "climate-average" && (
              <span className="weather-card__badge">Klimasnitt</span>
            )}
            <div className="weather-card__icon">{emoji}</div>
            <div className="weather-card__description">{wLabel}</div>
            <div className="weather-card__temps">
              <span className="weather-card__temp-max">{data.tempMax}°</span>
              {" / "}
              <span className="weather-card__temp-min">{data.tempMin}°</span>
            </div>
            <div className="weather-card__detail">
              <span title="Nedbør">🌧 {data.precipitation} mm</span>
            </div>
            <div className="weather-card__detail">
              <span title="Vind">💨 {data.windSpeed} km/t</span>
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
