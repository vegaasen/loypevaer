# Git Commit Convention — Løypevær

Use this skill whenever you are about to write a commit message for this repository.

## Convention

```
<type>(<scope>): <subject>
```

- **type** — required; see the full list below.
- **scope** — optional; parenthesised short identifier of what changed.
- **subject** — required; imperative mood, lowercase, ≤ 72 chars, no trailing period.

## Types

| Type | Changelog visible | When to use |
|------|:-----------------:|-------------|
| `feat` | ✅ | A new feature or capability added to the app or its data. |
| `fix` | ✅ | A bug fix or correction (wrong data, broken UI, incorrect calculation). |
| `chore` | ❌ | Routine maintenance: dependency bumps, CI tweaks, config changes. |
| `data` | ❌ | Automated data refresh (weather cache, event lists). Usually written by bots. |
| `refactor` | ❌ | Code restructuring with no observable behaviour change. |
| `docs` | ❌ | Documentation-only changes (README, CONTEXT.md, ADRs, comments). |

> **Only `feat` and `fix` appear in the auto-generated changelog** (`/endringslogg`).
> Choose them deliberately — they signal to users that something meaningful changed.

## Scope examples

Scopes are short, lowercase, and map to a domain concept or file area:

| Scope | Examples of commits |
|-------|---------------------|
| `birkebeiner` | Waypoint updates, data corrections for Birkebeinerrittet |
| `triathlon` | Changes to triathlon event fetching or display |
| `langrenn` | Additions to `arrangements.json` for cross-country ski events |
| `ultraløp` | Changes affecting ultra-running events |
| `weather` | Weather card, cache, or API integration changes |
| `sitemap` | Changes to `generate-sitemap.ts` or sitemap output |
| `changelog` | Changes to the changelog generator or `/endringslogg` page |
| `footer` | Changes to `SiteFooter.tsx` |
| `gpx` | GPX upload or waypoint enrichment scripts |
| `ci` | GitHub Actions workflow changes |
| `infra` | Terraform / AWS infrastructure changes |

## Subject line rules

1. Imperative mood: "add waypoints" not "added waypoints" or "adds waypoints"
2. Lowercase first letter
3. ≤ 72 characters total (type + scope + subject)
4. No trailing period
5. Describe *what*, not *why* (the body is for why)

## Type disambiguation guide

**`feat` vs `chore` when adding a new script:**
- New capability that users benefit from → `feat`
- Internal tooling with no user-facing effect → `chore`

**`feat` vs `data` when adding events:**
- Hand-curated entry added to `arrangements.json` → `feat(langrenn)` or similar
- Automated refresh of auto-generated JSON files → `data`

**`fix` vs `refactor`:**
- Something was wrong and is now correct → `fix`
- Something worked but the code was messy → `refactor`

## Examples

```
feat(birkebeiner): add 5 waypoints from GPX route
fix(weather): correct altitude lookup for high-altitude waypoints
feat: add /endringslogg page with changelog history
fix(triathlon): update Norseman start time for 2026
chore: bump vitest to 3.2.0
data: refresh triathlon events [2026-06-16]
docs: add ADR for conventional commits
refactor(weather): extract hourly formatter to lib/weather.hourly.ts
```

## Breaking changes

For breaking changes, add `!` after the type/scope and add a `BREAKING CHANGE:` footer:

```
feat(api)!: replace Open-Meteo v1 endpoint with v2

BREAKING CHANGE: Response shape changed; cache must be cleared.
```
