import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { daysUntil, formatCountdown, parseDateLocal } from "./dates";

describe("parseDateLocal", () => {
  it("parses a YYYY-MM-DD string as local midnight", () => {
    const d = parseDateLocal("2025-08-23");
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(7); // 0-indexed August
    expect(d.getDate()).toBe(23);
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
  });

  it("returns a Date instance", () => {
    expect(parseDateLocal("2025-01-01")).toBeInstanceOf(Date);
  });
});

describe("daysUntil + formatCountdown", () => {
  // Pin "today" to 2025-08-10 for deterministic tests
  const TODAY = new Date("2025-08-10T00:00:00");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(TODAY);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("daysUntil", () => {
    it("returns 0 for today", () => {
      expect(daysUntil("2025-08-10")).toBe(0);
    });

    it("returns 1 for tomorrow", () => {
      expect(daysUntil("2025-08-11")).toBe(1);
    });

    it("returns -1 for yesterday", () => {
      expect(daysUntil("2025-08-09")).toBe(-1);
    });

    it("returns positive number for a future date", () => {
      expect(daysUntil("2025-08-20")).toBe(10);
    });

    it("returns negative number for a past date", () => {
      expect(daysUntil("2025-07-31")).toBe(-10);
    });
  });

  describe("formatCountdown", () => {
    it("returns 'i dag' for today", () => {
      expect(formatCountdown("2025-08-10")).toBe("i dag");
    });

    it("returns 'i morgen' for tomorrow", () => {
      expect(formatCountdown("2025-08-11")).toBe("i morgen");
    });

    it("returns 'i går' for yesterday", () => {
      expect(formatCountdown("2025-08-09")).toBe("i går");
    });

    it("returns 'om N dager' for future dates", () => {
      expect(formatCountdown("2025-08-20")).toBe("om 10 dager");
    });

    it("returns 'N dager siden' for past dates", () => {
      expect(formatCountdown("2025-07-31")).toBe("10 dager siden");
    });
  });
});
