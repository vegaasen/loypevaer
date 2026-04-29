type WeatherCacheData = {
  climateAverages: Record<string, WeatherData>;
  historicalByYear: Record<string, WeatherData>;
};

let _cachePromise: Promise<WeatherCacheData> | null = null;

export function getWeatherCache(): Promise<WeatherCacheData> {
  if (!_cachePromise) {
    _cachePromise = import("../data/weather-cache.json").then(
      (m) => m.default as unknown as WeatherCacheData
    );
  }
  return _cachePromise;
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  const diffDays = (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 16;
}

export async function fetchForecastWeather(
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
export async function fetchClimateAverage(
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
  if (isForecastRange(date)) {
    return fetchForecastWeather(waypoint, date);
  }
  return fetchClimateAverage(waypoint, date);
}

/**
 * Fetches hourly forecast weather for a specific datetime ("YYYY-MM-DDTHH:00").
 * Falls back to daily data for tempMax/tempMin.
 */
export async function fetchForecastWeatherHourly(
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
export async function fetchClimateAverageHourly(
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

/**
 * Fetches weather for a specific datetime (hourly mode).
 * When datetime is provided, uses hourly data; otherwise falls back to daily.
 */
export async function fetchWeatherForDatetime(
  waypoint: Waypoint,
  datetime: string
): Promise<WeatherData> {
  if (isForecastRange(datetime.split("T")[0])) {
    return fetchForecastWeatherHourly(waypoint, datetime);
  }
  return fetchClimateAverageHourly(waypoint, datetime);
}
