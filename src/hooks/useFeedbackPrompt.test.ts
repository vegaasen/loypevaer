// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFeedbackPrompt } from "./useFeedbackPrompt";

const STORAGE_KEY = "loypevaer:feedback-last-shown";

// Mock react-router-dom useLocation
vi.mock("react-router-dom", () => ({
  useLocation: vi.fn(),
}));

import { useLocation } from "react-router-dom";

const mockUseLocation = vi.mocked(useLocation);

// Provide a working localStorage in environments where it may be unavailable (Node 26+)
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
vi.stubGlobal("localStorage", localStorageMock);

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("useFeedbackPrompt", () => {
  it("returns visible=true when arriving from / and no cooldown", () => {
    mockUseLocation.mockReturnValue({
      state: { from: "/" },
      pathname: "/arrangement/test",
      search: "",
      hash: "",
      key: "default",
    });

    const { result } = renderHook(() => useFeedbackPrompt());
    expect(result.current.visible).toBe(true);
  });

  it("returns visible=true when arriving from /lop and no cooldown", () => {
    mockUseLocation.mockReturnValue({
      state: { from: "/lop" },
      pathname: "/arrangement/test",
      search: "",
      hash: "",
      key: "default",
    });

    const { result } = renderHook(() => useFeedbackPrompt());
    expect(result.current.visible).toBe(true);
  });

  it("returns visible=false when no router state", () => {
    mockUseLocation.mockReturnValue({
      state: null,
      pathname: "/arrangement/test",
      search: "",
      hash: "",
      key: "default",
    });

    const { result } = renderHook(() => useFeedbackPrompt());
    expect(result.current.visible).toBe(false);
  });

  it("returns visible=false when arriving from an unrelated route", () => {
    mockUseLocation.mockReturnValue({
      state: { from: "/gpx" },
      pathname: "/arrangement/test",
      search: "",
      hash: "",
      key: "default",
    });

    const { result } = renderHook(() => useFeedbackPrompt());
    expect(result.current.visible).toBe(false);
  });

  it("returns visible=false within 30-day cooldown", () => {
    const recent = new Date();
    recent.setDate(recent.getDate() - 5); // 5 days ago
    localStorage.setItem(STORAGE_KEY, recent.toISOString());

    mockUseLocation.mockReturnValue({
      state: { from: "/" },
      pathname: "/arrangement/test",
      search: "",
      hash: "",
      key: "default",
    });

    const { result } = renderHook(() => useFeedbackPrompt());
    expect(result.current.visible).toBe(false);
  });

  it("returns visible=true after 30-day cooldown has expired", () => {
    const old = new Date();
    old.setDate(old.getDate() - 31); // 31 days ago
    localStorage.setItem(STORAGE_KEY, old.toISOString());

    mockUseLocation.mockReturnValue({
      state: { from: "/" },
      pathname: "/arrangement/test",
      search: "",
      hash: "",
      key: "default",
    });

    const { result } = renderHook(() => useFeedbackPrompt());
    expect(result.current.visible).toBe(true);
  });

  it("writes timestamp to localStorage when visible=true", () => {
    mockUseLocation.mockReturnValue({
      state: { from: "/" },
      pathname: "/arrangement/test",
      search: "",
      hash: "",
      key: "default",
    });

    renderHook(() => useFeedbackPrompt());
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
  });

  it("dismiss() sets visible to false", () => {
    mockUseLocation.mockReturnValue({
      state: { from: "/" },
      pathname: "/arrangement/test",
      search: "",
      hash: "",
      key: "default",
    });

    const { result } = renderHook(() => useFeedbackPrompt());
    expect(result.current.visible).toBe(true);
    act(() => { result.current.dismiss(); });
    expect(result.current.visible).toBe(false);
  });
});
