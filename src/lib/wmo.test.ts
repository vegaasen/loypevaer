import { describe, it, expect } from "vitest";
import { describeWeatherCode } from "./wmo";

describe("describeWeatherCode", () => {
  it("returns Klarvær for code 0", () => {
    expect(describeWeatherCode(0)).toEqual({ label: "Klarvær", emoji: "☀️" });
  });

  it("returns Overskyet for code 3", () => {
    expect(describeWeatherCode(3)).toEqual({ label: "Overskyet", emoji: "☁️" });
  });

  it("returns Tordenvær for code 95", () => {
    expect(describeWeatherCode(95)).toEqual({ label: "Tordenvær", emoji: "⛈️" });
  });

  it("returns Kraftig snø for code 75", () => {
    expect(describeWeatherCode(75)).toEqual({ label: "Kraftig snø", emoji: "❄️" });
  });

  it("falls back gracefully for unknown codes", () => {
    const result = describeWeatherCode(999);
    expect(result.label).toBe("Kode 999");
    expect(result.emoji).toBe("🌡️");
  });

  it("falls back for negative codes", () => {
    const result = describeWeatherCode(-1);
    expect(result.label).toBe("Kode -1");
  });
});
