import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { RaceDayCountdown } from "./RaceDayCountdown";

function renderCountdown(selectedDate: string, tempMax = 12, windSpeed = 4) {
  const weather = selectedDate
    ? {
        source: "forecast" as const,
        tempMax,
        tempMin: tempMax - 4,
        precipitation: 0,
        windSpeed,
        weatherCode: 1,
      }
    : null;
  return render(<RaceDayCountdown selectedDate={selectedDate} startWaypointWeather={weather} />);
}

describe("RaceDayCountdown", () => {
  const RealDate = Date;

  function mockToday(dateStr: string) {
    const fixed = new RealDate(dateStr);
    vi.spyOn(globalThis, "Date").mockImplementation((arg?: unknown) => {
      if (arg === undefined) return fixed;
      return new RealDate(arg as string | number);
    });
    (globalThis.Date as unknown as { now: () => number }).now = () => fixed.getTime();
  }

  afterEach(() => {
    vi.restoreAllMocks();
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

  it("shows climate note when event is beyond 16 days", () => {
    mockToday("2025-05-01");
    renderCountdown("2025-06-14");
    expect(screen.getByText(/dager til start/i)).toBeDefined();
    expect(screen.getByText(/Prognose tilgjengelig/i)).toBeDefined();
  });

  it("shows start waypoint temp and wind when forecast is available", () => {
    mockToday("2025-06-01");
    renderCountdown("2025-06-14", 11, 4);
    expect(screen.getByText(/11°C/)).toBeDefined();
  });
});
