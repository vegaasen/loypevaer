import { PRECIP_LIGHT, WIND_STRONG, TEMP_VERY_COLD } from "./weatherThresholds";

export type ClimateStoryEntry = {
  precipitation: number;
  windSpeed: number;
  tempMax: number;
};

export type ClimateStoryInput = ClimateStoryEntry[];

const MAJORITY = 0.5; // ≥50% of years = dominant

export function getClimateStoryLabel(years: ClimateStoryInput): string {
  if (years.length === 0) return "Variert vær";

  const n = years.length;
  const rainCount = years.filter((y) => y.precipitation > PRECIP_LIGHT).length;
  const windCount = years.filter((y) => y.windSpeed > WIND_STRONG).length;
  const coldCount = years.filter((y) => y.tempMax < TEMP_VERY_COLD).length;

  const rain = rainCount / n >= MAJORITY;
  const wind = windCount / n >= MAJORITY;
  const cold = coldCount / n >= MAJORITY;

  if (rain && wind && cold) return "Krevende forhold";
  if (rain && wind)         return "Vått og blåsende";
  if (rain && cold)         return "Kaldt og vått";
  if (wind && cold)         return "Kaldt og blåsende";
  if (rain)                 return "Typisk regnvær";
  if (wind)                 return "Kjent for kraftig vind";
  if (cold)                 return "Historisk kaldt";
  return "Variert vær";
}
