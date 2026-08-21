import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { trackFeedback, trackUserSuggestion } from "./analytics";

let gtagSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  gtagSpy = vi.fn();
  vi.stubGlobal("gtag", gtagSpy);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("trackUserSuggestion", () => {
  it("fires user_suggestion event with truncated text and page_path", () => {
    trackUserSuggestion("a".repeat(200), "/arrangement/birken");
    expect(gtagSpy).toHaveBeenCalledWith("event", "user_suggestion", {
      suggestion_text: "a".repeat(100),
      page_path: "/arrangement/birken",
    });
  });

  it("passes through text under 100 chars unchanged", () => {
    trackUserSuggestion("short text", "/arrangement/birken");
    expect(gtagSpy).toHaveBeenCalledWith("event", "user_suggestion", {
      suggestion_text: "short text",
      page_path: "/arrangement/birken",
    });
  });

  it("is a no-op when gtag is undefined", () => {
    vi.unstubAllGlobals();
    expect(() => trackUserSuggestion("hello", "/")).not.toThrow();
  });
});

describe("trackFeedback", () => {
  it("fires user_feedback event with feedback_value and event_id", () => {
    trackFeedback(5, "birken-2025");
    expect(gtagSpy).toHaveBeenCalledWith("event", "user_feedback", {
      feedback_value: 5,
      event_id: "birken-2025",
    });
  });

  it("fires user_feedback event with negative feedback value", () => {
    trackFeedback(1, "birken-2025");
    expect(gtagSpy).toHaveBeenCalledWith("event", "user_feedback", {
      feedback_value: 1,
      event_id: "birken-2025",
    });
  });

  it("is a no-op when gtag is undefined", () => {
    vi.unstubAllGlobals();
    expect(() => trackFeedback(5, "birken-2025")).not.toThrow();
  });
});
