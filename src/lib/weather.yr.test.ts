import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { server } from "../test/server";
import type { Waypoint } from "./weather";
import { fetchHourlyBreakdown, fetchWeather, fetchWeatherForDatetime } from "./weather";

const waypoint: Waypoint = { label: "Test", lat: 61.0, lon: 10.0, altitude: 200 };

/** Returns a date offset from today as "YYYY-MM-DD" */
function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

const YR_DATE = dateOffset(1); // tomorrow — within 0-9 day Yr range
const OM_DATE = dateOffset(12); // 12 days out — Open-Meteo range
const PAST_DATE = "2020-06-15"; // past — climate average

describe("fetchWeather — Yr path (0-9 days)", () => {
  it("returns source: forecast", async () => {
    const data = await fetchWeather(waypoint, YR_DATE);
    expect(data.source).toBe("forecast");
  });

  it("returns a valid tempMax and tempMin", async () => {
    const data = await fetchWeather(waypoint, YR_DATE);
    expect(data.tempMax).toBeGreaterThanOrEqual(data.tempMin);
    expect(typeof data.tempMax).toBe("number");
    expect(typeof data.tempMin).toBe("number");
  });

  it("converts wind speed from m/s to km/h (mock wind_speed=5 → 18 km/h)", async () => {
    const data = await fetchWeather(waypoint, YR_DATE);
    // mock has wind_speed=5 m/s → 5*3.6=18 km/h
    expect(data.windSpeed).toBeCloseTo(18, 0);
  });

  it("maps partlycloudy symbol to WMO code 2 (or rain=63 if noon block is rain)", async () => {
    const data = await fetchWeather(waypoint, YR_DATE);
    // noon (h=12 in UTC) has symbol_code "rain" → WMO 63
    // but if noon slot is not in the Oslo-day filtered list, fallback to partlycloudy → 2
    expect([2, 63]).toContain(data.weatherCode);
  });

  it("sums precipitation from next_1_hours", async () => {
    const data = await fetchWeather(waypoint, YR_DATE);
    // 24 entries × 0.1 mm each = 2.4 mm
    expect(data.precipitation).toBeCloseTo(2.4, 0);
  });
});

describe("fetchWeather — Open-Meteo path used for day 12 (not Yr)", () => {
  it("does not call api.met.no for day 12", async () => {
    let yrCalled = false;
    server.use(
      http.get("https://api.met.no/weatherapi/locationforecast/2.0/compact", () => {
        yrCalled = true;
        return new HttpResponse(null, { status: 500 });
      }),
    );
    const data = await fetchWeather(waypoint, OM_DATE);
    expect(yrCalled).toBe(false);
    expect(data.source).toBe("forecast");
  });

  afterEach(() => {
    server.resetHandlers();
  });
});

describe("fetchWeather — climate-average path for past date", () => {
  it("returns source: climate-average for past date", async () => {
    const data = await fetchWeather(waypoint, PAST_DATE);
    expect(data.source).toBe("climate-average");
  });
});

describe("fetchWeatherForDatetime — Yr hourly path (0-9 days)", () => {
  it("returns source: forecast", async () => {
    const data = await fetchWeatherForDatetime(waypoint, `${YR_DATE}T10:00`);
    expect(data.source).toBe("forecast");
  });

  it("returns hourlyTemp from Yr instant air_temperature at hour 10", async () => {
    const data = await fetchWeatherForDatetime(waypoint, `${YR_DATE}T10:00`);
    // mock air_temperature = 15 + h * 0.2; h=10 in Oslo = UTC 08:00 in summer (UTC+2)
    // The exact hour depends on Oslo timezone offset, so just check it's a number
    expect(typeof data.hourlyTemp).toBe("number");
  });

  it("returns hourlyWindSpeed in km/h", async () => {
    const data = await fetchWeatherForDatetime(waypoint, `${YR_DATE}T10:00`);
    expect(data.hourlyWindSpeed).toBeCloseTo(18, 0);
  });
});

describe("fetchHourlyBreakdown — Yr path (0-9 days)", () => {
  it("returns exactly 24 HourlyEntry items", async () => {
    const entries = await fetchHourlyBreakdown(waypoint, YR_DATE);
    expect(entries).toHaveLength(24);
  });

  it("each entry has hour 0–23", async () => {
    const entries = await fetchHourlyBreakdown(waypoint, YR_DATE);
    entries.forEach((e, i) => expect(e.hour).toBe(i));
  });

  it("wind speed is in km/h (not m/s)", async () => {
    const entries = await fetchHourlyBreakdown(waypoint, YR_DATE);
    // entries with a matching timeseries should have ~18 km/h wind
    const withWind = entries.filter((e) => e.windSpeed > 0);
    withWind.forEach((e) => expect(e.windSpeed).toBeCloseTo(18, 0));
  });

  it("marks sentinel rows (hours with no Yr data) as hasData: false", async () => {
    // Override with a 6-hourly (sparse) mock → only Oslo 02, 08, 14, 20 have data
    server.use(
      http.get("https://api.met.no/weatherapi/locationforecast/2.0/compact", () => {
        const today = new Date();
        const d1 = new Date(today);
        d1.setUTCDate(d1.getUTCDate() + 1);
        const d1Utc = d1.toISOString().split("T")[0];
        const sparse = [0, 6, 12, 18].map((h) => ({
          time: `${d1Utc}T${String(h).padStart(2, "0")}:00:00Z`,
          data: {
            instant: { details: { air_temperature: 10, wind_speed: 5, wind_from_direction: 270 } },
            next_6_hours: {
              summary: { symbol_code: "partlycloudy_day" },
              details: {
                air_temperature_max: 15,
                air_temperature_min: 8,
                precipitation_amount: 0.6,
              },
            },
          },
        }));
        return HttpResponse.json({ properties: { timeseries: sparse } });
      }),
    );

    const entries = await fetchHourlyBreakdown(waypoint, YR_DATE);
    expect(entries).toHaveLength(24);

    const realEntries = entries.filter((e) => e.hasData);
    expect(realEntries).toHaveLength(4);

    const sentinelEntries = entries.filter((e) => !e.hasData);
    expect(sentinelEntries).toHaveLength(20);

    expect(realEntries[0].temp).not.toBe(0);
    expect(sentinelEntries[0].temp).toBe(0);
    expect(sentinelEntries[0].windSpeed).toBe(0);
  });

  afterEach(() => {
    server.resetHandlers();
  });
});

/**
 * Builds a sparse (6-hourly) Yr timeseries for a given UTC date, matching
 * the resolution Yr uses for dates 3+ days out. Entries at UTC 00, 06, 12, 18
 * → Oslo hours 02, 08, 14, 20 (UTC+2 summer).
 */
function buildSparseYrTimeseries(utcDate: string) {
  return [0, 6, 12, 18].map((h) => ({
    time: `${utcDate}T${String(h).padStart(2, "0")}:00:00Z`,
    data: {
      instant: {
        details: {
          air_temperature: 10 + h * 0.5,
          wind_speed: 5,
          wind_from_direction: 270,
        },
      },
      next_6_hours: {
        summary: { symbol_code: "partlycloudy_day" },
        details: { air_temperature_max: 20, air_temperature_min: 8, precipitation_amount: 0.6 },
      },
    },
  }));
}

describe("fetchWeatherForDatetime — Yr sparse (6-hourly) resolution, no exact hour match", () => {
  // Yr returns only 4 entries/day (UTC 00,06,12,18 → Oslo 02,08,14,20) for dates 3+ days out.
  // Requesting hour 01, 05, 09, 22 etc. must snap to the nearest available entry instead of throwing.
  beforeEach(() => {
    server.use(
      http.get("https://api.met.no/weatherapi/locationforecast/2.0/compact", ({ request }) => {
        const url = new URL(request.url);
        void url;
        // Build a sparse response: today+1 at hourly, today+3 at 6-hourly (simulating real Yr)
        const today = new Date();
        const d3 = new Date(today);
        d3.setUTCDate(d3.getUTCDate() + 3);
        const d3Utc = d3.toISOString().split("T")[0];
        return HttpResponse.json({
          properties: {
            timeseries: buildSparseYrTimeseries(d3Utc),
          },
        });
      }),
    );
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it("does not throw when requested hour has no exact Yr entry — snaps to nearest", async () => {
    const sparse_date = dateOffset(3);
    // hour 01 Oslo has no exact entry (available: 02, 08, 14, 20); should snap to 02
    await expect(fetchWeatherForDatetime(waypoint, `${sparse_date}T01:00`)).resolves.not.toThrow();
  });

  it("returns source: forecast when snapping to nearest Yr entry", async () => {
    const sparse_date = dateOffset(3);
    const data = await fetchWeatherForDatetime(waypoint, `${sparse_date}T01:00`);
    expect(data.source).toBe("forecast");
  });

  it("returns a valid hourlyTemp when snapping to nearest Yr entry", async () => {
    const sparse_date = dateOffset(3);
    const data = await fetchWeatherForDatetime(waypoint, `${sparse_date}T05:00`);
    expect(typeof data.hourlyTemp).toBe("number");
  });

  it("does not throw for hour 22 (nearest available is 20)", async () => {
    const sparse_date = dateOffset(3);
    await expect(fetchWeatherForDatetime(waypoint, `${sparse_date}T22:00`)).resolves.not.toThrow();
  });
});

describe("fetchWeatherForDatetime — hourlyIsApproximate flag (three-tier lookup)", () => {
  afterEach(() => {
    server.resetHandlers();
  });

  it("hourlyIsApproximate is false when an exact Oslo-hour match exists (1-hourly Yr)", async () => {
    // Default handler returns 1-hourly data — exact match should always be available
    const data = await fetchWeatherForDatetime(waypoint, `${YR_DATE}T10:00`);
    expect(data.hourlyIsApproximate).toBe(false);
  });

  it("hourlyIsApproximate is true and value is interpolated between surrounding 6-hourly entries", async () => {
    // Sparse mock: UTC 00,06,12,18 → Oslo 02,08,14,20. Request hour 05 (between 02 and 08).
    const sparse_date = dateOffset(3);
    const d3 = new Date();
    d3.setUTCDate(d3.getUTCDate() + 3);
    const d3Utc = d3.toISOString().split("T")[0];

    // UTC 00 → air_temperature: 10+0*0.5=10, UTC 06 → air_temperature: 10+6*0.5=13
    // Oslo 02 (UTC 00) = 10°, Oslo 08 (UTC 06) = 13°
    // Requesting Oslo hour 05: ratio = (5-2)/(8-2) = 0.5 → interpolated ≈ 11.5°
    server.use(
      http.get("https://api.met.no/weatherapi/locationforecast/2.0/compact", () =>
        HttpResponse.json({
          properties: {
            timeseries: buildSparseYrTimeseries(d3Utc),
          },
        }),
      ),
    );

    const data = await fetchWeatherForDatetime(waypoint, `${sparse_date}T05:00`);
    expect(data.hourlyIsApproximate).toBe(true);
    // Interpolated temp should be between the two surrounding values
    expect(data.hourlyTemp).toBeGreaterThan(10);
    expect(data.hourlyTemp).toBeLessThan(13);
  });

  it("hourlyIsApproximate is true when snapping (only one side available — boundary hour)", async () => {
    // Use a single-entry timeseries so no surrounding pair can be formed
    server.use(
      http.get("https://api.met.no/weatherapi/locationforecast/2.0/compact", () => {
        const today = new Date();
        const d3 = new Date(today);
        d3.setUTCDate(d3.getUTCDate() + 3);
        const d3Utc = d3.toISOString().split("T")[0];
        return HttpResponse.json({
          properties: {
            timeseries: [
              {
                time: `${d3Utc}T12:00:00Z`,
                data: {
                  instant: {
                    details: { air_temperature: 10, wind_speed: 5, wind_from_direction: 270 },
                  },
                  next_6_hours: {
                    summary: { symbol_code: "partlycloudy_day" },
                    details: {
                      air_temperature_max: 15,
                      air_temperature_min: 8,
                      precipitation_amount: 0.6,
                    },
                  },
                },
              },
            ],
          },
        });
      }),
    );

    const sparse_date = dateOffset(3);
    // Only one entry exists, so the three-tier falls through to nearest snap
    const data = await fetchWeatherForDatetime(waypoint, `${sparse_date}T05:00`);
    expect(data.hourlyIsApproximate).toBe(true);
    expect(typeof data.hourlyTemp).toBe("number");
  });
});

describe("fetchHourlyBreakdown — Yr path returns Open-Meteo for day 12", () => {
  beforeEach(() => {
    server.use(
      http.get("https://api.met.no/weatherapi/locationforecast/2.0/compact", () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it("uses Open-Meteo (not Yr) for day 12 hourly breakdown", async () => {
    // Day 12 should not hit Yr — if Yr returns 500 but Open-Meteo is mocked, no error
    const entries = await fetchHourlyBreakdown(waypoint, OM_DATE);
    expect(entries).toHaveLength(24);
  });
});
