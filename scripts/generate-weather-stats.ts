/**
 * Build-time script: computes per-event weather statistics from the existing
 * weather-cache.json, averaging across all waypoints and all historical years.
 *
 * Writes the result to src/data/weather-stats.json.
 *
 * Usage:
 *   bun scripts/generate-weather-stats.ts
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { computeComfortScore, computeTrend, statisticalMode } from "../src/lib/weatherStats";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Local types
// ---------------------------------------------------------------------------

type Waypoint = { label: string; lat: number; lon: number; altitude?: number };

type Ritt = {
  id: string;
  name: string;
  discipline: string;
  officialDate: string;
  region: string;
  waypoints: Waypoint[];
};

type WeatherEntry = {
  tempMax: number;
  tempMin: number;
  feelsLikeMax?: number;
  precipitation: number;
  windSpeed: number;
  weatherCode: number;
  uvIndex?: number;
};

type WeatherCache = {
  historicalByYear: Record<string, WeatherEntry>;
};

type BestWorstYear = {
  year: number;
  comfortScore: number;
  avgTempMax: number;
  avgPrecipitation: number;
  avgWindSpeed: number;
  weatherCode: number;
};

type EventWeatherStats = {
  id: string;
  name: string;
  discipline: string;
  officialDate: string;
  region: string;
  avgTempMax: number | null;
  avgFeelsLikeMax: number | null;
  avgPrecipitation: number | null;
  avgWindSpeed: number | null;
  avgWeatherCode: number | null;
  comfortScore: number | null;
  bestYear: BestWorstYear | null;
  worstYear: BestWorstYear | null;
  tempTrend: number | null;
  dataYears: number;
};

type WeatherStatsOutput = {
  generatedAt: string;
  events: EventWeatherStats[];
};

// ---------------------------------------------------------------------------
// Local helpers
// ---------------------------------------------------------------------------

function avg(vals: number[]): number | null {
  if (vals.length === 0) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const paths = {
    arrangements: resolve(__dirname, "../src/data/arrangements.json"),
    triathlon: resolve(__dirname, "../src/data/triathlon-events.json"),
    running: resolve(__dirname, "../src/data/running-events.json"),
    cycling: resolve(__dirname, "../src/data/cycling-events.json"),
    cyclingManual: resolve(__dirname, "../src/data/cycling-manual.json"),
    cache: resolve(__dirname, "../public/weather-cache.json"),
    output: resolve(__dirname, "../src/data/weather-stats.json"),
  };

  const arrangements = JSON.parse(readFileSync(paths.arrangements, "utf-8")) as Ritt[];
  const triathlon = (JSON.parse(readFileSync(paths.triathlon, "utf-8")) as { events: Ritt[] })
    .events;
  const running = (JSON.parse(readFileSync(paths.running, "utf-8")) as { events: Ritt[] }).events;
  const cycling = (JSON.parse(readFileSync(paths.cycling, "utf-8")) as { events: Ritt[] }).events;
  const cyclingManual = (
    JSON.parse(readFileSync(paths.cyclingManual, "utf-8")) as { events: Ritt[] }
  ).events;

  const allEvents: Ritt[] = [
    ...arrangements,
    ...triathlon,
    ...running,
    ...cycling,
    ...cyclingManual,
  ];

  const cache = JSON.parse(readFileSync(paths.cache, "utf-8")) as WeatherCache;
  const historical = cache.historicalByYear;

  console.log(`Processing ${allEvents.length} events…`);

  const results: EventWeatherStats[] = [];

  for (const event of allEvents) {
    const [, mm, dd] = event.officialDate.split("-");

    type YearBucket = {
      tempMax: number[];
      feelsLikeMax: number[];
      precipitation: number[];
      windSpeed: number[];
      weatherCode: number[];
    };

    const byYear = new Map<number, YearBucket>();

    for (const wp of event.waypoints) {
      const prefix = `${wp.lat},${wp.lon},${mm},${dd},`;
      for (const [key, entry] of Object.entries(historical)) {
        if (!key.startsWith(prefix)) continue;
        const year = Number(key.split(",")[4]);
        if (!byYear.has(year)) {
          byYear.set(year, {
            tempMax: [],
            feelsLikeMax: [],
            precipitation: [],
            windSpeed: [],
            weatherCode: [],
          });
        }
        const bucket = byYear.get(year)!;
        bucket.tempMax.push(entry.tempMax);
        if (entry.feelsLikeMax !== undefined) bucket.feelsLikeMax.push(entry.feelsLikeMax);
        bucket.precipitation.push(entry.precipitation);
        bucket.windSpeed.push(entry.windSpeed);
        bucket.weatherCode.push(entry.weatherCode);
      }
    }

    type YearSummary = {
      year: number;
      tempMax: number;
      feelsLikeMax: number | null;
      precipitation: number;
      windSpeed: number;
      weatherCode: number;
      comfortScore: number;
    };

    const yearSummaries: YearSummary[] = [];
    for (const [year, bucket] of byYear) {
      const yearTempMax = avg(bucket.tempMax);
      const yearFeelsLikeMax = avg(bucket.feelsLikeMax);
      const yearPrecip = avg(bucket.precipitation);
      const yearWind = avg(bucket.windSpeed);
      const yearCode = statisticalMode(bucket.weatherCode);

      if (yearTempMax === null || yearPrecip === null || yearWind === null) continue;

      const feelsLike = yearFeelsLikeMax ?? yearTempMax;
      const score = computeComfortScore(feelsLike, yearPrecip, yearWind, yearCode);

      yearSummaries.push({
        year,
        tempMax: yearTempMax,
        feelsLikeMax: yearFeelsLikeMax,
        precipitation: yearPrecip,
        windSpeed: yearWind,
        weatherCode: yearCode,
        comfortScore: score,
      });
    }

    const allTempMax = yearSummaries.map((y) => y.tempMax);
    const allFeelsLikeMax = yearSummaries
      .map((y) => y.feelsLikeMax)
      .filter((v): v is number => v !== null);
    const allPrecip = yearSummaries.map((y) => y.precipitation);
    const allWind = yearSummaries.map((y) => y.windSpeed);
    const allCodes = yearSummaries.map((y) => y.weatherCode);

    const avgTempMax = avg(allTempMax);
    const avgFeelsLikeMax = avg(allFeelsLikeMax);
    const avgPrecipitation = avg(allPrecip);
    const avgWindSpeed = avg(allWind);
    const avgWeatherCode = allCodes.length > 0 ? statisticalMode(allCodes) : null;

    const feelsForScore = avgFeelsLikeMax ?? avgTempMax;
    const comfortScore =
      feelsForScore !== null &&
      avgPrecipitation !== null &&
      avgWindSpeed !== null &&
      avgWeatherCode !== null
        ? computeComfortScore(feelsForScore, avgPrecipitation, avgWindSpeed, avgWeatherCode)
        : null;

    let bestYear: BestWorstYear | null = null;
    let worstYear: BestWorstYear | null = null;
    if (yearSummaries.length > 0) {
      const sorted = [...yearSummaries].sort((a, b) => b.comfortScore - a.comfortScore);
      const best = sorted[0];
      const worst = sorted[sorted.length - 1];
      bestYear = {
        year: best.year,
        comfortScore: best.comfortScore,
        avgTempMax: best.tempMax,
        avgPrecipitation: best.precipitation,
        avgWindSpeed: best.windSpeed,
        weatherCode: best.weatherCode,
      };
      worstYear = {
        year: worst.year,
        comfortScore: worst.comfortScore,
        avgTempMax: worst.tempMax,
        avgPrecipitation: worst.precipitation,
        avgWindSpeed: worst.windSpeed,
        weatherCode: worst.weatherCode,
      };
    }

    const sortedByYear = [...yearSummaries].sort((a, b) => a.year - b.year);
    const tempTrend = computeTrend(sortedByYear.map((y) => y.tempMax));

    results.push({
      id: event.id,
      name: event.name,
      discipline: event.discipline,
      officialDate: event.officialDate,
      region: event.region,
      avgTempMax,
      avgFeelsLikeMax,
      avgPrecipitation,
      avgWindSpeed,
      avgWeatherCode,
      comfortScore,
      bestYear,
      worstYear,
      tempTrend,
      dataYears: yearSummaries.length,
    });
  }

  const withData = results.filter((r) => r.dataYears > 0).length;
  console.log(`  ${withData}/${results.length} events have historical data`);

  const output: WeatherStatsOutput = {
    generatedAt: new Date().toISOString(),
    events: results,
  };

  writeFileSync(paths.output, JSON.stringify(output, null, 2));
  console.log(`Written to src/data/weather-stats.json`);
}

main();
