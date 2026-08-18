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

import { copyFileSync, mkdirSync, existsSync } from "fs";
import { resolve } from "path";

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
const staticRoutes = ["hva-er-loypevaer", "lop", "gpx"];

// All event IDs from every data source
const allEvents: HasId[] = [
  ...(arrangements as HasId[]),
  ...(cyclingData.events as HasId[]),
  ...(cyclingManual.events as HasId[]),
  ...(triathlonData.events as HasId[]),
  ...(runningData.events as HasId[]),
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
