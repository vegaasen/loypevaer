import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WeatherCard } from "./WeatherCard";
import type { WeatherData } from "../lib/weather";
import type { Waypoint } from "../lib/weather";

const waypoint: Waypoint = { label: "Start – Rena", lat: 61.13, lon: 11.37, altitude: 252 };

const weatherData: WeatherData = {
  source: "forecast",
  tempMax: 18,
  tempMin: 10,
  precipitation: 0.5,
  windSpeed: 12,
  windDirection: 270,
  weatherCode: 2,
  precipitationProbability: 30,
};

describe("WeatherCard", () => {
  it("renders waypoint label", () => {
    render(<WeatherCard waypoint={waypoint} data={undefined} isLoading={false} isError={false} />);
    expect(screen.getByText("Start – Rena")).toBeInTheDocument();
  });

  it("renders altitude when present", () => {
    render(<WeatherCard waypoint={waypoint} data={undefined} isLoading={false} isError={false} />);
    expect(screen.getByText("252 m o.h.")).toBeInTheDocument();
  });

  it("shows loading skeleton when isLoading=true", () => {
    render(<WeatherCard waypoint={waypoint} data={undefined} isLoading={true} isError={false} />);
    // Skeleton is aria-hidden, but it's in the DOM
    const skeleton = document.querySelector(".weather-card__skeleton");
    expect(skeleton).toBeInTheDocument();
  });

  it("shows error message when isError=true", () => {
    render(<WeatherCard waypoint={waypoint} data={undefined} isLoading={false} isError={true} />);
    expect(screen.getByText("Kunne ikke hente vær")).toBeInTheDocument();
  });

  it("shows placeholder when no data and not loading/error", () => {
    render(<WeatherCard waypoint={waypoint} data={undefined} isLoading={false} isError={false} />);
    expect(screen.getByText("Velg dato for å se vær")).toBeInTheDocument();
  });

  it("renders weather description when data is present", () => {
    render(<WeatherCard waypoint={waypoint} data={weatherData} isLoading={false} isError={false} />);
    // WMO code 2 = "Delvis skyet"
    expect(screen.getByText("Delvis skyet")).toBeInTheDocument();
  });

  it("renders daily temp max/min when no hourly temp", () => {
    render(<WeatherCard waypoint={waypoint} data={weatherData} isLoading={false} isError={false} />);
    expect(screen.getByText("18°")).toBeInTheDocument();
    expect(screen.getByText("10°")).toBeInTheDocument();
  });

  it("renders hourly temp when present", () => {
    const data: WeatherData = { ...weatherData, hourlyTemp: 15, hourlyPrecipitation: 0, hourlyWindSpeed: 8, hourlyWindDirection: 90 };
    render(<WeatherCard waypoint={waypoint} data={data} isLoading={false} isError={false} />);
    expect(screen.getByText("15°")).toBeInTheDocument();
  });

  it("shows Klimasnitt badge for climate-average source", () => {
    const data: WeatherData = { ...weatherData, source: "climate-average" };
    render(<WeatherCard waypoint={waypoint} data={data} isLoading={false} isError={false} />);
    expect(screen.getByText("Klimasnitt")).toBeInTheDocument();
  });

  it("shows arrival time when provided", () => {
    render(<WeatherCard waypoint={waypoint} data={weatherData} isLoading={false} isError={false} arrivalTime="10:30" />);
    expect(screen.getByText("~10:30")).toBeInTheDocument();
  });

  it("shows UV index when >= 3", () => {
    const data: WeatherData = { ...weatherData, uvIndex: 6 };
    render(<WeatherCard waypoint={waypoint} data={data} isLoading={false} isError={false} />);
    expect(screen.getByText(/UV 6/)).toBeInTheDocument();
    expect(screen.getByText(/Høy/)).toBeInTheDocument();
  });

  it("does not show UV when < 3", () => {
    const data: WeatherData = { ...weatherData, uvIndex: 2 };
    render(<WeatherCard waypoint={waypoint} data={data} isLoading={false} isError={false} />);
    expect(screen.queryByText(/UV/)).not.toBeInTheDocument();
  });

  it("applies freeze warning class when tempMax is below 0", () => {
    const data: WeatherData = { ...weatherData, tempMax: -5, tempMin: -10 };
    const { container } = render(<WeatherCard waypoint={waypoint} data={data} isLoading={false} isError={false} />);
    expect(container.firstChild).toHaveClass("weather-card--warn-freeze");
  });
});
