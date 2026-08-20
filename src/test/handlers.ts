import { HttpResponse, http } from "msw";

/**
 * Builds a Yr compact timeseries for a given UTC date string "YYYY-MM-DD".
 * Produces 24 hourly entries (00:00–23:00 UTC) with next_1_hours and
 * every 6th entry also including next_6_hours.
 */
function buildYrTimeseries(utcDate: string) {
  return Array.from({ length: 24 }, (_, h) => {
    const time = `${utcDate}T${String(h).padStart(2, "0")}:00:00Z`;
    const entry: {
      time: string;
      data: {
        instant: {
          details: { air_temperature: number; wind_speed: number; wind_from_direction: number };
        };
        next_1_hours?: {
          summary: { symbol_code: string };
          details: { precipitation_amount: number; probability_of_precipitation: number };
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
    } = {
      time,
      data: {
        instant: {
          details: {
            air_temperature: 15 + h * 0.2,
            wind_speed: 5, // m/s → 18 km/h
            wind_from_direction: 270,
          },
        },
        next_1_hours: {
          summary: { symbol_code: "partlycloudy_day" },
          details: { precipitation_amount: 0.1, probability_of_precipitation: 20 },
        },
      },
    };
    if (h % 6 === 0) {
      entry.data.next_6_hours = {
        summary: { symbol_code: h === 12 ? "rain" : "partlycloudy_day" },
        details: { air_temperature_max: 20, air_temperature_min: 12, precipitation_amount: 0.6 },
      };
    }
    return entry;
  });
}

/** Yr compact response for tomorrow (UTC date passed as argument) */
export function mockYrCompactResponse(utcDate: string) {
  return {
    properties: {
      timeseries: buildYrTimeseries(utcDate),
    },
  };
}

/** A minimal Open-Meteo daily forecast response (1 day) */
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

/** A minimal Open-Meteo daily forecast response (2 days, for prevDay+date requests) */
const mockDailyResponse2 = {
  daily: {
    temperature_2m_max: [17, 18],
    temperature_2m_min: [9, 10],
    apparent_temperature_max: [15, 16],
    apparent_temperature_min: [7, 8],
    precipitation_sum: [0.3, 0.5],
    wind_speed_10m_max: [11, 12],
    wind_direction_10m_dominant: [270, 270],
    weather_code: [2, 2],
    precipitation_probability_max: [25, 30],
    uv_index_max: [4, 5],
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

/**
 * Combined daily + hourly mock for archive API requests.
 * Includes all daily fields needed by fetchClimateAverage.
 */
const mockArchiveResponse = {
  hourly: {
    temperature_2m: Array.from({ length: 24 }, (_, h) => 10 + h * 0.5),
    apparent_temperature: Array.from({ length: 24 }, (_, h) => 9 + h * 0.5),
    precipitation: Array(24).fill(0.1),
    wind_speed_10m: Array(24).fill(10),
    wind_direction_10m: Array(24).fill(270),
    weather_code: Array(24).fill(2),
  },
  daily: {
    temperature_2m_max: [18],
    temperature_2m_min: [10],
    apparent_temperature_max: [16],
    apparent_temperature_min: [8],
    precipitation_sum: [0.5],
    wind_speed_10m_max: [12],
    wind_direction_10m_dominant: [270],
    weather_code: [2],
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
    temperature_2m_max: [17, 18],
    temperature_2m_min: [9, 10],
    apparent_temperature_max: [15, 16],
    apparent_temperature_min: [7, 8],
    precipitation_sum: [0.3, 0.5],
    wind_speed_10m_max: [11, 12],
    wind_direction_10m_dominant: [270, 270],
    weather_code: [2, 2],
    precipitation_probability_max: [25, 30],
    uv_index_max: [4, 5],
  },
};

/** Minimal weather cache response for tests */
const mockWeatherCache = {
  climateAverages: {},
  historicalByYear: {},
};

export const handlers = [
  http.get("/weather-cache.json", () => HttpResponse.json(mockWeatherCache)),

  http.get("https://api.met.no/weatherapi/locationforecast/2.0/compact", ({ request }) => {
    const url = new URL(request.url);
    // Use the lat/lon to derive a stable UTC date for the fixture — tests control the date externally.
    // We serve a full response covering today+1 in UTC so tests using +1/+3 day offsets can filter properly.
    const lat = url.searchParams.get("lat") ?? "0";
    const lon = url.searchParams.get("lon") ?? "0";
    // Suppress unused-variable lint — lat/lon are validated by API contract but not used to vary the fixture.
    void lat;
    void lon;
    // Build timeseries spanning today and today+1 in UTC to cover any reasonable test date offset.
    const today = new Date();
    const todayUtc = today.toISOString().split("T")[0];
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const tomorrowUtc = tomorrow.toISOString().split("T")[0];
    const in3 = new Date(today);
    in3.setUTCDate(in3.getUTCDate() + 3);
    const in3Utc = in3.toISOString().split("T")[0];
    return HttpResponse.json({
      properties: {
        timeseries: [
          ...buildYrTimeseries(todayUtc),
          ...buildYrTimeseries(tomorrowUtc),
          ...buildYrTimeseries(in3Utc),
        ],
      },
    });
  }),

  http.get("https://api.open-meteo.com/v1/forecast", ({ request }) => {
    const url = new URL(request.url);
    const start = url.searchParams.get("start_date");
    const end = url.searchParams.get("end_date");
    const hasHourly = url.searchParams.has("hourly");
    const hasDaily = url.searchParams.has("daily");

    if (hasHourly) {
      if (start !== end) {
        // Two-day request with hourly: fetchForecastWeather (daily+wind hourly) or pacing mode.
        // mockHourlyResponse now includes full daily fields so both paths get what they need.
        return HttpResponse.json(mockHourlyResponse);
      }
      // Single-day hourly: breakdown path
      return HttpResponse.json(mockHourly24Response);
    }
    // Daily-only forecast
    if (hasDaily && start !== end) {
      return HttpResponse.json(mockDailyResponse2);
    }
    return HttpResponse.json(mockDailyResponse);
  }),

  http.get("https://archive-api.open-meteo.com/v1/archive", () => {
    // fetchClimateAverage and fetchClimateAverageHourly both include hourly params now.
    // Return a combined daily+hourly mock for all archive requests.
    return HttpResponse.json(mockArchiveResponse);
  }),
];
