import { describe, it, expect } from "vitest";
import { getClimateStoryLabel } from "./climateStory";
import type { ClimateStoryInput } from "./climateStory";

function makeYears(count: number, precip: number, windSpeed: number, tempMax: number): ClimateStoryInput {
  return Array.from({ length: count }, () => ({ precipitation: precip, windSpeed, tempMax }));
}

describe("getClimateStoryLabel", () => {
  it("returns 'Typisk regnvær' when rain dominates", () => {
    const years = makeYears(10, 2, 5, 15);
    expect(getClimateStoryLabel(years)).toBe("Typisk regnvær");
  });

  it("returns 'Kjent for kraftig vind' when wind dominates", () => {
    const years = makeYears(10, 0, 25, 15);
    expect(getClimateStoryLabel(years)).toBe("Kjent for kraftig vind");
  });

  it("returns 'Historisk kaldt' when cold dominates", () => {
    const years = makeYears(10, 0, 5, 3);
    expect(getClimateStoryLabel(years)).toBe("Historisk kaldt");
  });

  it("returns 'Vått og blåsende' for rain+wind", () => {
    const years = makeYears(10, 2, 25, 15);
    expect(getClimateStoryLabel(years)).toBe("Vått og blåsende");
  });

  it("returns 'Kaldt og vått' for rain+cold", () => {
    const years = makeYears(10, 2, 5, 3);
    expect(getClimateStoryLabel(years)).toBe("Kaldt og vått");
  });

  it("returns 'Kaldt og blåsende' for wind+cold", () => {
    const years = makeYears(10, 0, 25, 3);
    expect(getClimateStoryLabel(years)).toBe("Kaldt og blåsende");
  });

  it("returns 'Krevende forhold' when all three dominate", () => {
    const years = makeYears(10, 2, 25, 3);
    expect(getClimateStoryLabel(years)).toBe("Krevende forhold");
  });

  it("returns 'Variert vær' when nothing dominates", () => {
    const years = makeYears(10, 0, 5, 15);
    expect(getClimateStoryLabel(years)).toBe("Variert vær");
  });

  it("returns 'Variert vær' for empty input", () => {
    expect(getClimateStoryLabel([])).toBe("Variert vær");
  });

  it("uses ≥5/10 threshold: 5 rainy years triggers rain label", () => {
    const rainy = makeYears(5, 2, 5, 15);
    const dry = makeYears(5, 0, 5, 15);
    expect(getClimateStoryLabel([...rainy, ...dry])).toBe("Typisk regnvær");
  });

  it("uses ≥5/10 threshold: 4 rainy years does NOT trigger rain label", () => {
    const rainy = makeYears(4, 2, 5, 15);
    const dry = makeYears(6, 0, 5, 15);
    expect(getClimateStoryLabel([...rainy, ...dry])).toBe("Variert vær");
  });
});
