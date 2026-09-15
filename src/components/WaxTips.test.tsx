import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { WaypointWeather } from "../hooks/useWeather";
import type { Waypoint, WeatherData } from "../lib/weather";
import { WaxTips } from "./WaxTips";

const waypoint: Waypoint = { label: "Start", lat: 60.0, lon: 10.0, altitude: 100 };

function makeResults(overrides: Partial<WeatherData>): WaypointWeather[] {
  const data: WeatherData = {
    source: "forecast",
    tempMax: -4,
    tempMin: -8,
    precipitation: 0,
    windSpeed: 5,
    weatherCode: 0,
    ...overrides,
  };
  return [{ waypoint, data, isLoading: false, isError: false }];
}

describe("WaxTips", () => {
  it("renders a collapsible Smøretips section for langrenn", () => {
    const results = makeResults({});
    render(<WaxTips results={results} discipline="langrenn" />);
    expect(screen.getByText("Smøretips")).toBeInTheDocument();
    expect(screen.getByText(/blå/i)).toBeInTheDocument();
  });

  it("renders nothing for non-skiing disciplines", () => {
    const results = makeResults({});
    const { container } = render(<WaxTips results={results} discipline="landevei" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when there is no weather data yet", () => {
    const results: WaypointWeather[] = [
      { waypoint, data: undefined, isLoading: true, isError: false },
    ];
    const { container } = render(<WaxTips results={results} discipline="langrenn" />);
    expect(container).toBeEmptyDOMElement();
  });
});
