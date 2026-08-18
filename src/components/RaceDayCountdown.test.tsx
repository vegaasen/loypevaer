import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { WeatherData } from "../lib/weather";
import { RaceDayCountdown } from "./RaceDayCountdown";

function renderCountdown(
  selectedDate: string,
  tempMax = 12,
  windSpeed = 4,
  source: WeatherData["source"] = "forecast",
) {
  const weather = selectedDate
    ? ({
        source,
        tempMax,
        tempMin: tempMax - 4,
        precipitation: 0,
        windSpeed,
        weatherCode: 1,
      } as WeatherData)
    : null;
  return render(<RaceDayCountdown selectedDate={selectedDate} startWaypointWeather={weather} />);
}

describe("RaceDayCountdown", () => {
  function mockToday(dateStr: string) {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(dateStr));
  }

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing when selectedDate is empty", () => {
    const { container } = render(<RaceDayCountdown selectedDate="" startWaypointWeather={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when event is in the past", () => {
    mockToday("2025-06-15");
    const { container } = renderCountdown("2025-06-14");
    expect(container.firstChild).toBeNull();
  });

  it("shows today message when event is today", () => {
    mockToday("2025-06-14");
    renderCountdown("2025-06-14");
    expect(screen.getByText(/i dag/i)).toBeDefined();
  });

  it("shows 1 dag (singular) when event is tomorrow", () => {
    mockToday("2025-06-13");
    renderCountdown("2025-06-14");
    expect(screen.getByText(/1 dag til start/i)).toBeDefined();
  });

  it("shows days count when event is within forecast range", () => {
    mockToday("2025-06-01");
    renderCountdown("2025-06-14");
    expect(screen.getByText(/13 dager til start/i)).toBeDefined();
    expect(screen.getByText(/Prognose klar/i)).toBeDefined();
  });

  it("shows climate note when event is beyond forecast range", () => {
    mockToday("2025-05-01");
    renderCountdown("2025-06-14", 12, 4, "climate-average");
    expect(screen.getByText(/dager til start/i)).toBeDefined();
    expect(screen.getByText(/Prognose tilgjengelig/i)).toBeDefined();
    expect(screen.getByText(/Klimasnitt start/i)).toBeDefined();
  });

  it("shows start waypoint temp and wind when forecast is available", () => {
    mockToday("2025-06-01");
    renderCountdown("2025-06-14", 11, 4);
    expect(screen.getByText(/11°C/)).toBeDefined();
  });
});
