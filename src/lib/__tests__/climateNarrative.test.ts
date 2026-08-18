// src/lib/__tests__/climateNarrative.test.ts
import { describe, expect, it } from "vitest";
import type { RittEntry } from "../arrangements";
import { buildClimateNarrative } from "../climateNarrative";

const baseEvent: RittEntry = {
  id: "test-ritt",
  name: "Test Ritt",
  discipline: "landevei",
  distance: 100,
  region: "Innlandet",
  officialDate: "2026-03-14",
  waypoints: [
    { label: "Start – Rena", lat: 61.13, lon: 11.37, altitude: 250 },
    { label: "Toppen", lat: 61.3, lon: 10.5, altitude: 1000 },
  ],
};

const cacheWithData = {
  climateAverages: {
    "61.13,11.37,03,14": {
      source: "climate-average" as const,
      tempMax: 3,
      tempMin: -1,
      precipitation: 1.2,
      windSpeed: 8,
      windDirection: 220,
      weatherCode: 61,
    },
  },
  historicalByYear: {
    "61.13,11.37,03,14,2024": {
      source: "climate-average" as const,
      tempMax: 2,
      tempMin: -2,
      precipitation: 1.5,
      windSpeed: 7,
      windDirection: 220,
      weatherCode: 61,
    },
    "61.13,11.37,03,14,2023": {
      source: "climate-average" as const,
      tempMax: 4,
      tempMin: 0,
      precipitation: 0.8,
      windSpeed: 9,
      windDirection: 230,
      weatherCode: 2,
    },
  },
};

describe("buildClimateNarrative", () => {
  it("returns null when no cache data for waypoints", () => {
    const result = buildClimateNarrative(baseEvent, {
      climateAverages: {},
      historicalByYear: {},
    });
    expect(result).toBeNull();
  });

  it("returns a Norwegian string mentioning the start waypoint label", () => {
    const result = buildClimateNarrative(baseEvent, cacheWithData);
    expect(result).not.toBeNull();
    expect(result).toContain("Rena");
  });

  it("includes temperature value from climate average", () => {
    const result = buildClimateNarrative(baseEvent, cacheWithData);
    expect(result).toMatch(/3\s*°C/);
  });

  it("mentions climate story label when historical data exists", () => {
    const result = buildClimateNarrative(baseEvent, cacheWithData);
    // getClimateStoryLabel with 2 years: both have precipitation > 0.5 and tempMax < 5, so "Kaldt og vått"
    expect(result).toContain("kaldt og vått");
  });

  it("returns null when event has no waypoints", () => {
    const result = buildClimateNarrative({ ...baseEvent, waypoints: [] }, cacheWithData);
    expect(result).toBeNull();
  });
});
