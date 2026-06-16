import { describe, it, expect } from "vitest";
import { calcWaypointTimes, formatArrivalTime, calcFinishTimeFromSpeed } from "./timing";

describe("calcWaypointTimes", () => {
  it("returns the start time for fraction 0", () => {
    const result = calcWaypointTimes("2026-06-19", "09:00", "12:00", [0]);
    expect(result[0]).toBe("2026-06-19T09:00");
  });

  it("returns the finish time for fraction 1", () => {
    const result = calcWaypointTimes("2026-06-19", "09:00", "12:00", [1]);
    expect(result[0]).toBe("2026-06-19T12:00");
  });

  it("interpolates mid-race waypoints correctly", () => {
    // 09:00 to 13:00 = 240 min; 0.5 = 120 min = 11:00
    const result = calcWaypointTimes("2026-06-19", "09:00", "13:00", [0.5]);
    expect(result[0]).toBe("2026-06-19T11:00");
  });

  it("rounds waypoint times to the nearest hour", () => {
    // 09:00 to 10:30 = 90 min; 0.5 = 45 min = 09:45, rounds to 10:00
    const result = calcWaypointTimes("2026-06-19", "09:00", "10:30", [0.5]);
    expect(result[0]).toBe("2026-06-19T10:00");
  });

  describe("midnight-crossing races", () => {
    // Jotunheimen-rundt scenario: start 21:41, finish 19:11 next day (≈21.5 h)
    const date = "2026-06-19";
    const start = "21:41";
    const finish = "19:11";

    it("keeps fraction 0 on the start date", () => {
      const [dt] = calcWaypointTimes(date, start, finish, [0]);
      expect(dt.startsWith("2026-06-19")).toBe(true);
    });

    it("places post-midnight waypoints on the NEXT calendar day (2026-06-20), not start date", () => {
      // fraction 0.25 ≈ 21:41 + 5.4 h = 03:05 → rounds to 03:00 on 2026-06-20
      const [dt] = calcWaypointTimes(date, start, finish, [0.25]);
      expect(dt).toBe("2026-06-20T03:00");
    });

    it("produces the correct date for all 5 waypoints in a midnight-crossing race", () => {
      const result = calcWaypointTimes(date, start, finish, [0, 0.25, 0.5, 0.75, 1.0]);
      // fraction 0: 21:41 → 2026-06-19T22:00
      expect(result[0]).toBe("2026-06-19T22:00");
      // fraction 0.25: 21:41 + 322.5 min = 03:03.5 next day → 2026-06-20T03:00
      expect(result[1]).toBe("2026-06-20T03:00");
      // fraction 0.5: 21:41 + 645 min = 08:26 next day → 2026-06-20T08:00
      expect(result[2]).toBe("2026-06-20T08:00");
      // fraction 0.75: 21:41 + 967.5 min = 13:49.5 next day → 2026-06-20T14:00
      expect(result[3]).toBe("2026-06-20T14:00");
      // fraction 1: 21:41 + 1290 min = 19:11 next day → 2026-06-20T19:00
      expect(result[4]).toBe("2026-06-20T19:00");
    });

    it("handles a race crossing midnight from 23:00 to 01:00 (2-hour race)", () => {
      const result = calcWaypointTimes("2025-12-31", "23:00", "01:00", [0, 0.5, 1.0]);
      expect(result[0]).toBe("2025-12-31T23:00");
      expect(result[1]).toBe("2026-01-01T00:00");
      expect(result[2]).toBe("2026-01-01T01:00");
    });
  });
});

describe("formatArrivalTime", () => {
  it("extracts the time portion from a datetime string", () => {
    expect(formatArrivalTime("2026-06-19T14:00")).toBe("14:00");
  });
});

describe("calcFinishTimeFromSpeed", () => {
  it("computes finish time for a simple 60 km race at 30 km/h (2 hours)", () => {
    expect(calcFinishTimeFromSpeed("09:00", 60, 30)).toBe("11:00");
  });

  it("wraps past-midnight finish times back to HH:MM within 00:00–23:59", () => {
    // 23:00 + 3 hours = 02:00 (next day), wrapped to 02:00
    expect(calcFinishTimeFromSpeed("23:00", 90, 30)).toBe("02:00");
  });
});
