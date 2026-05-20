import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WeatherCard } from "./WeatherCard";
import type { WeatherData } from "../lib/weather";
import type { Waypoint } from "../lib/weather";

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

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
    renderWithQuery(<WeatherCard waypoint={waypoint} data={undefined} isLoading={false} isError={false} />);
    expect(screen.getByText("Start – Rena")).toBeInTheDocument();
  });

  it("renders altitude when present", () => {
    renderWithQuery(<WeatherCard waypoint={waypoint} data={undefined} isLoading={false} isError={false} />);
    expect(screen.getByText("252 m o.h.")).toBeInTheDocument();
  });

  it("shows loading skeleton when isLoading=true", () => {
    renderWithQuery(<WeatherCard waypoint={waypoint} data={undefined} isLoading={true} isError={false} />);
    // Skeleton is aria-hidden, but it's in the DOM
    const skeleton = document.querySelector(".weather-card__skeleton");
    expect(skeleton).toBeInTheDocument();
  });

  it("shows error message when isError=true", () => {
    renderWithQuery(<WeatherCard waypoint={waypoint} data={undefined} isLoading={false} isError={true} />);
    expect(screen.getByText("Kunne ikke hente vær")).toBeInTheDocument();
  });

  it("shows placeholder when no data and not loading/error", () => {
    renderWithQuery(<WeatherCard waypoint={waypoint} data={undefined} isLoading={false} isError={false} />);
    expect(screen.getByText("Velg dato for å se vær")).toBeInTheDocument();
  });

  it("renders weather description when data is present", () => {
    renderWithQuery(<WeatherCard waypoint={waypoint} data={weatherData} isLoading={false} isError={false} />);
    // WMO code 2 = "Delvis skyet"
    expect(screen.getByText("Delvis skyet")).toBeInTheDocument();
  });

  it("renders daily temp max/min when no hourly temp", () => {
    renderWithQuery(<WeatherCard waypoint={waypoint} data={weatherData} isLoading={false} isError={false} />);
    expect(screen.getByText("18°")).toBeInTheDocument();
    expect(screen.getByText("10°")).toBeInTheDocument();
  });

  it("renders hourly temp when present", () => {
    const data: WeatherData = { ...weatherData, hourlyTemp: 15, hourlyPrecipitation: 0, hourlyWindSpeed: 8, hourlyWindDirection: 90 };
    renderWithQuery(<WeatherCard waypoint={waypoint} data={data} isLoading={false} isError={false} />);
    expect(screen.getByText("15°")).toBeInTheDocument();
  });

  it("shows Klimasnitt badge for climate-average source", () => {
    const data: WeatherData = { ...weatherData, source: "climate-average" };
    renderWithQuery(<WeatherCard waypoint={waypoint} data={data} isLoading={false} isError={false} />);
    expect(screen.getByText("Klimasnitt")).toBeInTheDocument();
  });

  it("shows arrival time when provided", () => {
    renderWithQuery(<WeatherCard waypoint={waypoint} data={weatherData} isLoading={false} isError={false} arrivalTime="10:30" />);
    expect(screen.getByText("~10:30")).toBeInTheDocument();
  });

  it("shows UV index when >= 3", () => {
    const data: WeatherData = { ...weatherData, uvIndex: 6 };
    renderWithQuery(<WeatherCard waypoint={waypoint} data={data} isLoading={false} isError={false} />);
    expect(screen.getByText(/UV 6/)).toBeInTheDocument();
    expect(screen.getByText(/Høy/)).toBeInTheDocument();
  });

  it("does not show UV when < 3", () => {
    const data: WeatherData = { ...weatherData, uvIndex: 2 };
    renderWithQuery(<WeatherCard waypoint={waypoint} data={data} isLoading={false} isError={false} />);
    expect(screen.queryByText(/UV/)).not.toBeInTheDocument();
  });

  it("applies freeze warning class when tempMax is below 0", () => {
    const data: WeatherData = { ...weatherData, tempMax: -5, tempMin: -10 };
    const { container } = renderWithQuery(<WeatherCard waypoint={waypoint} data={data} isLoading={false} isError={false} />);
    expect(container.firstChild).toHaveClass("weather-card--warn-freeze");
  });

  it("does not show hourly toggle when no date is provided", () => {
    renderWithQuery(<WeatherCard waypoint={waypoint} data={weatherData} isLoading={false} isError={false} />);
    expect(screen.queryByRole("button", { name: /time for time/i })).not.toBeInTheDocument();
  });

  it("shows hourly toggle button when data and date are present", () => {
    renderWithQuery(
      <WeatherCard waypoint={waypoint} data={weatherData} isLoading={false} isError={false} date="2099-06-15" />
    );
    expect(screen.getByRole("button", { name: /time for time/i })).toBeInTheDocument();
  });

  it("toggle button starts collapsed (aria-expanded=false)", () => {
    renderWithQuery(
      <WeatherCard waypoint={waypoint} data={weatherData} isLoading={false} isError={false} date="2099-06-15" />
    );
    const btn = screen.getByRole("button", { name: /time for time/i });
    expect(btn).toHaveAttribute("aria-expanded", "false");
  });

  it("clicking toggle expands the hourly panel (aria-expanded=true)", () => {
    renderWithQuery(
      <WeatherCard waypoint={waypoint} data={weatherData} isLoading={false} isError={false} date="2099-06-15" />
    );
    const btn = screen.getByRole("button", { name: /time for time/i });
    fireEvent.click(btn);
    expect(btn).toHaveAttribute("aria-expanded", "true");
  });

  it("clicking toggle twice collapses the panel again", () => {
    renderWithQuery(
      <WeatherCard waypoint={waypoint} data={weatherData} isLoading={false} isError={false} date="2099-06-15" />
    );
    const btn = screen.getByRole("button", { name: /time for time/i });
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(btn).toHaveAttribute("aria-expanded", "false");
  });

  it("renders ClimateHistoryBadge when historicalYears is provided", () => {
    const years = Array.from({ length: 10 }, () => ({
      precipitation: 2,
      windSpeed: 25,
      tempMax: 3,
    }));
    renderWithQuery(
      <WeatherCard
        waypoint={waypoint}
        data={undefined}
        isLoading={false}
        isError={false}
        historicalYears={years}
      />
    );
    expect(screen.getByText("Historisk")).toBeInTheDocument();
    expect(screen.getByText("Krevende forhold")).toBeInTheDocument();
  });

  it("does not render ClimateHistoryBadge when historicalYears is absent", () => {
    renderWithQuery(
      <WeatherCard
        waypoint={waypoint}
        data={undefined}
        isLoading={false}
        isError={false}
      />
    );
    expect(screen.queryByText("Historisk")).not.toBeInTheDocument();
  });
});
