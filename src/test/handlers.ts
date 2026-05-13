import { http, HttpResponse } from "msw";

/** A minimal Open-Meteo daily forecast response */
const mockDailyResponse = {
  daily: {
    temperature_2m_max: [18],
    temperature_2m_min: [10],
    apparent_temperature_max: [16],
    apparent_temperature_min: [8],
    precipitation_sum: [0.5],
    wind_speed_10m_max: [12],
    wind_direction_10m_dominant: [270],
    weather_code: [2],
    precipitation_probability_max: [30],
    uv_index_max: [5],
  },
};

/** A minimal Open-Meteo hourly response (24 slots — single day) */
export const mockHourly24Response = {
  hourly: {
    temperature_2m: Array.from({ length: 24 }, (_, h) => 10 + h * 0.5),
    apparent_temperature: Array.from({ length: 24 }, (_, h) => 9 + h * 0.5),
    precipitation: Array(24).fill(0.1),
    wind_speed_10m: Array(24).fill(10),
    wind_direction_10m: Array(24).fill(270),
    weather_code: Array(24).fill(2),
    precipitation_probability: Array(24).fill(20),
  },
  daily: {
    temperature_2m_max: [18],
    temperature_2m_min: [10],
    apparent_temperature_max: [16],
    apparent_temperature_min: [8],
    uv_index_max: [5],
  },
};

/** A minimal Open-Meteo hourly response (48 slots — two days, for pacing mode) */
const mockHourlyResponse = {
  hourly: {
    temperature_2m: Array(48).fill(15),
    apparent_temperature: Array(48).fill(13),
    precipitation: Array(48).fill(0.1),
    wind_speed_10m: Array(48).fill(10),
    wind_direction_10m: Array(48).fill(270),
    weather_code: Array(48).fill(2),
    precipitation_probability: Array(48).fill(20),
  },
  daily: {
    temperature_2m_max: [18, 18],
    temperature_2m_min: [10, 10],
    apparent_temperature_max: [16, 16],
    apparent_temperature_min: [8, 8],
    uv_index_max: [5, 5],
  },
};

/** Minimal weather cache response for tests */
const mockWeatherCache = {
  climateAverages: {},
  historicalByYear: {},
};

export const handlers = [
  http.get("/weather-cache.json", () => HttpResponse.json(mockWeatherCache)),

  http.get("https://api.open-meteo.com/v1/forecast", ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.has("hourly")) {
      // Single-day requests (start_date === end_date) are the breakdown path.
      // Two-day requests (start_date !== end_date) are the pacing/arrival mode.
      const start = url.searchParams.get("start_date");
      const end = url.searchParams.get("end_date");
      if (start === end) {
        return HttpResponse.json(mockHourly24Response);
      }
      return HttpResponse.json(mockHourlyResponse);
    }
    return HttpResponse.json(mockDailyResponse);
  }),

  http.get("https://archive-api.open-meteo.com/v1/archive", ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.has("hourly")) {
      return HttpResponse.json(mockHourly24Response);
    }
    return HttpResponse.json(mockDailyResponse);
  }),
];

