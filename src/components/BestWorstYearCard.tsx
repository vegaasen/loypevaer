import type { BestWorstYear } from "../data/weather-stats.types";
import { describeWeatherCode } from "../lib/wmo";

interface Props {
  label: string;
  year: BestWorstYear;
  variant: "best" | "worst";
}

export function BestWorstYearCard({ label, year, variant }: Props) {
  const emoji = describeWeatherCode(year.weatherCode).emoji;
  return (
    <div className={`year-card year-card--${variant}`}>
      <div className="year-card__header">
        <span className="year-card__label">{label}</span>
        <span className="year-card__year">{year.year}</span>
      </div>
      <div className="year-card__stats">
        <span title="Komfort">{year.comfortScore}/100</span>
        <span title="Maks temp">{year.avgTempMax}°C</span>
        <span title="Nedbør">{year.avgPrecipitation} mm</span>
        <span title="Vind">{year.avgWindSpeed} m/s</span>
        <span title="Vær">{emoji}</span>
      </div>
    </div>
  );
}
