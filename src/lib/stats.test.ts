import { describe, expect, it } from "vitest";
import { avg, mode } from "./stats";

describe("avg", () => {
  it("returns the average of a plain number array", () => {
    expect(avg([1, 2, 3])).toBe(2);
  });

  it("ignores null and undefined entries", () => {
    expect(avg([1, null, 3, undefined])).toBe(2);
  });

  it("returns null for an empty array", () => {
    expect(avg([])).toBeNull();
  });

  it("returns null when all values are nullish", () => {
    expect(avg([null, undefined])).toBeNull();
  });

  it("handles a single value", () => {
    expect(avg([42])).toBe(42);
  });

  it("handles negative numbers", () => {
    expect(avg([-2, 0, 2])).toBe(0);
  });
});

describe("mode", () => {
  it("returns the most frequent value", () => {
    expect(mode([1, 2, 2, 3])).toBe(2);
  });

  it("returns undefined for empty array", () => {
    expect(mode([])).toBeUndefined();
  });

  it("works with a single element", () => {
    expect(mode([7])).toBe(7);
  });

  it("works with strings", () => {
    expect(mode(["a", "b", "a"])).toBe("a");
  });

  it("returns one of the tied values when tied", () => {
    // Both 1 and 2 appear once — result is whichever comes first in iteration
    const result = mode([1, 2]);
    expect([1, 2]).toContain(result);
  });
});
