// src/lib/__tests__/packingList.test.ts
import { describe, expect, it } from "vitest";
import type { WaypointWeather } from "../../hooks/useWeather";
import { buildPackingList } from "../packingList";
import type { WeatherData } from "../weather";

const dummyWaypoint = { label: "Start", lat: 60.0, lon: 10.0, altitude: 100 };

function makeResult(overrides: Partial<WeatherData>): WaypointWeather {
  const data: WeatherData = {
    source: "forecast",
    tempMax: 15,
    tempMin: 10,
    precipitation: 0,
    windSpeed: 5,
    weatherCode: 0,
    ...overrides,
  };
  return { waypoint: dummyWaypoint, data, isLoading: false, isError: false };
}

describe("buildPackingList", () => {
  it("returns empty list when no data", () => {
    const result = buildPackingList(
      [{ waypoint: dummyWaypoint, data: undefined, isLoading: true, isError: false }],
      "landevei",
    );
    expect(result).toHaveLength(0);
  });

  it("puts rain jacket in 'wear' for heavy rain at all waypoints", () => {
    const results = [makeResult({ precipitation: 3 }), makeResult({ precipitation: 3 })];
    const list = buildPackingList(results, "landevei");
    const rainJacket = list.find((i) => i.item === "Regnjakke");
    expect(rainJacket?.column).toBe("wear");
  });

  it("puts rain jacket in 'carry' when only one waypoint has rain", () => {
    const results = [makeResult({ precipitation: 0 }), makeResult({ precipitation: 3 })];
    const list = buildPackingList(results, "landevei");
    const rainJacket = list.find((i) => i.item === "Regnjakke");
    expect(rainJacket?.column).toBe("carry");
  });

  it("puts warm gloves in 'wear' for freezing conditions", () => {
    const results = [makeResult({ tempMin: -2, tempMax: 0 })];
    const list = buildPackingList(results, "landevei");
    const gloves = list.find(
      (i) => i.item.toLowerCase().includes("hansker") || i.item.toLowerCase().includes("votter"),
    );
    expect(gloves?.column).toBe("wear");
  });

  it("marks windproof as 'skip' for calm warm conditions", () => {
    const results = [makeResult({ tempMax: 20, tempMin: 15, windSpeed: 3, precipitation: 0 })];
    const list = buildPackingList(results, "landevei");
    const windproof = list.find((i) => i.item === "Vindjakke");
    expect(windproof?.column).toBe("skip");
  });

  it("returns discipline-aware carry label for running", () => {
    const results = [makeResult({ precipitation: 1 })];
    const list = buildPackingList(results, "løping");
    const rainJacket = list.find((i) => i.item === "Regnjakke");
    expect(rainJacket?.reason).toContain("sekk");
  });
});
