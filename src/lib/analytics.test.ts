import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("trackUserSuggestion", () => {
  beforeEach(() => {
    vi.stubGlobal("gtag", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fires user_suggestion event with truncated text and page_path", async () => {
    const { trackUserSuggestion } = await import("./analytics");
    trackUserSuggestion("a".repeat(200), "/arrangement/birken");
    expect(gtag).toHaveBeenCalledWith("event", "user_suggestion", {
      suggestion_text: "a".repeat(100),
      page_path: "/arrangement/birken",
    });
  });

  it("is a no-op when gtag is undefined", async () => {
    vi.unstubAllGlobals();
    const { trackUserSuggestion } = await import("./analytics");
    expect(() => trackUserSuggestion("hello", "/")).not.toThrow();
  });
});
