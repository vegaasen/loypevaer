// src/lib/__tests__/alertDiff.test.ts
import { describe, expect, it } from "vitest";
import { hasSignificantChange, type WeatherSnapshot } from "../alertDiff";

const base: WeatherSnapshot = {
  tempMax: 10,
  precipProbability: 20,
  windSpeed: 5,
};

describe("hasSignificantChange", () => {
  it("returns false when nothing has changed", () => {
    expect(hasSignificantChange(base, { ...base })).toEqual({
      changed: false,
      summary: "",
    });
  });

  it("detects temperature drop > 4°C", () => {
    const result = hasSignificantChange(base, { ...base, tempMax: 5 });
    expect(result.changed).toBe(true);
    expect(result.summary).toContain("temperatur");
  });

  it("detects temperature rise > 4°C", () => {
    const result = hasSignificantChange(base, { ...base, tempMax: 15 });
    expect(result.changed).toBe(true);
    expect(result.summary).toContain("temperatur");
  });

  it("detects precipitation probability jump > 25pp", () => {
    const result = hasSignificantChange(base, { ...base, precipProbability: 50 });
    expect(result.changed).toBe(true);
    expect(result.summary).toContain("nedbør");
  });

  it("detects wind speed jump > 5 m/s", () => {
    const result = hasSignificantChange(base, { ...base, windSpeed: 11 });
    expect(result.changed).toBe(true);
    expect(result.summary).toContain("vind");
  });

  it("does not trigger on small changes", () => {
    expect(hasSignificantChange(base, { ...base, tempMax: 13 }).changed).toBe(false);
    expect(hasSignificantChange(base, { ...base, precipProbability: 40 }).changed).toBe(false);
    expect(hasSignificantChange(base, { ...base, windSpeed: 9 }).changed).toBe(false);
  });

  it("mentions multiple changes in summary", () => {
    const result = hasSignificantChange(base, {
      tempMax: 4,
      precipProbability: 60,
      windSpeed: 12,
    });
    expect(result.changed).toBe(true);
    expect(result.summary).toContain("temperatur");
    expect(result.summary).toContain("nedbør");
    expect(result.summary).toContain("vind");
  });
});
