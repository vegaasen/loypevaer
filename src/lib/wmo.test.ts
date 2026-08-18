import { describe, expect, it } from "vitest";
import { yrSymbolToWmo } from "./wmo";

describe("yrSymbolToWmo", () => {
  it("maps clearsky_day to WMO 0", () => {
    expect(yrSymbolToWmo("clearsky_day")).toBe(0);
  });

  it("maps clearsky_night to WMO 0", () => {
    expect(yrSymbolToWmo("clearsky_night")).toBe(0);
  });

  it("maps fair_day to WMO 1", () => {
    expect(yrSymbolToWmo("fair_day")).toBe(1);
  });

  it("maps partlycloudy_day to WMO 2", () => {
    expect(yrSymbolToWmo("partlycloudy_day")).toBe(2);
  });

  it("maps cloudy (no suffix) to WMO 3", () => {
    expect(yrSymbolToWmo("cloudy")).toBe(3);
  });

  it("maps fog to WMO 45", () => {
    expect(yrSymbolToWmo("fog")).toBe(45);
  });

  it("maps lightrain to WMO 61", () => {
    expect(yrSymbolToWmo("lightrain")).toBe(61);
  });

  it("maps rain to WMO 63", () => {
    expect(yrSymbolToWmo("rain")).toBe(63);
  });

  it("maps heavyrain to WMO 65", () => {
    expect(yrSymbolToWmo("heavyrain")).toBe(65);
  });

  it("maps lightrainshowers_day to WMO 80", () => {
    expect(yrSymbolToWmo("lightrainshowers_day")).toBe(80);
  });

  it("maps rainshowers_night to WMO 81", () => {
    expect(yrSymbolToWmo("rainshowers_night")).toBe(81);
  });

  it("maps heavyrainshowers_day to WMO 82", () => {
    expect(yrSymbolToWmo("heavyrainshowers_day")).toBe(82);
  });

  it("maps lightsnow to WMO 71", () => {
    expect(yrSymbolToWmo("lightsnow")).toBe(71);
  });

  it("maps snow to WMO 73", () => {
    expect(yrSymbolToWmo("snow")).toBe(73);
  });

  it("maps heavysnow to WMO 75", () => {
    expect(yrSymbolToWmo("heavysnow")).toBe(75);
  });

  it("maps sleet to WMO 77", () => {
    expect(yrSymbolToWmo("sleet")).toBe(77);
  });

  it("maps thunder to WMO 95", () => {
    expect(yrSymbolToWmo("thunder")).toBe(95);
  });

  it("maps rainandthunder to WMO 95", () => {
    expect(yrSymbolToWmo("rainandthunder")).toBe(95);
  });

  it("strips _polartwilight suffix", () => {
    expect(yrSymbolToWmo("clearsky_polartwilight")).toBe(0);
  });

  it("returns 0 for unknown symbol code", () => {
    expect(yrSymbolToWmo("unknownweather")).toBe(0);
  });

  it("returns 0 for empty string", () => {
    expect(yrSymbolToWmo("")).toBe(0);
  });
});
