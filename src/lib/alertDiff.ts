// src/lib/alertDiff.ts

export type WeatherSnapshot = {
  /** Daily max temperature in °C */
  tempMax: number;
  /** Precipitation probability 0–100 */
  precipProbability: number;
  /** Wind speed in m/s */
  windSpeed: number;
};

type DiffResult = {
  changed: boolean;
  summary: string;
};

const TEMP_THRESHOLD = 4;       // °C
const PRECIP_THRESHOLD = 25;    // percentage points
const WIND_THRESHOLD = 5;       // m/s

export function hasSignificantChange(
  prev: WeatherSnapshot,
  next: WeatherSnapshot
): DiffResult {
  const parts: string[] = [];

  const tempDiff = Math.abs(next.tempMax - prev.tempMax);
  if (tempDiff > TEMP_THRESHOLD) {
    const dir = next.tempMax < prev.tempMax ? "falt" : "steget";
    parts.push(
      `temperatur: har ${dir} ${Math.round(tempDiff)}°C — nå ${Math.round(next.tempMax)}°C`
    );
  }

  const precipDiff = Math.abs(next.precipProbability - prev.precipProbability);
  if (precipDiff > PRECIP_THRESHOLD) {
    const dir = next.precipProbability > prev.precipProbability ? "økt" : "sunket";
    parts.push(
      `nedbør: sannsynlighet har ${dir} til ${Math.round(next.precipProbability)}%`
    );
  }

  const windDiff = Math.abs(next.windSpeed - prev.windSpeed);
  if (windDiff > WIND_THRESHOLD) {
    const dir = next.windSpeed > prev.windSpeed ? "økt" : "avtatt";
    parts.push(`vind: har ${dir} til ${Math.round(next.windSpeed)} m/s`);
  }

  if (parts.length === 0) {
    return { changed: false, summary: "" };
  }

  return { changed: true, summary: parts.join(". ") + "." };
}
