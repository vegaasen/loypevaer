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

/** A minimal Open-Meteo hourly response */
const mockHourlyResponse = {
  hourly: {
    temperature_2m: Array(24).fill(15),
    apparent_temperature: Array(24).fill(13),
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

export const handlers = [
  http.get("https://api.open-meteo.com/v1/forecast", ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.has("hourly")) {
      return HttpResponse.json(mockHourlyResponse);
    }
    return HttpResponse.json(mockDailyResponse);
  }),

  http.get("https://archive-api.open-meteo.com/v1/archive", () => {
    return HttpResponse.json(mockDailyResponse);
  }),
];

