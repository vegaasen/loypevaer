import { getTodayMidnight } from "./dates";
import type { ClimateStoryInput } from "./climateStory";
import { yrSymbolToWmo } from "./wmo";

type WeatherCacheData = {
  climateAverages: Record<string, WeatherData>;
  historicalByYear: Record<string, WeatherData>;
};

let _cachePromise: Promise<WeatherCacheData> | null = null;

export function getWeatherCache(): Promise<WeatherCacheData> {
  if (!_cachePromise) {
    _cachePromise = fetch(import.meta.env.BASE_URL + "weather-cache.json").then(
      (r) => r.json() as Promise<WeatherCacheData>
    );
  }
  return _cachePromise;
}

/**
 * Extracts up to 10 historical year-entries for a waypoint + calendar date
 * from the already-loaded weather cache, for use in climate storytelling.
 *
 * @param cache - The loaded WeatherCacheData object
 * @param lat - Waypoint latitude
 * @param lon - Waypoint longitude
 * @param date - ISO date string "YYYY-MM-DD"
 */
export function getHistoricalYears(
  cache: WeatherCacheData,
  lat: number,
  lon: number,
  date: string
): ClimateStoryInput {
  const [, , mm, dd] = date.split("-");
  const years: ClimateStoryInput = [];
  // Rolling 10-year window — matches fetch-weather-cache.ts (endYear = currentYear - 1)
  const endYear = new Date().getFullYear() - 1;
  const startYear = endYear - 9;
  for (let y = startYear; y <= endYear; y++) {
    const key = `${lat},${lon},${mm},${dd},${y}`;
    const entry = cache.historicalByYear[key];
    if (entry) {
      years.push({
        precipitation: entry.precipitation,
        windSpeed: entry.windSpeed,
        tempMax: entry.tempMax,
      });
    }
  }
  return years;
}

export type Waypoint = {
  label: string;
  lat: number;
  lon: number;
  altitude?: number;
};

export type WeatherData = {
  source: "forecast" | "climate-average";
  tempMax: number;
  tempMin: number;
  /** Apparent (feels-like) temperature max for the day */
  feelsLikeMax?: number;
  /** Apparent (feels-like) temperature min for the day */
  feelsLikeMin?: number;
  precipitation: number;
  windSpeed: number;
  /** Wind direction in degrees (0–360, meteorological). Present for both daily and hourly. */
  windDirection?: number;
  weatherCode: number;
  /** 0–100 %. Only present for forecast data; archive API does not provide this. */
  precipitationProbability?: number;
  /** Present when fetched for a specific hour (hourly mode) */
  hourlyTemp?: number;
  /** Apparent temperature for the specific arrival hour */
  hourlyFeelsLike?: number;
  hourlyPrecipitation?: number;
  hourlyWindSpeed?: number;
  /** Wind direction degrees for the specific arrival hour */
  hourlyWindDirection?: number;
  /**
   * UV index max for the day. Only present for forecast mode and live archive
   * calls (not available for pre-built climate-average cache entries).
   */
  uvIndex?: number;
  /**
   * Temperature trend vs the previous calendar day (today's tempMax − yesterday's tempMax).
   * Positive = warmer, negative = colder. Rounded to 1 decimal place.
   */
  tempTrend?: number;
};

export type WeatherResult = {
  waypoint: Waypoint;
  data: WeatherData | null;
  loading: boolean;
  error: unknown;
};

/**
 * Resolved weather values that prefer hourly (timing mode) data over daily data.
 * Use this instead of repeating the `hourlyXxx ?? dailyXxx` pattern inline.
 */
export type ResolvedWeatherValues = {
  temp: number;
  precipitation: number;
  windSpeed: number;
  windDirection: number | undefined;
};

export function resolveWeatherValues(data: WeatherData): ResolvedWeatherValues {
  return {
    temp: data.hourlyTemp ?? data.tempMin,
    precipitation: data.hourlyPrecipitation ?? data.precipitation,
    windSpeed: data.hourlyWindSpeed ?? data.windSpeed,
    windDirection: data.hourlyWindDirection ?? data.windDirection,
  };
}

/** Shape of the Open-Meteo daily-only API response used by this app */
interface OpenMeteoDailyResponse {
  daily: {
    temperature_2m_max: (number | null)[];
    temperature_2m_min: (number | null)[];
    apparent_temperature_max?: (number | null)[];
    apparent_temperature_min?: (number | null)[];
    precipitation_sum: (number | null)[];
    wind_speed_10m_max: (number | null)[];
    wind_direction_10m_dominant?: (number | null)[];
    weather_code: (number | null)[];
    precipitation_probability_max?: (number | null)[];
    uv_index_max?: (number | null)[];
  };
}

/** Shape of the Open-Meteo hourly + daily API response used by this app */
interface OpenMeteoHourlyResponse {
  hourly: {
    temperature_2m: (number | null)[];
    apparent_temperature: (number | null)[];
    precipitation: (number | null)[];
    wind_speed_10m: (number | null)[];
    wind_direction_10m: (number | null)[];
    weather_code: (number | null)[];
    precipitation_probability?: (number | null)[];
  };
  daily: {
    temperature_2m_max: (number | null)[];
    temperature_2m_min: (number | null)[];
    apparent_temperature_max?: (number | null)[];
    apparent_temperature_min?: (number | null)[];
    uv_index_max?: (number | null)[];
  };
}

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive";

const YR_FORECAST_URL = "https://api.met.no/weatherapi/locationforecast/2.0/compact";

/** Yr compact timeseries entry (relevant fields only) */
interface YrTimeseriesItem {
  time: string; // ISO UTC e.g. "2025-07-01T06:00:00Z"
  data: {
    instant: {
      details: {
        air_temperature: number;
        wind_speed: number; // m/s — multiply ×3.6 for km/h
        wind_from_direction: number;
      };
    };
    next_1_hours?: {
      summary: { symbol_code: string };
      details: { precipitation_amount: number; probability_of_precipitation?: number };
    };
    next_6_hours?: {
      summary: { symbol_code: string };
      details: {
        air_temperature_max: number;
        air_temperature_min: number;
        precipitation_amount: number;
      };
    };
  };
}

interface YrResponse {
  properties: {
    timeseries: YrTimeseriesItem[];
  };
}

const DAILY_PARAMS =
  "temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,wind_speed_10m_max,wind_direction_10m_dominant,weather_code,uv_index_max";

const HOURLY_PARAMS = "temperature_2m,apparent_temperature,precipitation,wind_speed_10m,wind_direction_10m,weather_code";

/** Parses "YYYY-MM-DDTHH:00" into { date: "YYYY-MM-DD", hour: number } */
function parseDatetime(datetime: string): { date: string; hour: number } {
  const [date, time] = datetime.split("T");
  const hour = parseInt(time?.split(":")?.[0] ?? "0", 10);
  return { date, hour };
}

/** Returns the previous calendar day as "YYYY-MM-DD" */
function prevCalendarDay(date: string): string {
  const d = new Date(date + "T00:00:00");
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

/**
 * Returns { prevMM, prevDD } for the previous calendar day of a given MM/DD.
 * Uses a leap year (2020) so Feb 29 works.
 */
function prevCalendarMonthDay(month: string, day: string): { prevMM: string; prevDD: string } {
  const d = new Date(`2020-${month}-${day}T00:00:00`);
  d.setDate(d.getDate() - 1);
  return {
    prevMM: String(d.getMonth() + 1).padStart(2, "0"),
    prevDD: String(d.getDate()).padStart(2, "0"),
  };
}

/** Returns true if selectedDate is within 16 days from today */
export function isForecastRange(date: string): boolean {
  const today = getTodayMidnight();
  const target = new Date(date);
  const diffDays = (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 16;
}

/** Returns true if selectedDate is within 0–9 days from today (Yr forecast horizon) */
export function isYrRange(date: string): boolean {
  const today = getTodayMidnight();
  const target = new Date(date);
  const diffDays = (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 9;
}

/**
 * Converts a UTC ISO timestamp to a local date string "YYYY-MM-DD" in Europe/Oslo.
 */
function toOsloDate(utcIso: string): string {
  const parts = new Intl.DateTimeFormat("nb-NO", {
    timeZone: "Europe/Oslo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(utcIso));
  const year  = parts.find((p) => p.type === "year")?.value  ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const day   = parts.find((p) => p.type === "day")?.value   ?? "";
  return `${year}-${month}-${day}`;
}

/**
 * Returns the Europe/Oslo hour (0–23) for a UTC ISO timestamp.
 */
function toOsloHour(utcIso: string): number {
  return parseInt(
    new Intl.DateTimeFormat("nb-NO", {
      timeZone: "Europe/Oslo",
      hour: "numeric",
      hour12: false,
    }).format(new Date(utcIso)),
    10
  );
}

/**
 * Fetches the Yr compact forecast for a waypoint and returns timeseries
 * entries filtered to the target calendar day (Europe/Oslo).
 */
async function fetchYrTimeseries(waypoint: Waypoint, date: string): Promise<YrTimeseriesItem[]> {
  const params = new URLSearchParams({
    lat: String(waypoint.lat),
    lon: String(waypoint.lon),
    ...(waypoint.altitude !== undefined ? { altitude: String(Math.round(waypoint.altitude)) } : {}),
  });
  const res = await fetch(`${YR_FORECAST_URL}?${params}`);
  if (!res.ok) throw new Error(`Yr API error: ${res.status}`);
  const json = await res.json() as YrResponse;
  const entries = json.properties.timeseries.filter(
    (item) => toOsloDate(item.time) === date
  );
  if (entries.length === 0) {
    throw new Error(`No Yr timeseries data for ${date}`);
  }
  return entries;
}

/**
 * Fetches daily aggregated weather from MET Norway Yr for a date within 0–9 days.
 * Aggregation rules:
 * - tempMax/tempMin: max/min of next_6_hours blocks for the day
 * - precipitation: sum of next_1_hours amounts (fallback: next_6_hours when absent)
 * - windSpeed: max instant wind_speed ×3.6 (m/s → km/h)
 * - weatherCode: yrSymbolToWmo of noon's next_6_hours symbol (fallback: first available)
 */
async function fetchYrWeather(waypoint: Waypoint, date: string): Promise<WeatherData> {
  const entries = await fetchYrTimeseries(waypoint, date);

  let tempMax = -Infinity;
  let tempMin = Infinity;
  let maxWind = 0;
  let precipitation = 0;
  let precipProbMax: number | undefined;
  let noonSymbol = "";
  let firstSymbol = "";

  for (const item of entries) {
    const instant = item.data.instant.details;
    const windKmh = instant.wind_speed * 3.6;
    if (windKmh > maxWind) maxWind = windKmh;

    const next6 = item.data.next_6_hours;
    if (next6) {
      if (next6.details.air_temperature_max > tempMax) tempMax = next6.details.air_temperature_max;
      if (next6.details.air_temperature_min < tempMin) tempMin = next6.details.air_temperature_min;
      if (!firstSymbol) firstSymbol = next6.summary.symbol_code;
      // Pick noon block (Oslo 12:00 = UTC 11:00 in winter, 10:00 in summer)
      if (toOsloHour(item.time) === 12 && !noonSymbol) noonSymbol = next6.summary.symbol_code;
    }

    const next1 = item.data.next_1_hours;
    if (next1) {
      precipitation += next1.details.precipitation_amount;
      if (next1.details.probability_of_precipitation !== undefined) {
        precipProbMax = Math.max(precipProbMax ?? 0, next1.details.probability_of_precipitation);
      }
    } else if (next6 && !item.data.next_1_hours) {
      // Only accumulate next_6_hours precipitation if no next_1_hours available for this slot
      precipitation += next6.details.precipitation_amount / 6;
    }
  }

  // Fallback: if all entries lack next_6_hours temp, use instant temps
  if (tempMax === -Infinity) {
    for (const item of entries) {
      const t = item.data.instant.details.air_temperature;
      if (t > tempMax) tempMax = t;
      if (t < tempMin) tempMin = t;
    }
  }

  const symbolCode = noonSymbol || firstSymbol;
  const weatherCode = symbolCode ? yrSymbolToWmo(symbolCode) : 0;

  return {
    source: "forecast",
    tempMax: Math.round(tempMax * 10) / 10,
    tempMin: Math.round(tempMin * 10) / 10,
    precipitation: Math.round(precipitation * 10) / 10,
    windSpeed: Math.round(maxWind * 10) / 10,
    weatherCode,
    precipitationProbability: precipProbMax,
  };
}

/**
 * Fetches hourly weather from Yr for a specific datetime ("YYYY-MM-DDTHH:00").
 */
async function fetchYrWeatherHourly(waypoint: Waypoint, datetime: string): Promise<WeatherData> {
  const { date, hour } = parseDatetime(datetime);
  const entries = await fetchYrTimeseries(waypoint, date);

  // Find the entry whose Oslo hour matches the requested hour
  const target = entries.find((item) => toOsloHour(item.time) === hour);

  if (!target) {
    throw new Error(`No Yr timeseries entry for ${datetime}`);
  }

  const instant = target.data.instant.details;
  const windKmh = instant.wind_speed * 3.6;
  const next1 = target.data.next_1_hours;
  const next6 = target.data.next_6_hours;
  const symbolCode = next1?.summary.symbol_code ?? next6?.summary.symbol_code ?? "";
  const hourlyPrecip = next1?.details.precipitation_amount ?? (next6 ? next6.details.precipitation_amount / 6 : 0);

  // Daily aggregates from all entries in the day
  let tempMax = -Infinity;
  let tempMin = Infinity;
  let maxWind = 0;
  let dailyPrecip = 0;
  for (const item of entries) {
    const w = item.data.instant.details.wind_speed * 3.6;
    if (w > maxWind) maxWind = w;
    const n6 = item.data.next_6_hours;
    if (n6) {
      if (n6.details.air_temperature_max > tempMax) tempMax = n6.details.air_temperature_max;
      if (n6.details.air_temperature_min < tempMin) tempMin = n6.details.air_temperature_min;
    }
    const n1 = item.data.next_1_hours;
    dailyPrecip += n1 ? n1.details.precipitation_amount : (n6 ? n6.details.precipitation_amount / 6 : 0);
  }
  if (tempMax === -Infinity) {
    for (const item of entries) {
      const t = item.data.instant.details.air_temperature;
      if (t > tempMax) tempMax = t;
      if (t < tempMin) tempMin = t;
    }
  }

  return {
    source: "forecast",
    tempMax: Math.round(tempMax * 10) / 10,
    tempMin: Math.round(tempMin * 10) / 10,
    precipitation: Math.round(dailyPrecip * 10) / 10,
    windSpeed: Math.round(maxWind * 10) / 10,
    windDirection: instant.wind_from_direction,
    weatherCode: symbolCode ? yrSymbolToWmo(symbolCode) : 0,
    hourlyTemp: instant.air_temperature,
    hourlyPrecipitation: Math.round(hourlyPrecip * 10) / 10,
    hourlyWindSpeed: Math.round(windKmh * 10) / 10,
    hourlyWindDirection: instant.wind_from_direction,
    precipitationProbability: next1?.details.probability_of_precipitation,
  };
}

/**
 * Fetches all 24 hourly slots for a given waypoint and date from Yr.
 */
async function fetchYrHourlyBreakdown(waypoint: Waypoint, date: string): Promise<HourlyEntry[]> {
  const entries = await fetchYrTimeseries(waypoint, date);

  return Array.from({ length: 24 }, (_, hour) => {
    const item = entries.find((e) => toOsloHour(e.time) === hour);

    if (!item) {
      return {
        hour,
        temp: 0,
        precipitation: 0,
        windSpeed: 0,
        weatherCode: 0,
      };
    }

    const instant = item.data.instant.details;
    const next1 = item.data.next_1_hours;
    const next6 = item.data.next_6_hours;
    const symbolCode = next1?.summary.symbol_code ?? next6?.summary.symbol_code ?? "";
    const precip = next1?.details.precipitation_amount ?? (next6 ? next6.details.precipitation_amount / 6 : 0);

    return {
      hour,
      temp: instant.air_temperature,
      precipitation: Math.round(precip * 10) / 10,
      precipitationProbability: next1?.details.probability_of_precipitation,
      windSpeed: Math.round(instant.wind_speed * 3.6 * 10) / 10,
      windDirection: instant.wind_from_direction,
      weatherCode: symbolCode ? yrSymbolToWmo(symbolCode) : 0,
    };
  });
}

async function fetchForecastWeather(
  waypoint: Waypoint,
  date: string
): Promise<WeatherData> {
  // Fetch 2 days (prevDay + selectedDay) to compute the temperature trend.
  const startDate = prevCalendarDay(date);

  const params = new URLSearchParams({
    latitude: String(waypoint.lat),
    longitude: String(waypoint.lon),
    ...(waypoint.altitude !== undefined ? { elevation: String(waypoint.altitude) } : {}),
    daily: `${DAILY_PARAMS},precipitation_probability_max`,
    start_date: startDate,
    end_date: date,
    timezone: "Europe/Oslo",
  });

  const res = await fetch(`${FORECAST_URL}?${params}`);
  if (!res.ok) throw new Error(`Open-Meteo forecast error: ${res.status}`);
  const json = await res.json() as OpenMeteoDailyResponse;

  // Index 0 = previous day, index 1 = selected day
  const d = json.daily;
  const i = 1;
  const prevTempMax = d.temperature_2m_max[0] ?? null;
  const todayTempMax = d.temperature_2m_max[i] ?? 0;
  const tempTrend =
    prevTempMax !== null
      ? Math.round((todayTempMax - prevTempMax) * 10) / 10
      : undefined;

  return {
    source: "forecast",
    tempMax: todayTempMax,
    tempMin: d.temperature_2m_min[i] ?? 0,
    feelsLikeMax: d.apparent_temperature_max?.[i] ?? undefined,
    feelsLikeMin: d.apparent_temperature_min?.[i] ?? undefined,
    precipitation: d.precipitation_sum[i] ?? 0,
    windSpeed: d.wind_speed_10m_max[i] ?? 0,
    windDirection: d.wind_direction_10m_dominant?.[i] ?? undefined,
    weatherCode: d.weather_code[i] ?? 0,
    precipitationProbability: d.precipitation_probability_max?.[i] ?? undefined,
    uvIndex: d.uv_index_max?.[i] ?? undefined,
    tempTrend,
  };
}

/**
 * Fetches the same calendar date across the past 10 years from the archive
 * and returns a simple average as a climate estimate.
 *
 * Checks the pre-built weather cache first (src/data/weather-cache.json).
 * Falls back to live API calls only if the cache entry is missing.
 */
async function fetchClimateAverage(
  waypoint: Waypoint,
  date: string
): Promise<WeatherData> {
  const [, month, day] = date.split("-");
  const cacheKey = `${waypoint.lat},${waypoint.lon},${month},${day}`;
  const weatherCache = await getWeatherCache();
  const cached = weatherCache.climateAverages[cacheKey];

  // Compute tempTrend by looking up the previous day in the cache
  const { prevMM, prevDD } = prevCalendarMonthDay(month, day);
  const prevCacheKey = `${waypoint.lat},${waypoint.lon},${prevMM},${prevDD}`;
  const prevCached = (weatherCache.climateAverages as Record<string, { tempMax: number } | undefined>)[prevCacheKey];

  if (cached) {
    const tempTrend =
      prevCached != null
        ? Math.round((cached.tempMax - prevCached.tempMax) * 10) / 10
        : undefined;
    return { ...cached, tempTrend };
  }

  const endYear = new Date().getFullYear() - 1;
  const startYear = endYear - 9;

  // Build start/end covering all years in one request (full months to avoid
  // missing days at boundaries) — then filter client-side to the exact month-day.
  // Fetch each year individually to get the exact date (archive needs exact ranges)
  const yearFetches = Array.from({ length: endYear - startYear + 1 }, (_, i) => {
    const year = startYear + i;
    const d = `${year}-${month}-${day}`;
    const params = new URLSearchParams({
      latitude: String(waypoint.lat),
      longitude: String(waypoint.lon),
      ...(waypoint.altitude !== undefined ? { elevation: String(waypoint.altitude) } : {}),
      daily: DAILY_PARAMS,
      start_date: d,
      end_date: d,
      timezone: "Europe/Oslo",
    });
    return fetch(`${ARCHIVE_URL}?${params}`).then((r) => {
      if (!r.ok) return null;
      return r.json() as Promise<OpenMeteoDailyResponse>;
    });
  });

  const results = await Promise.all(yearFetches);
  const valid = results.filter((r): r is OpenMeteoDailyResponse => r !== null);

  if (valid.length === 0) throw new Error("No climate archive data available");

  const avg = (accessor: (r: OpenMeteoDailyResponse) => number | null | undefined) => {
    const vals = valid
      .map(accessor)
      .filter((v): v is number => v !== null && v !== undefined);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };

  // Most common weather code across sampled years
  const codes = valid
    .map((r) => r.daily.weather_code?.[0])
    .filter((v): v is number => v !== null && v !== undefined);
  const weatherCode =
    codes.length > 0
      ? Number(
          Object.entries(
            codes.reduce<Record<number, number>>((acc, c) => {
              acc[c] = (acc[c] ?? 0) + 1;
              return acc;
            }, {})
          ).sort((a, b) => b[1] - a[1])[0][0]
        )
      : 0;

  const tempMax = Math.round((avg((r) => r.daily.temperature_2m_max[0]) ?? 0) * 10) / 10;
  const tempTrend =
    prevCached != null
      ? Math.round((tempMax - prevCached.tempMax) * 10) / 10
      : undefined;

  const roundAvg = (v: number | null): number | undefined =>
    v !== null ? Math.round(v * 10) / 10 : undefined;

  return {
    source: "climate-average",
    tempMax,
    tempMin: Math.round((avg((r) => r.daily.temperature_2m_min[0]) ?? 0) * 10) / 10,
    feelsLikeMax: roundAvg(avg((r) => r.daily.apparent_temperature_max?.[0])),
    feelsLikeMin: roundAvg(avg((r) => r.daily.apparent_temperature_min?.[0])),
    precipitation: Math.round((avg((r) => r.daily.precipitation_sum[0]) ?? 0) * 10) / 10,
    windSpeed: Math.round((avg((r) => r.daily.wind_speed_10m_max[0]) ?? 0) * 10) / 10,
    windDirection: Math.round(avg((r) => r.daily.wind_direction_10m_dominant?.[0]) ?? 0),
    weatherCode,
    uvIndex: roundAvg(avg((r) => r.daily.uv_index_max?.[0])) || undefined,
    tempTrend,
  };
}

export async function fetchWeather(
  waypoint: Waypoint,
  date: string
): Promise<WeatherData> {
  if (isYrRange(date)) {
    return fetchYrWeather(waypoint, date);
  }
  if (isForecastRange(date)) {
    return fetchForecastWeather(waypoint, date);
  }
  return fetchClimateAverage(waypoint, date);
}

/**
 * Fetches hourly forecast weather for a specific datetime ("YYYY-MM-DDTHH:00").
 * Falls back to daily data for tempMax/tempMin.
 */
async function fetchForecastWeatherHourly(
  waypoint: Waypoint,
  datetime: string
): Promise<WeatherData> {
  const { date, hour } = parseDatetime(datetime);

  // Fetch prevDay + selectedDay in daily range for trend
  const startDate = prevCalendarDay(date);

  const params = new URLSearchParams({
    latitude: String(waypoint.lat),
    longitude: String(waypoint.lon),
    ...(waypoint.altitude !== undefined ? { elevation: String(waypoint.altitude) } : {}),
    hourly: `${HOURLY_PARAMS},precipitation_probability`,
    daily: "temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,uv_index_max",
    start_date: startDate,
    end_date: date,
    timezone: "Europe/Oslo",
  });

  const res = await fetch(`${FORECAST_URL}?${params}`);
  if (!res.ok) throw new Error(`Open-Meteo forecast error: ${res.status}`);
  const json = await res.json() as OpenMeteoHourlyResponse;

  // Daily arrays: index 0 = prevDay, index 1 = selectedDay
  // Hourly arrays: 48 entries (24h prevDay + 24h selectedDay); selectedDay hours start at 24
  const dailyIdx = 1;
  const hourlyOffset = 24; // second day starts at hour index 24
  const h = json.hourly;
  const hi = hour + hourlyOffset;

  const prevTempMax = json.daily.temperature_2m_max[0] ?? null;
  const todayTempMax = json.daily.temperature_2m_max[dailyIdx] ?? 0;
  const tempTrend =
    prevTempMax !== null
      ? Math.round((todayTempMax - prevTempMax) * 10) / 10
      : undefined;

  return {
    source: "forecast",
    tempMax: todayTempMax,
    tempMin: json.daily.temperature_2m_min[dailyIdx] ?? 0,
    feelsLikeMax: json.daily.apparent_temperature_max?.[dailyIdx] ?? undefined,
    feelsLikeMin: json.daily.apparent_temperature_min?.[dailyIdx] ?? undefined,
    precipitation: h.precipitation[hi] ?? 0,
    windSpeed: h.wind_speed_10m[hi] ?? 0,
    windDirection: h.wind_direction_10m?.[hi] ?? undefined,
    weatherCode: h.weather_code[hi] ?? 0,
    precipitationProbability: h.precipitation_probability?.[hi] ?? undefined,
    uvIndex: json.daily.uv_index_max?.[dailyIdx] ?? undefined,
    tempTrend,
    hourlyTemp: h.temperature_2m[hi] ?? undefined,
    hourlyFeelsLike: h.apparent_temperature?.[hi] ?? undefined,
    hourlyPrecipitation: h.precipitation[hi] ?? 0,
    hourlyWindSpeed: h.wind_speed_10m[hi] ?? 0,
    hourlyWindDirection: h.wind_direction_10m?.[hi] ?? undefined,
  };
}

/**
 * Fetches hourly climate average for a specific datetime across the past 10 years.
 */
async function fetchClimateAverageHourly(
  waypoint: Waypoint,
  datetime: string
): Promise<WeatherData> {
  const { date, hour } = parseDatetime(datetime);
  const [, month, day] = date.split("-");

  // Look up prev day in cache for trend
  const { prevMM, prevDD } = prevCalendarMonthDay(month, day);
  const prevCacheKey = `${waypoint.lat},${waypoint.lon},${prevMM},${prevDD}`;
  const weatherCache = await getWeatherCache();
  const prevCached = (weatherCache.climateAverages as Record<string, { tempMax: number } | undefined>)[prevCacheKey];

  const endYear = new Date().getFullYear() - 1;
  const startYear = endYear - 9;

  const yearFetches = Array.from({ length: endYear - startYear + 1 }, (_, i) => {
    const year = startYear + i;
    const d = `${year}-${month}-${day}`;
    const params = new URLSearchParams({
      latitude: String(waypoint.lat),
      longitude: String(waypoint.lon),
      ...(waypoint.altitude !== undefined ? { elevation: String(waypoint.altitude) } : {}),
      hourly: HOURLY_PARAMS,
      daily: "temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,uv_index_max",
      start_date: d,
      end_date: d,
      timezone: "Europe/Oslo",
    });
    return fetch(`${ARCHIVE_URL}?${params}`).then((r) => {
      if (!r.ok) return null;
      return r.json() as Promise<OpenMeteoHourlyResponse>;
    });
  });

  const results = await Promise.all(yearFetches);
  const valid = results.filter((r): r is OpenMeteoHourlyResponse => r !== null);

  if (valid.length === 0) throw new Error("No climate archive data available");

  const avgHourly = (accessor: (r: OpenMeteoHourlyResponse) => number | null | undefined): number | null => {
    const vals = valid
      .map(accessor)
      .filter((v): v is number => v !== null && v !== undefined);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };

  // avgHourly is used for both hourly and daily fields — the logic is identical.

  const codes = valid
    .map((r) => r.hourly.weather_code?.[hour])
    .filter((v): v is number => v !== null && v !== undefined);
  const weatherCode =
    codes.length > 0
      ? Number(
          Object.entries(
            codes.reduce<Record<number, number>>((acc, c) => {
              acc[c] = (acc[c] ?? 0) + 1;
              return acc;
            }, {})
          ).sort((a, b) => b[1] - a[1])[0][0]
        )
      : 0;

  const roundAvgH = (v: number | null): number => Math.round((v ?? 0) * 10) / 10;
  const roundAvgHOpt = (v: number | null): number | undefined =>
    v !== null ? Math.round(v * 10) / 10 : undefined;

  const hourlyTemp = roundAvgH(avgHourly((r) => r.hourly.temperature_2m[hour]));
  const hourlyFeelsLike = roundAvgH(avgHourly((r) => r.hourly.apparent_temperature[hour]));
  const hourlyPrecipitation = roundAvgH(avgHourly((r) => r.hourly.precipitation[hour]));
  const hourlyWindSpeed = roundAvgH(avgHourly((r) => r.hourly.wind_speed_10m[hour]));
  const hourlyWindDirection = Math.round(avgHourly((r) => r.hourly.wind_direction_10m[hour]) ?? 0);
  const tempMax = roundAvgH(avgHourly((r) => r.daily.temperature_2m_max[0]));
  const uvRaw = roundAvgHOpt(avgHourly((r) => r.daily.uv_index_max?.[0]));

  const tempTrend =
    prevCached != null
      ? Math.round((tempMax - prevCached.tempMax) * 10) / 10
      : undefined;

  return {
    source: "climate-average",
    tempMax,
    tempMin: roundAvgH(avgHourly((r) => r.daily.temperature_2m_min[0])),
    feelsLikeMax: roundAvgHOpt(avgHourly((r) => r.daily.apparent_temperature_max?.[0])),
    feelsLikeMin: roundAvgHOpt(avgHourly((r) => r.daily.apparent_temperature_min?.[0])),
    precipitation: hourlyPrecipitation,
    windSpeed: hourlyWindSpeed,
    windDirection: hourlyWindDirection,
    weatherCode,
    uvIndex: uvRaw != null && uvRaw > 0 ? uvRaw : undefined,
    tempTrend,
    hourlyTemp,
    hourlyFeelsLike,
    hourlyPrecipitation,
    hourlyWindSpeed,
    hourlyWindDirection,
  };
}

export type HourlyEntry = {
  hour: number;
  temp: number;
  feelsLike?: number;
  precipitation: number;
  precipitationProbability?: number;
  windSpeed: number;
  windDirection?: number;
  weatherCode: number;
};

/**
 * Fetches all 24 hourly slots for a given waypoint and date.
 * Uses Yr when within 9 days, Open-Meteo forecast for days 10–16,
 * archive average across 10 years otherwise.
 */
export async function fetchHourlyBreakdown(
  waypoint: Waypoint,
  date: string
): Promise<HourlyEntry[]> {
  if (isYrRange(date)) {
    return fetchYrHourlyBreakdown(waypoint, date);
  }
  if (isForecastRange(date)) {
    return fetchForecastHourlyBreakdown(waypoint, date);
  }
  return fetchClimateAverageHourlyBreakdown(waypoint, date);
}

async function fetchForecastHourlyBreakdown(
  waypoint: Waypoint,
  date: string
): Promise<HourlyEntry[]> {
  const params = new URLSearchParams({
    latitude: String(waypoint.lat),
    longitude: String(waypoint.lon),
    ...(waypoint.altitude !== undefined ? { elevation: String(waypoint.altitude) } : {}),
    hourly: `${HOURLY_PARAMS},precipitation_probability`,
    start_date: date,
    end_date: date,
    timezone: "Europe/Oslo",
  });

  const res = await fetch(`${FORECAST_URL}?${params}`);
  if (!res.ok) throw new Error(`Open-Meteo forecast error: ${res.status}`);
  const json = await res.json() as OpenMeteoHourlyResponse;
  const h = json.hourly;

  return Array.from({ length: 24 }, (_, hour) => ({
    hour,
    temp: h.temperature_2m[hour] ?? 0,
    feelsLike: h.apparent_temperature[hour] ?? undefined,
    precipitation: h.precipitation[hour] ?? 0,
    precipitationProbability: h.precipitation_probability?.[hour] ?? undefined,
    windSpeed: h.wind_speed_10m[hour] ?? 0,
    windDirection: h.wind_direction_10m[hour] ?? undefined,
    weatherCode: h.weather_code[hour] ?? 0,
  }));
}

async function fetchClimateAverageHourlyBreakdown(
  waypoint: Waypoint,
  date: string
): Promise<HourlyEntry[]> {
  const [, month, day] = date.split("-");
  const endYear = new Date().getFullYear() - 1;
  const startYear = endYear - 9;

  const yearFetches = Array.from({ length: endYear - startYear + 1 }, (_, i) => {
    const year = startYear + i;
    const d = `${year}-${month}-${day}`;
    const params = new URLSearchParams({
      latitude: String(waypoint.lat),
      longitude: String(waypoint.lon),
      ...(waypoint.altitude !== undefined ? { elevation: String(waypoint.altitude) } : {}),
      hourly: HOURLY_PARAMS,
      start_date: d,
      end_date: d,
      timezone: "Europe/Oslo",
    });
    return fetch(`${ARCHIVE_URL}?${params}`).then((r) => {
      if (!r.ok) return null;
      return r.json() as Promise<OpenMeteoHourlyResponse>;
    });
  });

  const results = await Promise.all(yearFetches);
  const valid = results.filter((r): r is OpenMeteoHourlyResponse => r !== null);

  if (valid.length === 0) throw new Error("No climate archive data available");

  const avgAt = (
    accessor: (r: OpenMeteoHourlyResponse, h: number) => number | null | undefined
  , hour: number): number => {
    const vals = valid
      .map((r) => accessor(r, hour))
      .filter((v): v is number => v !== null && v !== undefined);
    return vals.length > 0
      ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
      : 0;
  };

  return Array.from({ length: 24 }, (_, hour) => {
    const codes = valid
      .map((r) => r.hourly.weather_code?.[hour])
      .filter((v): v is number => v !== null && v !== undefined);
    const weatherCode =
      codes.length > 0
        ? Number(
            Object.entries(
              codes.reduce<Record<number, number>>((acc, c) => {
                acc[c] = (acc[c] ?? 0) + 1;
                return acc;
              }, {})
            ).sort((a, b) => b[1] - a[1])[0][0]
          )
        : 0;

    return {
      hour,
      temp: avgAt((r, h) => r.hourly.temperature_2m[h], hour),
      feelsLike: avgAt((r, h) => r.hourly.apparent_temperature[h], hour) || undefined,
      precipitation: avgAt((r, h) => r.hourly.precipitation[h], hour),
      windSpeed: avgAt((r, h) => r.hourly.wind_speed_10m[h], hour),
      windDirection: Math.round(avgAt((r, h) => r.hourly.wind_direction_10m[h], hour)),
      weatherCode,
    };
  });
}

/**
 * Fetches weather for a specific datetime (hourly mode).
 * Uses Yr within 0–9 days, Open-Meteo forecast for days 10–16,
 * climate archive average for older dates.
 */
export async function fetchWeatherForDatetime(
  waypoint: Waypoint,
  datetime: string
): Promise<WeatherData> {
  const date = datetime.split("T")[0];
  if (isYrRange(date)) {
    return fetchYrWeatherHourly(waypoint, datetime);
  }
  if (isForecastRange(date)) {
    return fetchForecastWeatherHourly(waypoint, datetime);
  }
  return fetchClimateAverageHourly(waypoint, datetime);
}
