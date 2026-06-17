import { describe, it, expect } from "vitest";
import { parseCommitLine, parseGitLog } from "./generate-changelog";

describe("parseCommitLine", () => {
  it("parses a feat commit without scope", () => {
    const result = parseCommitLine("feat: add dark mode toggle");
    expect(result).toEqual({ type: "feat", scope: null, subject: "add dark mode toggle" });
  });

  it("parses a fix commit without scope", () => {
    const result = parseCommitLine("fix: correct altitude for Jotunheimen");
    expect(result).toEqual({ type: "fix", scope: null, subject: "correct altitude for Jotunheimen" });
  });

  it("parses a feat commit with scope", () => {
    const result = parseCommitLine("feat(birkebeiner): add waypoints");
    expect(result).toEqual({ type: "feat", scope: "birkebeiner", subject: "add waypoints" });
  });

  it("parses a fix commit with scope", () => {
    const result = parseCommitLine("fix(triathlon): update start time for Norseman");
    expect(result).toEqual({ type: "fix", scope: "triathlon", subject: "update start time for Norseman" });
  });

  it("returns null for chore commits", () => {
    expect(parseCommitLine("chore: bump dependencies")).toBeNull();
  });

  it("returns null for bare commits without prefix", () => {
    expect(parseCommitLine("Update README")).toBeNull();
  });

  it("returns null for data: commits", () => {
    expect(parseCommitLine("data: refresh cycling events")).toBeNull();
  });

  it("does not split on a colon inside the subject", () => {
    const result = parseCommitLine("feat: add Oslo: the city");
    expect(result).toEqual({ type: "feat", scope: null, subject: "add Oslo: the city" });
  });
});

describe("parseGitLog", () => {
  const makeLine = (sha: string, date: string, subject: string) => `${sha}\n${date}\n${subject}`;

  it("filters out non-feat/fix commits", () => {
    const raw = [
      makeLine("aaa0001aaa0001aaa0001aaa0001aaa0001aaa001", "2025-01-01", "feat: add race page"),
      makeLine("bbb0002bbb0002bbb0002bbb0002bbb0002bbb002", "2025-01-02", "chore: update ci"),
      makeLine("ccc0003ccc0003ccc0003ccc0003ccc0003ccc003", "2025-01-03", "fix: correct distance"),
      makeLine("ddd0004ddd0004ddd0004ddd0004ddd0004ddd004", "2025-01-04", "Merge pull request #1"),
    ].join("\n");

    const result = parseGitLog(raw);
    expect(result).toHaveLength(2);
    expect(result[0].type).toBe("feat");
    expect(result[1].type).toBe("fix");
  });

  it("limits output to 100 entries", () => {
    const lines: string[] = [];
    for (let i = 0; i < 110; i++) {
      const sha = `${"a".repeat(37)}${String(i).padStart(3, "0")}`;
      lines.push(makeLine(sha, "2025-01-01", `feat: entry ${i}`));
    }
    const result = parseGitLog(lines.join("\n"));
    expect(result).toHaveLength(100);
  });

  it("extracts shortSha as first 7 characters", () => {
    const sha = "abc1234def5678abc1234def5678abc1234def56";
    const raw = makeLine(sha, "2025-03-10", "feat: new feature");
    const result = parseGitLog(raw);
    expect(result[0].shortSha).toBe("abc1234");
  });

  it("builds correct githubUrl", () => {
    const sha = "abc1234def5678abc1234def5678abc1234def56";
    const raw = makeLine(sha, "2025-03-10", "fix: minor bug");
    const result = parseGitLog(raw);
    expect(result[0].githubUrl).toBe(`https://github.com/vegaasen/loypevaer/commit/${sha}`);
  });

  it("returns empty array when no feat/fix commits exist", () => {
    const raw = [
      makeLine("aaa0001aaa0001aaa0001aaa0001aaa0001aaa001", "2025-01-01", "chore: update deps"),
      makeLine("bbb0002bbb0002bbb0002bbb0002bbb0002bbb002", "2025-01-02", "docs: add readme"),
    ].join("\n");
    const result = parseGitLog(raw);
    expect(result).toHaveLength(0);
  });

  it("parses scope from scoped commit", () => {
    const sha = "abc1234def5678abc1234def5678abc1234def56";
    const raw = makeLine(sha, "2025-05-01", "feat(birkebeiner): add waypoints");
    const result = parseGitLog(raw);
    expect(result[0].scope).toBe("birkebeiner");
    expect(result[0].subject).toBe("add waypoints");
  });

  it("sets scope to null for unscoped commit", () => {
    const sha = "abc1234def5678abc1234def5678abc1234def56";
    const raw = makeLine(sha, "2025-05-01", "fix: correct altitude for Jotunheimen");
    const result = parseGitLog(raw);
    expect(result[0].scope).toBeNull();
  });
});
