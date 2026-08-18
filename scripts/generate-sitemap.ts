/**
 * Build-time script: generates public/sitemap.xml from src/data/arrangements.json.
 *
 * Usage:
 *   bun scripts/generate-sitemap.ts
 *
 * Run automatically as part of `bun run build` via the prebuild script.
 */

import { writeFileSync } from "fs";
import { resolve } from "path";
import ritt from "../src/data/arrangements.json" with { type: "json" };
import triathlonData from "../src/data/triathlon-events.json" with { type: "json" };
import runningData from "../src/data/running-events.json" with { type: "json" };
import cyclingData from "../src/data/cycling-events.json" with { type: "json" };
import cyclingManualData from "../src/data/cycling-manual.json" with { type: "json" };

// Unicode IDN form — must match the verified Google Search Console property.
const BASE_URL = "https://www.løypevær.no";

type RittEntry = {
  id: string;
  officialDate: string;
};

const today = new Date().toISOString().split("T")[0];

const urls: string[] = [
  // Homepage
  `  <url>
    <loc>${BASE_URL}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>`,

  // SEO landing page — targets "løypevær" searches
  `  <url>
    <loc>${BASE_URL}/hva-er-loypevaer</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>`,

  // Løping / kortere løp page
  `  <url>
    <loc>${BASE_URL}/lop</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`,

  // GPX upload page
  `  <url>
    <loc>${BASE_URL}/gpx</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`,

  // Changelog page
  `  <url>
    <loc>${BASE_URL}/endringslogg</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`,

  // One entry per arrangement — all data sources mirroring src/lib/arrangements.ts
  ...[
    ...(ritt as RittEntry[]),
    ...((triathlonData as { events: RittEntry[] }).events),
    ...((runningData as { events: RittEntry[] }).events),
    ...((cyclingData as { events: RittEntry[] }).events),
    ...((cyclingManualData as { events: RittEntry[] }).events),
  ].map(
    (r) => `  <url>
    <loc>${BASE_URL}/arrangement/${r.id}</loc>
    <lastmod>${r.officialDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`
  ),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;

const outPath = resolve(import.meta.dirname, "../public/sitemap.xml");
writeFileSync(outPath, xml, "utf-8");
console.log(`Sitemap written to ${outPath} (${urls.length} URLs)`);
