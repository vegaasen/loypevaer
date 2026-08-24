import { describe, expect, it } from "vitest";
import type { WaypointWeather } from "../hooks/useWeather";
import { dominantWind } from "./dominantWind";
import type { Waypoint } from "./weather";

const wp = (lat: number, lon: number): Waypoint => ({ label: "X", lat, lon });

function makeResult(windDir: number, windSpeed: number): WaypointWeather {
  return {
    waypoint: wp(0, 0),
    data: {
      source: "forecast" as const,
      tempMax: 15,
      tempMin: 10,
      windSpeed,
      windDirection: windDir,
      precipitation: 0,
      weatherCode: 0,
    },
    isLoading: false,
    isError: false,
  };
}

describe("dominantWind", () => {
  it("returns null when no data", () => {
    expect(dominantWind([], [])).toBeNull();
  });

  it("returns Motvind when majority are headwind", () => {
    // Route goes north (bearing ≈ 0°). Wind from north (0°) = wind blows south = headwind.
    const waypoints = [wp(60, 10), wp(61, 10), wp(62, 10)];
    const results: WaypointWeather[] = [
      makeResult(0, 5), // headwind
      makeResult(0, 5), // headwind
      makeResult(180, 5), // tailwind
    ];
    expect(dominantWind(results, waypoints)).toBe("Motvind");
  });

  it("returns Medvind when majority are tailwind", () => {
    const waypoints = [wp(60, 10), wp(61, 10), wp(62, 10)];
    // wind FROM south (180°) blows north = tailwind on northbound route
    const results: WaypointWeather[] = [
      makeResult(180, 5), // tailwind
      makeResult(180, 5), // tailwind
      makeResult(0, 5), // headwind
    ];
    expect(dominantWind(results, waypoints)).toBe("Medvind");
  });

  it("returns null when wind speed is below threshold at all waypoints", () => {
    const waypoints = [wp(60, 10), wp(61, 10)];
    const results: WaypointWeather[] = [
      makeResult(0, 1), // headwind but too weak
      makeResult(0, 1),
    ];
    expect(dominantWind(results, waypoints)).toBeNull();
  });
});
