import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HourlyBreakdown } from "./HourlyBreakdown";
import type { HourlyEntry } from "../lib/weather";

function makeEntries(count = 24): HourlyEntry[] {
  return Array.from({ length: count }, (_, hour) => ({
    hour,
    temp: 10 + hour * 0.5,
    feelsLike: 9 + hour * 0.5,
    precipitation: 0.1,
    precipitationProbability: 20,
    windSpeed: 10,
    windDirection: 270,
    weatherCode: 2,
  }));
}

describe("HourlyBreakdown", () => {
  it("renders a row for each entry", () => {
    const entries = makeEntries(24);
    render(<HourlyBreakdown entries={entries} />);
    const rows = document.querySelectorAll(".hourly-breakdown__row");
    expect(rows).toHaveLength(24);
  });

  it("renders formatted hour labels", () => {
    const entries = makeEntries(3);
    render(<HourlyBreakdown entries={entries} />);
    expect(screen.getByText("00:00")).toBeInTheDocument();
    expect(screen.getByText("01:00")).toBeInTheDocument();
    expect(screen.getByText("02:00")).toBeInTheDocument();
  });

  it("renders temperature for each row", () => {
    const entries = makeEntries(1);
    render(<HourlyBreakdown entries={entries} />);
    expect(screen.getByText(/10°/)).toBeInTheDocument();
  });

  it("renders feels-like temperature when present", () => {
    const entries = makeEntries(1);
    render(<HourlyBreakdown entries={entries} />);
    expect(screen.getByText(/\(9°\)/)).toBeInTheDocument();
  });

  it("renders precipitation probability when present", () => {
    const entries = makeEntries(1);
    render(<HourlyBreakdown entries={entries} />);
    expect(screen.getByText(/20%/)).toBeInTheDocument();
  });

  it("renders wind direction compass label when windDirection is set", () => {
    const entries = makeEntries(1);
    render(<HourlyBreakdown entries={entries} />);
    // windDirection=270 → "V"
    expect(screen.getByText(/· V/)).toBeInTheDocument();
  });

  it("does not crash when precipitationProbability is absent", () => {
    const entries: HourlyEntry[] = [
      { hour: 0, temp: 12, precipitation: 0, windSpeed: 5, weatherCode: 1 },
    ];
    render(<HourlyBreakdown entries={entries} />);
    expect(screen.getByText("00:00")).toBeInTheDocument();
  });

  it("renders column headers", () => {
    render(<HourlyBreakdown entries={makeEntries(1)} />);
    expect(screen.getByText("Tid")).toBeInTheDocument();
    expect(screen.getByText("Temp")).toBeInTheDocument();
    expect(screen.getByText("Nedbør")).toBeInTheDocument();
    expect(screen.getByText("Vind")).toBeInTheDocument();
  });
});
