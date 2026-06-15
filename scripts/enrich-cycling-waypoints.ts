/**
 * Enrichment script: adds full waypoints + altitude to a cycling event in
 * cycling-waypoints.json by parsing a GPX route file and sampling ~5 evenly-spaced
 * points along the track. Altitude is fetched from the Open-Meteo elevation API
 * (free, no key required).
 *
 * Usage:
 *   bun scripts/enrich-cycling-waypoints.ts <event-id> <path/to/route.gpx>
 *   bun scripts/enrich-cycling-waypoints.ts <event-id> <url>
 *
 * Examples:
 *   bun scripts/enrich-cycling-waypoints.ts birkebeinerrittet ~/Downloads/birken.gpx
 *   bun scripts/enrich-cycling-waypoints.ts styrkeproven ./routes/styrkeproven.gpx
 *   bun scripts/enrich-cycling-waypoints.ts haugesund-sauda https://ridewithgps.com/routes/26544294
 *   bun scripts/enrich-cycling-waypoints.ts haugesund-sauda https://ridewithgps.com/routes/26544294.gpx
 *
 * The second argument can be:
 *   - A local file path (absolute or relative, ~ supported)
 *   - A RideWithGPS route URL (https://ridewithgps.com/routes/<id>) — .gpx is appended automatically
 *   - Any direct URL to a GPX file (https://...)
 *
 * The script:
 *   1. Loads src/data/cycling-waypoints.json
 *   2. Fetches or reads the GPX and extracts track points
 *   3. Samples NUM_WAYPOINTS evenly-spaced points (start, ~25%, ~50%, ~75%, finish)
 *   4. Fetches terrain altitude for each point from Open-Meteo /v1/elevation
 *   5. Generates human-readable labels (Start, 25%, 50%, 75%, Mål) using the GPX name
 *   6. Writes the enriched waypoints back into cycling-waypoints.json keyed by event ID
 *
 * The fetch-cycling-events.ts script will automatically pick up the waypoints
 * on the next run and merge them into cycling-events.json.
 *
 * After enrichment, run `bun run fetch-weather` to update the weather cache
 * with historical data for the new waypoints.
 */

import { writeFileSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Number of waypoints to sample from the GPX track (including start and finish)
const NUM_WAYPOINTS = 5;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Waypoint = {
  label: string;
  lat: number;
  lon: number;
  altitude?: number;
};

type WaypointEntry = Waypoint[] | { waypoints: Waypoint[]; elevationGain?: number };
type WaypointMap = Record<string, WaypointEntry>;

function resolveWaypointEntry(entry: WaypointEntry): { waypoints: Waypoint[]; elevationGain?: number } {
  if (Array.isArray(entry)) return { waypoints: entry };
  return entry;
}

type TrackPoint = {
  lat: number;
  lon: number;
};

// ---------------------------------------------------------------------------
// GPX source resolution (file or URL)
// ---------------------------------------------------------------------------

/**
 * Normalise a RideWithGPS route page URL to its direct GPX download URL.
 * https://ridewithgps.com/routes/12345  →  https://ridewithgps.com/routes/12345.gpx
 * Already-suffixed .gpx URLs are returned as-is.
 */
function toGpxUrl(raw: string): string {
  const url = new URL(raw);
  if (!url.pathname.endsWith(".gpx")) {
    url.pathname = url.pathname.replace(/\/$/, "") + ".gpx";
  }
  return url.toString();
}

/**
 * Load GPX content from either a local file path or a URL.
 */
async function loadGpxContent(source: string): Promise<string> {
  if (source.startsWith("https://") || source.startsWith("http://")) {
    const gpxUrl = toGpxUrl(source);
    console.log(`  Fetching GPX from: ${gpxUrl}`);
    const res = await fetch(gpxUrl, {
      headers: {
        "User-Agent": "loypevaer-enrichment/1.0 (github.com/vegaasen/loypevaer)",
      },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch GPX: HTTP ${res.status} from ${gpxUrl}`);
    }
    return await res.text();
  }

  // Local file
  const { readFileSync } = await import("node:fs");
  const resolved = source.startsWith("~")
    ? source.replace("~", process.env.HOME ?? "")
    : resolve(process.cwd(), source);
  try {
    return readFileSync(resolved, "utf-8");
  } catch {
    throw new Error(`Cannot read GPX file: ${resolved}`);
  }
}

// ---------------------------------------------------------------------------
// GPX parsing
// ---------------------------------------------------------------------------

/**
 * Extract track name from GPX metadata or track name element.
 */
function parseGpxName(gpxContent: string): string | null {
  const match =
    /<metadata[^>]*>[\s\S]*?<name[^>]*>([^<]+)<\/name>/.exec(gpxContent) ??
    /<trk[^>]*>[\s\S]*?<name[^>]*>([^<]+)<\/name>/.exec(gpxContent);
  return match ? match[1].trim() : null;
}

/**
 * Extract all track points from a GPX file.
 * GPX is XML; we parse it with a simple regex approach to avoid needing
 * a DOM parser or external dependency.
 */
function parseGpxTrackPoints(gpxContent: string): TrackPoint[] {
  const points: TrackPoint[] = [];
  // Match <trkpt lat="..." lon="..."> and <rtept lat="..." lon="...">
  const trkptRegex = /<(?:trkpt|rtept|wpt)\s+[^>]*lat="([^"]+)"[^>]*lon="([^"]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = trkptRegex.exec(gpxContent)) !== null) {
    const lat = parseFloat(match[1]);
    const lon = parseFloat(match[2]);
    if (!isNaN(lat) && !isNaN(lon)) {
      points.push({ lat, lon });
    }
  }
  // Also try lon before lat variant
  if (points.length === 0) {
    const reversed = /<(?:trkpt|rtept|wpt)\s+[^>]*lon="([^"]+)"[^>]*lat="([^"]+)"/g;
    while ((match = reversed.exec(gpxContent)) !== null) {
      const lon = parseFloat(match[1]);
      const lat = parseFloat(match[2]);
      if (!isNaN(lat) && !isNaN(lon)) {
        points.push({ lat, lon });
      }
    }
  }
  return points;
}

/**
 * Sample NUM_WAYPOINTS evenly-spaced points from a track.
 * Always includes first and last point.
 */
function samplePoints(points: TrackPoint[], count: number): TrackPoint[] {
  if (points.length === 0) return [];
  if (points.length <= count) return points;

  const sampled: TrackPoint[] = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.round((i / (count - 1)) * (points.length - 1));
    sampled.push(points[idx]);
  }
  return sampled;
}

// ---------------------------------------------------------------------------
// Elevation lookup
// ---------------------------------------------------------------------------

/**
 * Fetch terrain altitude for a batch of points from Open-Meteo elevation API.
 * Returns altitudes in the same order as input points.
 */
async function fetchElevations(points: TrackPoint[]): Promise<(number | null)[]> {
  const lats = points.map((p) => p.lat).join(",");
  const lons = points.map((p) => p.lon).join(",");
  const url = `https://api.open-meteo.com/v1/elevation?latitude=${lats}&longitude=${lons}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "loypevaer-enrichment/1.0 (github.com/vegaasen/loypevaer)",
      },
    });
    if (!res.ok) {
      console.warn(`  Open-Meteo elevation API returned ${res.status}`);
      return points.map(() => null);
    }
    const data = (await res.json()) as { elevation: number[] };
    return data.elevation ?? points.map(() => null);
  } catch (err) {
    console.warn("  Failed to fetch elevations:", err);
    return points.map(() => null);
  }
}

// ---------------------------------------------------------------------------
// Waypoint label generation
// ---------------------------------------------------------------------------

function waypointLabel(index: number, total: number, cityName: string): string {
  if (index === 0) return `Start – ${cityName}`;
  if (index === total - 1) return `Mål – ${cityName}`;
  const pct = Math.round((index / (total - 1)) * 100);
  return `${pct}%`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error(
      "Usage: bun scripts/enrich-cycling-waypoints.ts <event-id> <path/to/route.gpx|url>"
    );
    console.error(
      "Example: bun scripts/enrich-cycling-waypoints.ts birkebeinerrittet ~/Downloads/birken.gpx"
    );
    console.error(
      "Example: bun scripts/enrich-cycling-waypoints.ts haugesund-sauda https://ridewithgps.com/routes/26544294"
    );
    process.exit(1);
  }

  const [eventId, gpxSource] = args;

  // Load cycling-waypoints.json
  const waypointsPath = resolve(__dirname, "../src/data/cycling-waypoints.json");
  const waypointMap = JSON.parse(readFileSync(waypointsPath, "utf-8")) as WaypointMap;

  // Check if event ID already exists in the waypoint map
  const existingEntry = waypointMap[eventId];
  if (existingEntry) {
    const { waypoints: existingWps } = resolveWaypointEntry(existingEntry);
    console.log(`  Existing waypoints for "${eventId}": ${existingWps.length} points — will be overwritten`);
  }

  // Load GPX content from file or URL
  let gpxContent: string;
  try {
    gpxContent = await loadGpxContent(gpxSource);
  } catch (err) {
    console.error(String(err));
    process.exit(1);
  }

  // Extract GPX name for labels (fall back to event ID)
  const gpxName = parseGpxName(gpxContent);
  const cityName = gpxName ?? eventId;

  const allPoints = parseGpxTrackPoints(gpxContent);
  if (allPoints.length === 0) {
    console.error(
      "No track points found in GPX file. Ensure the file contains <trkpt> or <rtept> elements."
    );
    process.exit(1);
  }

  console.log(`\nEnriching waypoints for: ${eventId}`);
  if (gpxName) console.log(`  GPX name: ${gpxName}`);
  console.log(`  GPX track: ${allPoints.length} points`);

  // Sample evenly-spaced points
  const sampled = samplePoints(allPoints, NUM_WAYPOINTS);
  console.log(`  Sampling ${sampled.length} waypoints…`);

  // Fetch elevations in one batch request
  console.log("  Fetching terrain altitude from Open-Meteo…");
  const elevations = await fetchElevations(sampled);

  // Build enriched waypoints
  const enriched: Waypoint[] = sampled.map((pt, i) => {
    const label = waypointLabel(i, sampled.length, cityName);
    const alt = elevations[i];
    const wp: Waypoint = {
      label,
      lat: Math.round(pt.lat * 1000) / 1000,
      lon: Math.round(pt.lon * 1000) / 1000,
    };
    if (alt !== null) {
      wp.altitude = Math.round(alt);
    }
    return wp;
  });

  // Print summary
  console.log("\n  Enriched waypoints:");
  enriched.forEach((wp) => {
    const alt = wp.altitude !== undefined ? ` (${wp.altitude}m)` : "";
    console.log(`    ${wp.label}: ${wp.lat}, ${wp.lon}${alt}`);
  });

  // Write back to cycling-waypoints.json, preserving any existing elevationGain override
  const existingForWrite = waypointMap[eventId];
  const existingGain = existingForWrite
    ? resolveWaypointEntry(existingForWrite).elevationGain
    : undefined;
  waypointMap[eventId] = existingGain !== undefined
    ? { waypoints: enriched, elevationGain: existingGain }
    : enriched;
  writeFileSync(waypointsPath, JSON.stringify(waypointMap, null, 2));

  console.log(`\n✓ Wrote enriched waypoints to src/data/cycling-waypoints.json (key: "${eventId}")`);
  console.log(
    `  Next steps:\n` +
    `    1. Run "bun run fetch-cycling" to merge waypoints into cycling-events.json\n` +
    `    2. Run "bun run fetch-weather" to update the historical weather cache`
  );
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
