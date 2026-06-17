/**
 * Build-time script: generates src/data/changelog.json from git log.
 *
 * Reads the last 100 commits prefixed with `feat:` or `fix:` (conventional commits),
 * parses type, optional scope, and subject, and writes them as structured JSON.
 *
 * Usage:
 *   bun scripts/generate-changelog.ts
 *
 * Run automatically by .github/workflows/refresh-changelog.yml on every push to main.
 */

import { execSync } from "child_process";
import { writeFileSync } from "fs";
import { resolve } from "path";

import type { ChangelogEntry, Changelog } from "../src/data/changelog.types";

const REPO = "vegaasen/loypevaer";
const LIMIT = 100;
const GITHUB_BASE = `https://github.com/${REPO}/commit`;

export type { ChangelogEntry, Changelog };

// Matches: feat(scope): subject  or  fix: subject
const COMMIT_RE = /^(feat|fix)(\(([^)]+)\))?:\s+(.+)$/;

export function parseCommitLine(subject: string): Pick<ChangelogEntry, "type" | "scope" | "subject"> | null {
  const m = COMMIT_RE.exec(subject);
  if (!m) return null;
  return {
    type: m[1] as "feat" | "fix",
    scope: m[3] ?? null,
    subject: m[4],
  };
}

export function parseGitLog(raw: string): Changelog {
  const entries: Changelog = [];
  const lines = raw.split("\n").filter(Boolean);

  // git log outputs 3 lines per commit: sha, date, subject
  for (let i = 0; i + 2 < lines.length; i += 3) {
    const sha = lines[i].trim();
    const date = lines[i + 1].trim();
    const subject = lines[i + 2].trim();

    const parsed = parseCommitLine(subject);
    if (!parsed) continue;

    entries.push({
      sha,
      shortSha: sha.slice(0, 7),
      date,
      ...parsed,
      githubUrl: `${GITHUB_BASE}/${sha}`,
    });

    if (entries.length >= LIMIT) break;
  }

  return entries;
}

// Only run when executed directly (not when imported in tests)
if (import.meta.main) {
  const raw = execSync("git log --format=%H%n%as%n%s", { encoding: "utf-8" });
  const changelog = parseGitLog(raw);

  const outPath = resolve(import.meta.dirname, "../src/data/changelog.json");
  writeFileSync(outPath, JSON.stringify(changelog, null, 2) + "\n", "utf-8");
  console.log(`Changelog written to ${outPath} (${changelog.length} entries)`);
}
