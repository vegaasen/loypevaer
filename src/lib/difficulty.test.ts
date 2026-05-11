import { describe, it, expect } from "vitest";
import { physicalScore, scoreToLabel } from "./difficulty";

describe("physicalScore", () => {
  it("returns 0 for zero distance and elevation", () => {
    expect(physicalScore(0, 0)).toBe(0);
  });

  it("computes correctly for a flat 50 km ride", () => {
    expect(physicalScore(50, 0)).toBeCloseTo(1);
  });

  it("computes correctly for distance + elevation", () => {
    // 100 km / 50 + 1000 m / 500 = 2 + 2 = 4
    expect(physicalScore(100, 1000)).toBeCloseTo(4);
  });

  it("elevation alone contributes via 1/500 factor", () => {
    expect(physicalScore(0, 1000)).toBeCloseTo(2);
  });
});

describe("scoreToLabel", () => {
  it("returns Lett for score < 2", () => {
    expect(scoreToLabel(0)).toEqual({ label: "Lett", level: "lett" });
    expect(scoreToLabel(1.9)).toEqual({ label: "Lett", level: "lett" });
  });

  it("returns Moderat for score 2–4.99", () => {
    expect(scoreToLabel(2)).toEqual({ label: "Moderat", level: "moderat" });
    expect(scoreToLabel(4.99)).toEqual({ label: "Moderat", level: "moderat" });
  });

  it("returns Krevende for score 5–9.99", () => {
    expect(scoreToLabel(5)).toEqual({ label: "Krevende", level: "krevende" });
    expect(scoreToLabel(9.99)).toEqual({ label: "Krevende", level: "krevende" });
  });

  it("returns Hardt for score >= 10", () => {
    expect(scoreToLabel(10)).toEqual({ label: "Hardt", level: "hardt" });
    expect(scoreToLabel(99)).toEqual({ label: "Hardt", level: "hardt" });
  });

  it("boundary: score exactly 5 is Krevende (not Moderat)", () => {
    expect(scoreToLabel(5).level).toBe("krevende");
  });
});
