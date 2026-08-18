import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useMyEvents } from "./useMyEvents";

const entry = { date: "2025-06-15", startTime: "09:00", finishTime: "12:00" };

describe("useMyEvents — callback stability", () => {
  it("add reference is stable across multiple store updates", () => {
    const { result } = renderHook(() => useMyEvents());

    const addBefore = result.current.add;

    act(() => {
      result.current.add("event-1", entry);
    });
    act(() => {
      result.current.add("event-2", entry);
    });

    expect(result.current.add).toBe(addBefore);
  });

  it("remove reference is stable across multiple store updates", () => {
    const { result } = renderHook(() => useMyEvents());

    act(() => {
      result.current.add("event-1", entry);
    });

    const removeBefore = result.current.remove;

    act(() => {
      result.current.remove("event-1");
    });
    act(() => {
      result.current.add("event-3", entry);
    });

    expect(result.current.remove).toBe(removeBefore);
  });

  it("add correctly persists data using latest store state", () => {
    const { result } = renderHook(() => useMyEvents());

    act(() => {
      result.current.add("event-1", entry);
    });
    act(() => {
      result.current.add("event-2", { ...entry, date: "2025-07-20" });
    });

    expect(result.current.plannedIds).toContain("event-1");
    expect(result.current.plannedIds).toContain("event-2");
  });
});
