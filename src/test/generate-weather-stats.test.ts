import { describe, it, expect } from "vitest";

import {
  computeComfortScore,
  computeTrend,
  statisticalMode,
} from "../../src/lib/weatherStats";

describe("computeComfortScore", () => {
  it("gives max score for ideal cycling conditions", () => {
    // 16°C feels-like, 0mm rain, 0 m/s wind, WMO 0 (clear sky)
    expect(computeComfortScore(16, 0, 0, 0)).toBe(100);
  });

  it("penalises heavy rain", () => {
    const dry = computeComfortScore(16, 0, 0, 0);
    const wet = computeComfortScore(16, 10, 0, 0);
    expect(wet).toBeLessThan(dry);
  });

  it("penalises high wind", () => {
    const calm = computeComfortScore(16, 0, 0, 0);
    const windy = computeComfortScore(16, 0, 20, 0);
    expect(windy).toBeLessThan(calm);
  });

  it("penalises thunderstorm weather code (95)", () => {
    const clear = computeComfortScore(16, 0, 0, 0);
    const storm = computeComfortScore(16, 0, 0, 95);
    expect(storm).toBeLessThan(clear);
  });

  it("returns 0 for extreme conditions", () => {
    // -30°C, 50mm rain, 40 m/s wind, storm
    expect(computeComfortScore(-30, 50, 40, 95)).toBe(0);
  });
});

describe("computeTrend", () => {
  it("returns 0 for flat data", () => {
    const vals = [10, 10, 10, 10, 10];
    expect(computeTrend(vals)).toBeCloseTo(0, 2);
  });

  it("returns positive slope for rising data", () => {
    // +1°C per year over 5 years
    const vals = [10, 11, 12, 13, 14];
    expect(computeTrend(vals)).toBeCloseTo(1, 1);
  });

  it("returns negative slope for falling data", () => {
    const vals = [14, 13, 12, 11, 10];
    expect(computeTrend(vals)).toBeCloseTo(-1, 1);
  });

  it("returns null for fewer than 3 data points", () => {
    expect(computeTrend([10, 11])).toBeNull();
  });
});

describe("statisticalMode", () => {
  it("returns the most frequent value", () => {
    expect(statisticalMode([1, 2, 2, 3])).toBe(2);
  });

  it("handles a single value", () => {
    expect(statisticalMode([5])).toBe(5);
  });
});
