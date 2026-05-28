import "./RaceDayCountdown.css";
import { useMemo, useState } from "react";
import type { WeatherData } from "../lib/weather";

const FORECAST_DAYS = 16;

type Props = {
  selectedDate: string;
  startWaypointWeather: WeatherData | null;
};

export function RaceDayCountdown({ selectedDate, startWaypointWeather }: Props) {
  const [nowMs] = useState<number>(() => Date.now());

  const diffDays = useMemo(() => {
    if (!selectedDate) return null;
    const [year, month, day] = selectedDate.split("-").map(Number);
    const raceDateMs = Date.UTC(year, month - 1, day);
    // Days difference (both normalised to UTC midnight)
    const todayUtcMidnight = nowMs - (nowMs % (1000 * 60 * 60 * 24));
    const diffMs = raceDateMs - todayUtcMidnight;
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  }, [selectedDate, nowMs]);

  if (!selectedDate || diffDays === null || diffDays < 0) return null;

  if (diffDays === 0) {
    return (
      <div className="race-day-countdown">
        <span className="race-day-countdown__days">Det er i dag!</span>
        <span className="race-day-countdown__status">Lykke til!</span>
      </div>
    );
  }

  const daysLabel = diffDays === 1 ? "1 dag til start" : `${diffDays} dager til start`;
  const forecastAvailable = diffDays <= FORECAST_DAYS;

  let statusText: string;
  let statusClass = "race-day-countdown__status";

  if (forecastAvailable) {
    const summary = startWaypointWeather
      ? buildStartSummary(startWaypointWeather)
      : "";
    statusText = `Prognose klar!${summary ? `  –  Start: ${summary}` : ""}`;
    statusClass += " race-day-countdown__status--ready";
  } else {
    const daysUntilForecast = diffDays - FORECAST_DAYS;
    statusText = `Prognose tilgjengelig om ca. ${daysUntilForecast} dager`;
  }

  return (
    <div className="race-day-countdown">
      <span className="race-day-countdown__days">{daysLabel}</span>
      <span className={statusClass}>{statusText}</span>
    </div>
  );
}

function buildStartSummary(weather: WeatherData): string {
  const temp = Math.round(weather.hourlyTemp ?? weather.tempMax);
  const wind = windLabel(weather.hourlyWindSpeed ?? weather.windSpeed);
  return `${temp}°C, ${wind}`;
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
