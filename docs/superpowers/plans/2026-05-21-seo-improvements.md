# SEO Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve Google discoverability by fixing OG image tags, adding a `noindex` to the 404 page, and generating static HTML copies of all SPA routes at build time so Googlebot gets real files for each URL.

**Architecture:** The app is a pure-CSR Vite + React SPA deployed to S3 + CloudFront. CloudFront has a catch-all fallback (`/index.html`) for unknown paths. A postbuild Bun script will copy `dist/index.html` into subdirectory paths for every known route, so each URL resolves to a real HTML file rather than a redirect — no plugins, no headless browser required. OG image and Twitter card fixes are pure component edits.

**Tech Stack:** Bun, Vite 8, React 19, TypeScript strict, react-helmet-async, Vitest

---

## File Map

| Action | File | What changes |
|---|---|---|
| Modify | `src/components/PageMeta.tsx` | Fix OG image URL and twitter:card type |
| Modify | `src/pages/NotFoundPage.tsx` | Add `noindex` via PageMeta |
| Create | `scripts/copy-spa-routes.ts` | Postbuild script: copy index.html to all route paths |
| Modify | `package.json` | Add `postbuild` script entry |
| Create | `src/components/PageMeta.test.tsx` | Tests for PageMeta output |

---

## Task 1: Fix OG image and Twitter card in `PageMeta`

`PageMeta.tsx` currently uses `web-app-manifest-512x512.png` (a square PWA icon) as the OG image, and sets `twitter:card` to `"summary"` (small card). `index.html` references `og-image.png` at 1200×630 as the intended OG image, but that file doesn't exist yet.

For now, align everything to the 512×512 image (it exists, it works). Once a proper 1200×630 `og-image.png` is created and placed in `public/`, update the single `OG_IMAGE` constant — no other changes needed.

Also fix `index.html`, which currently references the non-existent `/og-image.png`.

**Files:**
- Modify: `src/components/PageMeta.tsx`
- Modify: `index.html`

- [ ] **Step 1: Update `PageMeta.tsx` — fix twitter:card to `summary_large_image`**

The OG image constant stays as-is (`web-app-manifest-512x512.png`). Only the card type changes:

```tsx
// src/components/PageMeta.tsx
import { Helmet } from "react-helmet-async";
import { SITE_URL } from "../lib/seo";

const OG_IMAGE = `${SITE_URL}/web-app-manifest-512x512.png`;

type Props = {
  title: string;
  description: string;
  canonicalUrl: string;
  /** Defaults to "website" */
  ogType?: "website" | "article";
};

/**
 * Renders the standard set of SEO meta tags shared across all pages:
 * - <title>
 * - meta description
 * - canonical link
 * - Open Graph: type, url, title, description, locale, image
 * - Twitter card: summary_large_image, title, description, image
 *
 * Page-specific extras (keywords, ld+json, etc.) should be added in a
 * separate <Helmet> block in the page component.
 */
export function PageMeta({ title, description, canonicalUrl, ogType = "website" }: Props) {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:locale" content="nb_NO" />
      <meta property="og:image" content={OG_IMAGE} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={OG_IMAGE} />
    </Helmet>
  );
}
```

- [ ] **Step 2: Fix `index.html` — point OG image to the existing file**

`index.html` has:
```html
<meta property="og:image" content="https://www.løypevær.no/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
```

Replace with:
```html
<meta property="og:image" content="https://www.løypevær.no/web-app-manifest-512x512.png" />
<meta property="og:image:width" content="512" />
<meta property="og:image:height" content="512" />
```

- [ ] **Step 3: Run lint and tests to verify no regressions**

```bash
bun run lint && bun run test
```

Expected: all checks pass, no type errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/PageMeta.tsx index.html
git commit -m "fix(seo): fix OG image URL and upgrade twitter:card to summary_large_image"
```

---

## Task 2: Add `noindex` to `NotFoundPage`

The 404 page currently sets only a title via `usePageTitle`. Google may crawl and index 404 URLs from old/broken links. It should be tagged `noindex, nofollow`.

**Files:**
- Modify: `src/pages/NotFoundPage.tsx`

- [ ] **Step 1: Replace `usePageTitle` with `PageMeta` + noindex Helmet block**

```tsx
// src/pages/NotFoundPage.tsx
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { PageMeta } from "../components/PageMeta";
import { SITE_URL } from "../lib/seo";

export function NotFoundPage() {
  return (
    <>
      <PageMeta
        title="Siden finnes ikke – Løypevær"
        description="Siden du leter etter finnes ikke."
        canonicalUrl={`${SITE_URL}/404`}
      />
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="ritt-page ritt-page--not-found">
        <h1>404</h1>
        <p>Siden finnes ikke.</p>
        <Link to="/">Tilbake til oversikt</Link>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Run lint and tests**

```bash
bun run lint && bun run test
```

Expected: all pass. If `usePageTitle` is now unused elsewhere, the linter will surface it — that's fine, it's still used on other pages.

- [ ] **Step 3: Commit**

```bash
git add src/pages/NotFoundPage.tsx
git commit -m "fix(seo): add noindex to 404 page"
```

---

## Task 3: Write `scripts/copy-spa-routes.ts`

This postbuild script copies `dist/index.html` into every known route path so CloudFront serves a real HTML file (rather than triggering the catch-all redirect) for each URL. No headless browser or plugin needed — the file content is the same for all routes; React Router handles rendering client-side after load.

**Files:**
- Create: `scripts/copy-spa-routes.ts`

- [ ] **Step 1: Create the script**

```ts
// scripts/copy-spa-routes.ts
/**
 * Postbuild script: copies dist/index.html into every known SPA route path.
 *
 * After a standard Vite build, CloudFront's catch-all rule serves index.html
 * for any unknown path. This script creates real files so each route has its
 * own index.html — better for Googlebot and avoids an extra redirect hop.
 *
 * Usage: bun scripts/copy-spa-routes.ts
 * Run automatically as postbuild via package.json.
 */

import { copyFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import { resolve, dirname } from "path";

import arrangements from "../src/data/arrangements.json" with { type: "json" };
import cyclingData from "../src/data/cycling-events.json" with { type: "json" };
import cyclingManual from "../src/data/cycling-manual.json" with { type: "json" };
import triathlonData from "../src/data/triathlon-events.json" with { type: "json" };
import runningData from "../src/data/running-events.json" with { type: "json" };

type HasId = { id: string };

const DIST = resolve(import.meta.dirname, "../dist");
const SRC = resolve(DIST, "index.html");

if (!existsSync(SRC)) {
  console.error(`ERROR: ${SRC} not found. Run 'bun run build' first.`);
  process.exit(1);
}

// Static routes (excluding "/" which is already dist/index.html)
const staticRoutes = [
  "hva-er-rittvaer",
  "lop",
  "gpx",
];

// All event IDs from every data source
const allEvents: HasId[] = [
  ...(arrangements as HasId[]),
  ...((cyclingData as { events: HasId[] }).events),
  ...((cyclingManual as { events: HasId[] }).events ?? (cyclingManual as HasId[])),
  ...((triathlonData as { events: HasId[] }).events),
  ...((runningData as { events: HasId[] }).events),
];

const eventRoutes = allEvents.map((e) => `arrangement/${e.id}`);

const allRoutes = [...staticRoutes, ...eventRoutes];

let copied = 0;
for (const route of allRoutes) {
  const destDir = resolve(DIST, route);
  const destFile = resolve(destDir, "index.html");
  mkdirSync(destDir, { recursive: true });
  copyFileSync(SRC, destFile);
  copied++;
}

console.log(`copy-spa-routes: copied index.html to ${copied} route paths in dist/`);
```

- [ ] **Step 2: Verify the script structure matches the JSON shapes**

Check that `cycling-manual.json` and `cycling-events.json` are either a plain array or `{ events: [...] }`.

```bash
bun -e "
import c from './src/data/cycling-events.json';
import m from './src/data/cycling-manual.json';
console.log('cycling-events shape:', Array.isArray(c) ? 'array' : Object.keys(c as object));
console.log('cycling-manual shape:', Array.isArray(m) ? 'array' : Object.keys(m as object));
"
```

If either is a plain array, remove the `.events` access for that source in the script. Update accordingly.

- [ ] **Step 3: Add `postbuild` to `package.json`**

In `package.json`, add after the `"build"` line:

```json
"postbuild": "bun scripts/copy-spa-routes.ts",
```

Full `scripts` block should look like:

```json
"scripts": {
  "dev": "vite",
  "prebuild": "bun scripts/generate-sitemap.ts",
  "build": "tsc -b && vite build",
  "postbuild": "bun scripts/copy-spa-routes.ts",
  "lint": "eslint .",
  "preview": "vite preview",
  ...
}
```

- [ ] **Step 4: Run a full build and verify output**

```bash
bun run build
```

Expected output includes a line like:
```
copy-spa-routes: copied index.html to NNN route paths in dist/
```

Then spot-check a few paths exist:

```bash
ls dist/arrangement/birkebeinerrittet/
ls dist/arrangement/norseman-xtreme-triathlon/
ls dist/hva-er-rittvaer/
ls dist/lop/
ls dist/gpx/
```

Each should show `index.html`.

- [ ] **Step 5: Verify the copied files are identical to dist/index.html**

```bash
diff dist/index.html dist/arrangement/birkebeinerrittet/index.html
```

Expected: no output (files are identical).

- [ ] **Step 6: Commit**

```bash
git add scripts/copy-spa-routes.ts package.json
git commit -m "feat(seo): postbuild script copies index.html to all SPA route paths"
```

---

## Task 4: Final verification

- [ ] **Step 1: Run the full CI check suite**

```bash
bun run lint && bun run test && bun run build
```

Expected: lint passes, all tests pass, build succeeds, postbuild script reports N route paths copied.

- [ ] **Step 2: Verify build output spot-check**

```bash
# Count total route directories created
find dist/arrangement -name "index.html" | wc -l
find dist/hva-er-rittvaer dist/lop dist/gpx -name "index.html" | wc -l
```

First count should match the number of events. Second count should be 3.

- [ ] **Step 3: Commit if any fixups were needed**

```bash
git add -A
git commit -m "fix(seo): final build verification fixups"
```

---

## Notes

### When a proper 1200×630 OG image is created
Place it at `public/og-image.png`. Then update the single constant in `src/components/PageMeta.tsx`:

```ts
const OG_IMAGE = `${SITE_URL}/og-image.png`;
```

And restore `index.html` to:
```html
<meta property="og:image" content="https://www.løypevær.no/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
```

### CloudFront configuration
No changes needed if the existing catch-all error rule (`403/404 → /index.html`) is in place. Real files now take precedence. If the CloudFront distribution does **not** have this rule, unknown routes (e.g. deep links the script didn't cover) will 403 — verify the Terraform config in `infra/` if in doubt.

### Future events
As new events are added to the data JSON files, the postbuild script picks them up automatically — no maintenance required.
