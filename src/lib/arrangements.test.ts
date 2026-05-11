import { describe, it, expect } from "vitest";
import { getNextPerDiscipline } from "./arrangements";
import type { RittEntry } from "./arrangements";

function makeEvent(overrides: Partial<RittEntry> & Pick<RittEntry, "id" | "discipline" | "officialDate">): RittEntry {
  return {
    name: overrides.id,
    distance: 100,
    region: "Test",
    waypoints: [],
    ...overrides,
  };
}

const NOW = new Date("2026-05-11T12:00:00");

describe("getNextPerDiscipline", () => {
  it("returns one event per discipline, sorted by date ascending", () => {
    const events = [
      makeEvent({ id: "a", discipline: "landevei", officialDate: "2026-06-01" }),
      makeEvent({ id: "b", discipline: "terreng", officialDate: "2026-05-20" }),
      makeEvent({ id: "c", discipline: "landevei", officialDate: "2026-05-15" }),
    ];
    const result = getNextPerDiscipline(events, NOW);
    expect(result.map((e) => e.id)).toEqual(["c", "b"]);
  });

  it("excludes past events", () => {
    const events = [
      makeEvent({ id: "past", discipline: "landevei", officialDate: "2026-01-01" }),
      makeEvent({ id: "future", discipline: "landevei", officialDate: "2026-06-01" }),
    ];
    const result = getNextPerDiscipline(events, NOW);
    expect(result.map((e) => e.id)).toEqual(["future"]);
  });

  it("excludes cancelled events", () => {
    const events = [
      makeEvent({ id: "cancelled", discipline: "landevei", officialDate: "2026-06-01", dateStatus: "cancelled" }),
      makeEvent({ id: "ok", discipline: "landevei", officialDate: "2026-07-01" }),
    ];
    const result = getNextPerDiscipline(events, NOW);
    expect(result.map((e) => e.id)).toEqual(["ok"]);
  });

  it("excludes løping and cx disciplines", () => {
    const events = [
      makeEvent({ id: "run", discipline: "løping", officialDate: "2026-06-01" }),
      makeEvent({ id: "cx", discipline: "cx", officialDate: "2026-06-01" }),
      makeEvent({ id: "ski", discipline: "langrenn", officialDate: "2026-06-01" }),
    ];
    const result = getNextPerDiscipline(events, NOW);
    expect(result.map((e) => e.id)).toEqual(["ski"]);
  });

  it("caps output at 7 entries", () => {
    const disciplines = ["landevei", "terreng", "langrenn", "triathlon", "ultraløp"] as const;
    const events = [];
    for (let i = 0; i < 10; i++) {
      events.push(
        makeEvent({
          id: `e${i}`,
          discipline: disciplines[i % disciplines.length],
          officialDate: `2026-06-${String(i + 1).padStart(2, "0")}`,
        })
      );
    }
    const result = getNextPerDiscipline(events, NOW);
    expect(result.length).toBeLessThanOrEqual(7);
  });

  it("returns empty array when no upcoming events exist", () => {
    const events = [
      makeEvent({ id: "old", discipline: "landevei", officialDate: "2025-01-01" }),
    ];
    const result = getNextPerDiscipline(events, NOW);
    expect(result).toEqual([]);
  });

  it("includes today's events", () => {
    const events = [
      makeEvent({ id: "today", discipline: "landevei", officialDate: "2026-05-11" }),
    ];
    const result = getNextPerDiscipline(events, NOW);
    expect(result.map((e) => e.id)).toEqual(["today"]);
  });
});
