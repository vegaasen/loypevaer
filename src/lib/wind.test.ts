import { describe, expect, it } from "vitest";
import type { Waypoint } from "./weather";
import {
  bearingBetween,
  degreesToCompass,
  routeBearingForWaypoint,
  windRelativeLabel,
} from "./wind";

function wp(lat: number, lon: number): Waypoint {
  return { label: "test", lat, lon };
}

describe("bearingBetween", () => {
  it("returns ~0° (north) when moving due north", () => {
    const bearing = bearingBetween(wp(60, 10), wp(61, 10));
    expect(bearing).toBeCloseTo(0, 0);
  });

  it("returns ~90° (east) when moving due east", () => {
    const bearing = bearingBetween(wp(60, 10), wp(60, 11));
    // Great-circle bearing at lat 60° deviates slightly from 90°
    expect(bearing).toBeGreaterThan(88);
    expect(bearing).toBeLessThan(91);
  });

  it("returns ~180° (south) when moving due south", () => {
    const bearing = bearingBetween(wp(61, 10), wp(60, 10));
    expect(bearing).toBeCloseTo(180, 0);
  });

  it("returns a value in [0, 360)", () => {
    const b = bearingBetween(wp(59, 10), wp(60, 11));
    expect(b).toBeGreaterThanOrEqual(0);
    expect(b).toBeLessThan(360);
  });
});

describe("routeBearingForWaypoint", () => {
  const route: Waypoint[] = [wp(60, 10), wp(61, 10), wp(62, 10)];

  it("returns null for fewer than 2 waypoints", () => {
    expect(routeBearingForWaypoint([wp(60, 10)], 0)).toBeNull();
    expect(routeBearingForWaypoint([], 0)).toBeNull();
  });

  it("uses bearing toward next waypoint for non-last points", () => {
    const b0 = routeBearingForWaypoint(route, 0);
    const b1 = routeBearingForWaypoint(route, 1);
    expect(b0).not.toBeNull();
    expect(b1).not.toBeNull();
    // All going north, so ~0°
    expect(b0!).toBeCloseTo(0, 0);
  });

  it("uses bearing from previous waypoint for the last waypoint", () => {
    const bLast = routeBearingForWaypoint(route, 2);
    expect(bLast).not.toBeNull();
    expect(bLast!).toBeCloseTo(0, 0); // same direction as the rest of the northward route
  });
});

describe("windRelativeLabel", () => {
  it("returns Medvind for tailwind (wind coming from behind)", () => {
    // Route going north (0°), wind from south (180° = wind blowing north = tailwind)
    expect(windRelativeLabel(180, 0)).toBe("Medvind");
  });

  it("returns Motvind for headwind (wind coming from ahead)", () => {
    // Route going north (0°), wind from north (0° = wind blowing south = headwind)
    expect(windRelativeLabel(0, 0)).toBe("Motvind");
  });

  it("returns Sidevind for crosswind", () => {
    // Route going north (0°), wind from west (270° = blowing east = crosswind)
    expect(windRelativeLabel(270, 0)).toBe("Sidevind");
  });

  it("boundary: exactly 45° diff is Medvind", () => {
    // windTo = 45°, routeBearing = 0° → diff = 45 → Medvind
    expect(windRelativeLabel(225, 0)).toBe("Medvind");
  });

  it("boundary: exactly 135° diff is Motvind", () => {
    // windTo = 135°, routeBearing = 0° → diff = 135 → Motvind
    expect(windRelativeLabel(315, 0)).toBe("Motvind");
  });
});

describe("degreesToCompass", () => {
  it("returns N for 0°", () => {
    expect(degreesToCompass(0)).toBe("N");
  });

  it("returns Ø for 90°", () => {
    expect(degreesToCompass(90)).toBe("Ø");
  });

  it("returns S for 180°", () => {
    expect(degreesToCompass(180)).toBe("S");
  });

  it("returns V for 270°", () => {
    expect(degreesToCompass(270)).toBe("V");
  });

  it("returns NØ for 45°", () => {
    expect(degreesToCompass(45)).toBe("NØ");
  });

  it("returns ? for non-finite input", () => {
    expect(degreesToCompass(NaN)).toBe("?");
    expect(degreesToCompass(Infinity)).toBe("?");
  });
});
