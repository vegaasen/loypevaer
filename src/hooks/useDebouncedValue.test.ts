import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDebouncedValue } from "./useDebouncedValue";

describe("useDebouncedValue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the initial value synchronously", () => {
    const { result } = renderHook(() => useDebouncedValue("initial", 150));
    expect(result.current).toBe("initial");
  });

  it("does not update the value synchronously when input changes", () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 150), {
      initialProps: { value: "first" },
    });

    rerender({ value: "second" });
    expect(result.current).toBe("first");
  });

  it("updates the value after the delay has elapsed", () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 150), {
      initialProps: { value: "first" },
    });

    rerender({ value: "second" });

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(result.current).toBe("second");
  });

  it("resets the timer when value changes before delay elapses", () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 150), {
      initialProps: { value: "first" },
    });

    rerender({ value: "second" });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    rerender({ value: "third" });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Only 100ms have elapsed since the last change — should not update yet
    expect(result.current).toBe("first");

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(result.current).toBe("third");
  });
});
