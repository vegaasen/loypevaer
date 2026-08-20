import type { BestWorstYear } from "../data/weather-stats.types";
import { describeWeatherCode } from "../lib/wmo";

interface Props {
  label: string;
  year: BestWorstYear;
  variant: "best" | "worst";
}

function comfortLabel(score: number): string {
  if (score >= 80) return "Utmerket";
  if (score >= 60) return "Veldig bra";
  if (score >= 40) return "Greit";
  if (score >= 20) return "Krevende";
  return "Svært dårlig";
}

export function BestWorstYearCard({ label, year, variant }: Props) {
  const emoji = describeWeatherCode(year.weatherCode).emoji;
  return (
    <div className={`year-card year-card--${variant}`}>
      <div className="year-card__header">
        <span className="year-card__label">{label}</span>
        <span className="year-card__year">{year.year}</span>
      </div>
      <div className="year-card__comfort">
        <span className="year-card__score">{year.comfortScore}/100</span>
        <span className="year-card__comfort-label">{comfortLabel(year.comfortScore)}</span>
      </div>
      <div className="year-card__stats">
        <span title="Maks temp">{year.avgTempMax}°C</span>
        <span title="Nedbør">{year.avgPrecipitation} mm</span>
        <span title="Vind">{year.avgWindSpeed} m/s</span>
        <span title="Vær">{emoji}</span>
      </div>
    </div>
  );
}
