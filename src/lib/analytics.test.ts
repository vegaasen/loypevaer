import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { trackFeedback } from "./analytics";

describe("trackFeedback", () => {
  let gtagSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    gtagSpy = vi.fn();
    vi.stubGlobal("gtag", gtagSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fires user_feedback with value 5 and event_id for thumbs up", () => {
    trackFeedback(5, "birken-2025");
    expect(gtagSpy).toHaveBeenCalledWith("event", "user_feedback", {
      feedback_value: 5,
      event_id: "birken-2025",
    });
  });

  it("fires user_feedback with value 1 for thumbs down", () => {
    trackFeedback(1, "birken-2025");
    expect(gtagSpy).toHaveBeenCalledWith("event", "user_feedback", {
      feedback_value: 1,
      event_id: "birken-2025",
    });
  });

  it("is a no-op when gtag is undefined", () => {
    vi.unstubAllGlobals();
    expect(() => trackFeedback(5, "test")).not.toThrow();
  });
});
