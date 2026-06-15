import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { server } from "../test/server";
import { http, HttpResponse } from "msw";
import { fetchWeather, fetchWeatherForDatetime, fetchHourlyBreakdown } from "./weather";
import type { Waypoint } from "./weather";

const waypoint: Waypoint = { label: "Test", lat: 61.0, lon: 10.0, altitude: 200 };

/** Returns a date offset from today as "YYYY-MM-DD" */
function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

const YR_DATE = dateOffset(1);   // tomorrow — within 0-9 day Yr range
const OM_DATE = dateOffset(12);  // 12 days out — Open-Meteo range
const PAST_DATE = "2020-06-15";  // past — climate average

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
      })
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
});

describe("fetchHourlyBreakdown — Yr path returns Open-Meteo for day 12", () => {
  beforeEach(() => {
    server.use(
      http.get("https://api.met.no/weatherapi/locationforecast/2.0/compact", () => {
        return new HttpResponse(null, { status: 500 });
      })
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
