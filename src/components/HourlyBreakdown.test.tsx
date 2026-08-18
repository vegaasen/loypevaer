import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { HourlyEntry } from "../lib/weather";
import { HourlyBreakdown } from "./HourlyBreakdown";

function makeEntries(count = 24): HourlyEntry[] {
  return Array.from({ length: count }, (_, hour) => ({
    hour,
    hasData: true,
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
      { hour: 0, hasData: true, temp: 12, precipitation: 0, windSpeed: 5, weatherCode: 1 },
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

  it("does not show sparse-data note when all entries have hasData: true", () => {
    render(<HourlyBreakdown entries={makeEntries(24)} />);
    expect(screen.queryByText(/6-timers oppløsning/i)).not.toBeInTheDocument();
  });
});

describe("HourlyBreakdown with sparse Yr data", () => {
  it("only renders rows where hasData is true", () => {
    const entries: HourlyEntry[] = [
      { hour: 2, hasData: true, temp: 8.4, precipitation: 0, windSpeed: 9.7, weatherCode: 3 },
      { hour: 3, hasData: false, temp: 0, precipitation: 0, windSpeed: 0, weatherCode: 0 },
      { hour: 4, hasData: false, temp: 0, precipitation: 0, windSpeed: 0, weatherCode: 0 },
      { hour: 8, hasData: true, temp: 11.5, precipitation: 0, windSpeed: 7.2, weatherCode: 3 },
      { hour: 9, hasData: false, temp: 0, precipitation: 0, windSpeed: 0, weatherCode: 0 },
    ];
    render(<HourlyBreakdown entries={entries} />);
    // Only 2 data rows (02:00 and 08:00)
    const rows = document.querySelectorAll(".hourly-breakdown__row");
    expect(rows).toHaveLength(2);
  });

  it("shows sparse-data note when some entries have hasData: false", () => {
    const entries: HourlyEntry[] = [
      { hour: 2, hasData: true, temp: 8.4, precipitation: 0, windSpeed: 9.7, weatherCode: 3 },
      { hour: 3, hasData: false, temp: 0, precipitation: 0, windSpeed: 0, weatherCode: 0 },
    ];
    render(<HourlyBreakdown entries={entries} />);
    expect(screen.getByText(/6-timers oppløsning/i)).toBeInTheDocument();
  });
});

describe("HourlyBreakdown — highlightHour prop", () => {
  it("applies arrival class to the matching hour row", () => {
    const entries = makeEntries(24);
    render(<HourlyBreakdown entries={entries} highlightHour={6} />);
    const rows = document.querySelectorAll(".hourly-breakdown__row");
    const arrivalRows = document.querySelectorAll(".hourly-breakdown__row--arrival");
    expect(arrivalRows).toHaveLength(1);
    // Row index 6 should have the class
    expect(rows[6].classList.contains("hourly-breakdown__row--arrival")).toBe(true);
  });

  it("does not apply arrival class to other rows", () => {
    const entries = makeEntries(24);
    render(<HourlyBreakdown entries={entries} highlightHour={6} />);
    const rows = document.querySelectorAll(".hourly-breakdown__row");
    // All rows except hour 6 should not have the arrival class
    rows.forEach((row, i) => {
      if (i !== 6) {
        expect(row.classList.contains("hourly-breakdown__row--arrival")).toBe(false);
      }
    });
  });

  it("does not apply arrival class to any row when highlightHour is not provided", () => {
    const entries = makeEntries(24);
    render(<HourlyBreakdown entries={entries} />);
    const arrivalRows = document.querySelectorAll(".hourly-breakdown__row--arrival");
    expect(arrivalRows).toHaveLength(0);
  });
});
