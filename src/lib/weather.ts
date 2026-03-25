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
  precipitation: number;
  windSpeed: number;
  weatherCode: number;
};

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive";

const DAILY_PARAMS =
  "temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,weather_code";

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
  const params = new URLSearchParams({
    latitude: String(waypoint.lat),
    longitude: String(waypoint.lon),
    ...(waypoint.altitude !== undefined ? { elevation: String(waypoint.altitude) } : {}),
    daily: DAILY_PARAMS,
    start_date: date,
    end_date: date,
    timezone: "Europe/Oslo",
  });

  const res = await fetch(`${FORECAST_URL}?${params}`);
  if (!res.ok) throw new Error(`Open-Meteo forecast error: ${res.status}`);
  const json = await res.json();

  const d = json.daily;
  return {
    source: "forecast",
    tempMax: d.temperature_2m_max[0],
    tempMin: d.temperature_2m_min[0],
    precipitation: d.precipitation_sum[0] ?? 0,
    windSpeed: d.wind_speed_10m_max[0] ?? 0,
    weatherCode: d.weather_code[0] ?? 0,
  };
}

/**
 * Fetches the same calendar date across the past 10 years from the archive
 * and returns a simple average as a climate estimate.
 */
export async function fetchClimateAverage(
  waypoint: Waypoint,
  date: string
): Promise<WeatherData> {
  const [, month, day] = date.split("-");

  const startYear = 2015;
  const endYear = 2024;

  // Build start/end covering all years in one request (full months to avoid
  // missing days at boundaries) — then filter client-side to the exact month-day.
  // Fetch each year individually to get the exact date (archive needs exact ranges)
  const yearFetches = Array.from({ length: endYear - startYear + 1 }, (_, i) => {
    const year = startYear + i;
    const d = `${year}-${month}-${day}` as string;
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
      return r.json();
    });
  });

  const results = await Promise.all(yearFetches);
  const valid = results.filter(Boolean);

  if (valid.length === 0) throw new Error("No climate archive data available");

  const avg = (key: string) => {
    const vals = valid
      .map((r) => r.daily[key]?.[0])
      .filter((v) => v !== null && v !== undefined) as number[];
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };

  // Most common weather code across sampled years
  const codes = valid
    .map((r) => r.daily.weather_code?.[0])
    .filter((v) => v !== null && v !== undefined) as number[];
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
    source: "climate-average",
    tempMax: Math.round(avg("temperature_2m_max") * 10) / 10,
    tempMin: Math.round(avg("temperature_2m_min") * 10) / 10,
    precipitation: Math.round(avg("precipitation_sum") * 10) / 10,
    windSpeed: Math.round(avg("wind_speed_10m_max") * 10) / 10,
    weatherCode,
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
