import { describe, expect, it } from "vitest";
import { getWaxTips } from "../waxTips";

describe("getWaxTips", () => {
  it("recommends cold-weather grip and glide wax for deep freeze", () => {
    const tips = getWaxTips(-18, -12);
    expect(tips.grip.label).toContain("Grønn");
    expect(tips.glide.label).toContain("Kald");
  });

  it("recommends klister near/above freezing", () => {
    const tips = getWaxTips(0.5, 2);
    expect(tips.grip.label.toLowerCase()).toContain("klister");
  });

  it("recommends warm glide wax for spring conditions", () => {
    const tips = getWaxTips(2, 6);
    expect(tips.glide.label).toContain("Varm");
  });

  it("flags a wide temperature range along the course", () => {
    const tips = getWaxTips(-10, -2);
    expect(tips.wideRange).toBe(true);
  });

  it("does not flag a narrow temperature range", () => {
    const tips = getWaxTips(-5, -3);
    expect(tips.wideRange).toBe(false);
  });
});
