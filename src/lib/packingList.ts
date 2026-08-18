// src/lib/packingList.ts
import type { WaypointWeather } from "../hooks/useWeather";
import { resolveWeatherValues } from "./weather";
import {
  PRECIP_HEAVY,
  PRECIP_LIGHT,
  TEMP_COLD,
  TEMP_FREEZE,
  TEMP_VERY_COLD,
  WIND_STRONG,
} from "./weatherThresholds";

export type PackingColumn = "wear" | "carry" | "skip";

export type PackingItem = {
  item: string;
  reason: string;
  column: PackingColumn;
};

function carryLabel(discipline: string): string {
  switch (discipline) {
    case "løping":
    case "ultraløp":
      return "Ha i sekk/vest";
    case "langrenn":
      return "Ha i sekk";
    default:
      return "Ha med i vogn/sekk";
  }
}

export function buildPackingList(results: WaypointWeather[], discipline: string): PackingItem[] {
  const loaded = results.filter((r) => r.data != null);
  if (loaded.length === 0) return [];

  const carry = carryLabel(discipline);
  const items: PackingItem[] = [];

  const temps = loaded.map((r) => resolveWeatherValues(r.data!).temp);
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);
  const allWet = loaded.every((r) => resolveWeatherValues(r.data!).precipitation > PRECIP_LIGHT);
  const anyWet = loaded.some((r) => resolveWeatherValues(r.data!).precipitation > PRECIP_LIGHT);
  const allHeavyRain = loaded.every(
    (r) => resolveWeatherValues(r.data!).precipitation > PRECIP_HEAVY,
  );
  const anyHeavyRain = loaded.some(
    (r) => resolveWeatherValues(r.data!).precipitation > PRECIP_HEAVY,
  );
  const maxWind = Math.max(...loaded.map((r) => resolveWeatherValues(r.data!).windSpeed));

  // Rain jacket
  if (allHeavyRain) {
    items.push({ item: "Regnjakke", reason: "Kraftig nedbør langs hele løypa", column: "wear" });
  } else if (anyHeavyRain || allWet) {
    items.push({
      item: "Regnjakke",
      reason: `Nedbør på deler av løypa — ${carry.toLowerCase()}`,
      column: "carry",
    });
  } else if (anyWet) {
    items.push({
      item: "Regnjakke",
      reason: `Lett nedbør mulig — ${carry.toLowerCase()}`,
      column: "carry",
    });
  } else {
    items.push({ item: "Regnjakke", reason: "Tørt langs hele løypa", column: "skip" });
  }

  // Windproof
  if (maxWind > WIND_STRONG || minTemp < TEMP_COLD) {
    items.push({
      item: "Vindjakke",
      reason: maxWind > WIND_STRONG ? "Sterk vind langs løypa" : "Kalde forhold",
      column: "wear",
    });
  } else {
    items.push({
      item: "Vindjakke",
      reason: "Laber vind og akseptabel temperatur",
      column: "skip",
    });
  }

  // Gloves / handwear
  if (minTemp < TEMP_FREEZE) {
    items.push({
      item: "Votter",
      reason: `Under 0°C ved start (${Math.round(minTemp)}°C)`,
      column: "wear",
    });
  } else if (minTemp < TEMP_VERY_COLD) {
    items.push({
      item: "Langfingrede hansker",
      reason: `Under 5°C (${Math.round(minTemp)}°C)`,
      column: "wear",
    });
  } else if (minTemp < TEMP_COLD) {
    items.push({
      item: "Langfingrede hansker",
      reason: `Friskt ved start (${Math.round(minTemp)}°C)`,
      column: "carry",
    });
  } else {
    items.push({
      item: "Langfingrede hansker",
      reason: "Temperaturen er behagelig",
      column: "skip",
    });
  }

  // Warm base layer — only add if cold
  if (minTemp < TEMP_VERY_COLD) {
    items.push({
      item: "Ekstra varmende lag",
      reason: `Kaldt ved start (${Math.round(minTemp)}°C)`,
      column: "wear",
    });
  }

  // Range advisory item
  const tempRange = maxTemp - minTemp;
  if (tempRange > 6) {
    items.push({
      item: "Legg av klær underveis",
      reason: `Temperaturspenn ${Math.round(minTemp)}–${Math.round(maxTemp)}°C — kle deg for starten`,
      column: "carry",
    });
  }

  return items;
}
