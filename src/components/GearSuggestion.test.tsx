import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { WaypointWeather } from "../hooks/useWeather";
import type { Waypoint, WeatherData } from "../lib/weather";
import { GearSuggestion } from "./GearSuggestion";

const waypoints: Waypoint[] = [{ label: "Start", lat: 60.0, lon: 10.0, altitude: 100 }];

function makeResults(overrides: Partial<WeatherData>): WaypointWeather[] {
  const data: WeatherData = {
    source: "forecast",
    tempMax: -2,
    tempMin: -6,
    precipitation: 0,
    windSpeed: 5,
    weatherCode: 0,
    ...overrides,
  };
  return [{ waypoint: waypoints[0], data, isLoading: false, isError: false }];
}

describe("GearSuggestion", () => {
  it("shows Skalljakke instead of Regnjakke for langrenn", () => {
    const results = makeResults({ precipitation: 3 });
    render(<GearSuggestion results={results} waypoints={waypoints} discipline="langrenn" />);
    expect(screen.getAllByText(/skalljakke/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/regnjakke/i)).not.toBeInTheDocument();
  });

  it("renders Smøretips for langrenn", () => {
    const results = makeResults({ tempMin: -8, tempMax: -4 });
    render(<GearSuggestion results={results} waypoints={waypoints} discipline="langrenn" />);
    expect(screen.getByText("Smøretips (klassisk)")).toBeInTheDocument();
  });

  it("does not render Smøretips for cycling", () => {
    const results = makeResults({ tempMin: -8, tempMax: -4 });
    render(<GearSuggestion results={results} waypoints={waypoints} discipline="landevei" />);
    expect(screen.queryByText("Smøretips (klassisk)")).not.toBeInTheDocument();
  });
});
