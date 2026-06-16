# ADR 0001 — Conventional Commits as Changelog Curation Mechanism

**Date:** 2026-06-16
**Status:** Accepted
**Deciders:** Vegard Aasen

---

## Context

Løypevær needs a human-readable history of notable changes for returning visitors ("what's new?"). The page should update automatically — requiring no manual editing step — while still filtering out noise (CI tweaks, dependency bumps, automated data refreshes).

Two curation mechanisms were considered:

1. **Manual curation** — a hand-edited `changelog.json` where the author writes a description per entry.
2. **Commit-time opt-in via conventional commits** — a script parses git log and includes only commits prefixed with `feat:` or `fix:`.

A third option (post-generation editing) was rejected as it combines the worst of both: automation friction without the benefits of full automation.

---

## Decision

Use **conventional commits** as the sole curation mechanism:

- Commits prefixed `feat:` or `fix:` are included in the changelog.
- All other prefixes (`chore:`, `data:`, `refactor:`, `docs:`, bare commits) are excluded.
- `scripts/generate-changelog.ts` reads `git log`, filters, and writes `src/data/changelog.json`.
- A GitHub Actions workflow regenerates the file on every push to `main`.
- No manual editing of `changelog.json` is ever required or expected.

---

## Consequences

### What becomes easier

- The changelog is always consistent with the actual codebase — no drift between the JSON and reality.
- AI agents (Junie, Copilot) can write correct commit messages using the `.junie/skills/git-commit` skill, making curation happen at commit time without extra steps.
- The mechanism is self-documenting: reading the git log reveals the same information as the changelog page.

### What becomes harder or different

- **Changing the filter** (e.g., adding `data:` as changelog-visible) requires updating the script regex and re-running the generator — a low-effort but non-zero change.
- **Retroactive curation** is impossible without rewriting git history: an important change committed as `chore:` will never appear in the changelog unless the commit is amended.
- **Commit discipline is required**: the quality of the changelog depends entirely on well-written `feat:` and `fix:` messages. Poor message hygiene produces a poor changelog.

### Hard to reverse

This decision is moderately hard to reverse. Switching to a different mechanism (e.g., manual curation) would require:
1. Migrating existing `changelog.json` entries.
2. Retiring the generator script and workflow.
3. Updating `CONTEXT.md` and this ADR.

The conventional commit prefixes themselves are standard and widely understood — adopting them has no switching cost if we later want tooling (e.g., `semantic-release`, `release-please`) that also consumes them.

---

## Alternatives considered

| Option | Why rejected |
|--------|-------------|
| Manual JSON editing | High friction for automation; easy to forget; inconsistent with CI-generated data files pattern |
| `Changelog: <message>` trailer | Non-standard; not understood by existing tools; harder to enforce |
| Full git log (no filter) | Too noisy; bot commits (`data:`, `chore:`) dominate the history |
| Time-bounded (last 6 months) | Arbitrary cutoff; 50-entry limit is simpler and more predictable |
