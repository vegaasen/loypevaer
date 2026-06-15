import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { server } from "../test/server";
import { http, HttpResponse } from "msw";
import { fetchHourlyBreakdown } from "./weather";
import type { Waypoint } from "./weather";
import { mockHourly24Response } from "../test/handlers";

const waypoint: Waypoint = { label: "Test", lat: 61.0, lon: 10.0, altitude: 200 };

// Use a date 11 days from now: within Open-Meteo forecast range (10–16) but outside Yr range (0–9).
function forecastDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 11);
  return d.toISOString().split("T")[0];
}

const FORECAST_DATE = forecastDate();
const CLIMATE_DATE = "2020-06-15"; // past → climate average

describe("fetchHourlyBreakdown — forecast path", () => {
  it("returns 24 HourlyEntry items", async () => {
    const entries = await fetchHourlyBreakdown(waypoint, FORECAST_DATE);
    expect(entries).toHaveLength(24);
  });

  it("each entry has hour 0–23", async () => {
    const entries = await fetchHourlyBreakdown(waypoint, FORECAST_DATE);
    entries.forEach((e, i) => expect(e.hour).toBe(i));
  });

  it("maps temperature from mock response", async () => {
    const entries = await fetchHourlyBreakdown(waypoint, FORECAST_DATE);
    // mockHourly24Response generates temps as 10 + hour * 0.5
    expect(entries[0].temp).toBeCloseTo(10, 1);
    expect(entries[1].temp).toBeCloseTo(10.5, 1);
  });

  it("includes precipitationProbability when present", async () => {
    const entries = await fetchHourlyBreakdown(waypoint, FORECAST_DATE);
    entries.forEach((e) => expect(e.precipitationProbability).toBe(20));
  });
});

describe("fetchHourlyBreakdown — climate-average path", () => {
  beforeEach(() => {
    // Override archive handler to return our 24-slot hourly fixture
    server.use(
      http.get("https://archive-api.open-meteo.com/v1/archive", () =>
        HttpResponse.json(mockHourly24Response)
      )
    );
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it("returns 24 HourlyEntry items", async () => {
    const entries = await fetchHourlyBreakdown(waypoint, CLIMATE_DATE);
    expect(entries).toHaveLength(24);
  });

  it("each entry has hour 0–23", async () => {
    const entries = await fetchHourlyBreakdown(waypoint, CLIMATE_DATE);
    entries.forEach((e, i) => expect(e.hour).toBe(i));
  });

  it("does not include precipitationProbability (not available in archive)", async () => {
    const entries = await fetchHourlyBreakdown(waypoint, CLIMATE_DATE);
    entries.forEach((e) => expect(e.precipitationProbability).toBeUndefined());
  });

  it("throws when archive returns no valid data", async () => {
    server.use(
      http.get("https://archive-api.open-meteo.com/v1/archive", () =>
        new HttpResponse(null, { status: 500 })
      )
    );
    await expect(fetchHourlyBreakdown(waypoint, CLIMATE_DATE)).rejects.toThrow(
      "No climate archive data available"
    );
  });
});

