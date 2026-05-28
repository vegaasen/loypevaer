import { describe, it, expect } from "vitest";
import { buildOgDescription, getOgImagePath } from "./og";
import type { WeatherData } from "./weather";
import type { Waypoint } from "./weather";

const makeWeather = (tempMax: number, windSpeed: number): WeatherData => ({
  source: "forecast",
  tempMax,
  tempMin: tempMax - 4,
  precipitation: 0,
  windSpeed,
  weatherCode: 1,
});

const waypoints: Waypoint[] = [
  { label: "Start", lat: 60, lon: 10 },
  { label: "Toppen", lat: 61, lon: 11 },
  { label: "Mål", lat: 60.5, lon: 10.5 },
];

describe("buildOgDescription", () => {
  it("returns null when weatherResults is empty", () => {
    expect(buildOgDescription(waypoints, [])).toBeNull();
  });

  it("builds a summary string from waypoint weather", () => {
    const results = [
      { waypoint: waypoints[0], data: makeWeather(12, 3), loading: false, error: null },
      { waypoint: waypoints[1], data: makeWeather(8, 9), loading: false, error: null },
      { waypoint: waypoints[2], data: makeWeather(14, 2), loading: false, error: null },
    ];
    const desc = buildOgDescription(waypoints, results);
    expect(desc).toContain("Start: 12°C");
    expect(desc).toContain("Toppen: 8°C");
    expect(desc).toContain("Mål: 14°C");
  });

  it("skips waypoints with no data", () => {
    const results = [
      { waypoint: waypoints[0], data: makeWeather(12, 3), loading: false, error: null },
      { waypoint: waypoints[1], data: null, loading: true, error: null },
    ];
    const desc = buildOgDescription(waypoints, results);
    expect(desc).toContain("Start: 12°C");
    expect(desc).not.toContain("Toppen");
  });
});

describe("getOgImagePath", () => {
  it("maps landevei to sykkel image", () => {
    expect(getOgImagePath("landevei", "/")).toBe("/og/sykkel.jpg");
  });
  it("maps terreng to sykkel image", () => {
    expect(getOgImagePath("terreng", "/")).toBe("/og/sykkel.jpg");
  });
  it("maps cx to sykkel image", () => {
    expect(getOgImagePath("cx", "/")).toBe("/og/sykkel.jpg");
  });
  it("maps gravel to sykkel image", () => {
    expect(getOgImagePath("gravel", "/")).toBe("/og/sykkel.jpg");
  });
  it("maps langrenn to langrenn image", () => {
    expect(getOgImagePath("langrenn", "/")).toBe("/og/langrenn.jpg");
  });
  it("maps triathlon to triathlon image", () => {
    expect(getOgImagePath("triathlon", "/")).toBe("/og/triathlon.jpg");
  });
  it("maps løping to lop image", () => {
    expect(getOgImagePath("løping", "/")).toBe("/og/lop.jpg");
  });
  it("maps ultraløp to lop image", () => {
    expect(getOgImagePath("ultraløp", "/")).toBe("/og/lop.jpg");
  });
  it("falls back to default for unknown disciplines", () => {
    expect(getOgImagePath("ukjent", "/")).toBe("/og/default.jpg");
  });
  it("prepends baseUrl correctly", () => {
    expect(getOgImagePath("langrenn", "/loypevaer")).toBe("/loypevaer/og/langrenn.jpg");
  });
});
