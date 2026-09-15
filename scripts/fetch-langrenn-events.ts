/**
 * Sync script: fetches Norwegian cross-country skiing (langrenn) events from
 * the EQ Timing API (via live.eqtiming.com, organizationId=32 = Norges
 * Skiforbund), filters to Langrenn/Turrenn races within the on-snow season
 * (Oct-May, to exclude summer rollerski races EQ Timing files under the same
 * sport), deduplicates against the hand-curated langrenn entries in
 * arrangements.json, geocodes each venue via Nominatim, and writes the
 * result to src/data/langrenn-events.json.
 *
 * Usage:
 *   bun scripts/fetch-langrenn-events.ts
 *   bun scripts/fetch-langrenn-events.ts --year 2027   (specific year)
 *
 * Run weekly via GitHub Actions (.github/workflows/refresh-langrenn.yml).
 *
 * API endpoint (no auth required):
 *   https://live.eqtiming.com/api/Events
 *     ?organizationId=32
 *     &dateFrom=dd-mm-yyyy
 *     &dateTo=dd-mm-yyyy
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EQ_API_BASE = "https://live.eqtiming.com/api/Events";
const NSF_ORG_ID = 32; // Norges Skiforbund

/**
 * EQ Timing Sport.Name values to include. Both are children of the
 * "Cross Country Skiing" sport tree. Randonee/Alpint (also present under
 * organizationId=32) are excluded — different disciplines.
 */
const INCLUDED_SPORTS = new Set(["Langrenn", "Turrenn"]);

/**
 * Norwegian on-snow ski season runs roughly October–May. EQ Timing's
 * "Langrenn" sport also contains summer rollerski races (e.g. "Blink
 * Classic", "Rulleskirenn Narvik") that aren't on-snow events — excluding
 * June-September filters those out without a name-based blocklist.
 */
const SKI_SEASON_MONTHS = new Set([10, 11, 12, 1, 2, 3, 4, 5]);

/**
 * Hardcoded distance overrides for events where EQ Timing returns bad data.
 * Values are in km. Applied after EQ API distance calculation.
 */
const DISTANCE_OVERRIDES: Record<string, number> = {};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EqSportParent = {
  Id: number;
  Name: string;
  Parent: EqSportParent | null;
  SportIds: number[];
  SortOrder: number;
};

type EqEvent = {
  Id: number;
  Name: string;
  Date: string; // "2026-05-24T00:00:00"
  Homepage: string;
  Validated: boolean;
  Sport: {
    Id: number;
    Name: string;
    Code: string;
    Parent: EqSportParent | null;
  };
  Dicipline: {
    Id: number;
    Name: string;
    Code: string;
  };
  Sportlevel: {
    Id: number;
    Name: string;
    Code: string;
    ShowForOrganizer: boolean;
  };
  City: {
    Name: string;
    Timezone: string;
    Coordinate: {
      Latitude: number;
      Longitude: number;
    };
  };
  Organizer: {
    Id: number;
    Name: string;
  };
  Race: Record<string, { Id: number; Name: string | null; Distance: number }>;
};

type Waypoint = {
  label: string;
  lat: number;
  lon: number;
  altitude?: number;
};

type LangrennEvent = {
  id: string;
  name: string;
  discipline: string;
  officialDate: string;
  distance: number;
  distanceLabel: string;
  sportLevel: string;
  region: string;
  url: string;
  waypoints: Waypoint[];
};

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    county?: string;
    state?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
  };
};

type Arrangement = {
  id: string;
  discipline: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Strip trailing year suffix from a slugified ID, e.g. "trysil-skimaraton-2026" → "trysil-skimaraton" */
function stripYear(id: string): string {
  return id.replace(/-\d{4}$/, "");
}

/** Slugify a name to a stable kebab-case ID */
function toId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[æ]/g, "ae")
    .replace(/[ø]/g, "o")
    .replace(/[å]/g, "a")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Format ISO date string to "YYYY-MM-DD" */
function parseDate(raw: string): string {
  return raw.split("T")[0];
}

/** Format dd-mm-yyyy for the EQ Timing API */
function toDdMmYyyy(date: Date): string {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
}

/** Format distance in metres to a human-readable km label */
function distanceLabel(metres: number): string {
  if (metres <= 0) return "Ukjent distanse";
  const km = metres / 1000;
  return `${km % 1 === 0 ? km.toFixed(0) : km.toFixed(1)} km`;
}

/** Geocode a place name via Nominatim (OpenStreetMap). Returns null on failure. */
async function geocode(query: string): Promise<NominatimResult | null> {
  const params = new URLSearchParams({
    q: `${query}, Norway`,
    format: "json",
    limit: "1",
    addressdetails: "1",
  });
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: {
        "User-Agent": "loypevaer-langrenn-sync/1.0 (github.com/vegaasen/loypevaer)",
      },
    });
    if (!res.ok) return null;
    const results = (await res.json()) as NominatimResult[];
    return results[0] ?? null;
  } catch {
    return null;
  }
}

/** Extract a human-readable region from a Nominatim result. */
function regionFromNominatim(result: NominatimResult): string {
  const a = result.address ?? {};
  return a.county ?? a.state ?? a.municipality ?? a.city ?? a.town ?? a.village ?? "Norge";
}

/** Fetch all events for a given year from the EQ Timing API. */
async function fetchEventsForYear(year: number): Promise<EqEvent[]> {
  const start = toDdMmYyyy(new Date(year, 0, 1));
  const end = toDdMmYyyy(new Date(year, 11, 31));
  const url = `${EQ_API_BASE}?organizationId=${NSF_ORG_ID}&dateFrom=${start}&dateTo=${end}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "loypevaer-langrenn-sync/1.0 (github.com/vegaasen/loypevaer)",
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`EQ Timing API ${res.status} for year ${year}: ${res.statusText}`);
  }
  return (await res.json()) as EqEvent[];
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // Parse optional --year argument
  const yearArg = process.argv.find((a) => a.startsWith("--year=") || a === "--year");
  let years: number[];
  if (yearArg) {
    const val =
      yearArg === "--year"
        ? process.argv[process.argv.indexOf("--year") + 1]
        : yearArg.split("=")[1];
    years = [parseInt(val, 10)];
  } else {
    const now = new Date().getFullYear();
    years = [now, now + 1];
  }

  // Load hand-curated langrenn entries from arrangements.json for deduplication
  const arrangementsPath = resolve(__dirname, "../src/data/arrangements.json");
  const arrangementsData = JSON.parse(readFileSync(arrangementsPath, "utf-8")) as Arrangement[];
  const manualIds = new Set(
    arrangementsData.filter((e) => e.discipline === "langrenn").map((e) => e.id),
  );

  console.log(`Fetching NSF langrenn events for year(s): ${years.join(", ")}…`);
  console.log(`  ${manualIds.size} manual langrenn entries loaded for deduplication`);

  // Fetch all years
  const allRaw: EqEvent[] = [];
  for (const year of years) {
    console.log(`  Fetching ${year}…`);
    const events = await fetchEventsForYear(year);
    console.log(`    → ${events.length} events returned`);
    allRaw.push(...events);
  }

  // Filter: validated + included sports + on-snow season
  const filtered = allRaw.filter((e) => {
    if (!e.Validated) return false;
    if (!INCLUDED_SPORTS.has(e.Sport.Name)) return false;
    const month = Number(e.Date.slice(5, 7));
    return SKI_SEASON_MONTHS.has(month);
  });

  console.log(`  ${allRaw.length} total → ${filtered.length} after sport/validation filter`);

  // Filter: distance 10-100 km; exclude unknown distance and bad data outliers
  const distanceFiltered = filtered.filter((e) => {
    const distances = Object.values(e.Race)
      .map((r) => r.Distance)
      .filter((d) => d > 0);
    const km = distances.length > 0 ? Math.max(...distances) / 1000 : 0;
    return km >= 10 && km <= 100;
  });

  console.log(
    `  ${distanceFiltered.length} events after distance filter (10-100 km, unknown excluded)`,
  );

  // Dedup against arrangements.json (by base ID)
  const deduped = distanceFiltered.filter((e) => {
    const baseId = stripYear(toId(e.Name));
    if (manualIds.has(baseId)) {
      console.log(`  Skipping manual duplicate: "${e.Name}" (id: ${baseId})`);
      return false;
    }
    return true;
  });

  console.log(`  ${deduped.length} events after deduplication against arrangements.json`);

  // Nearest-upcoming dedup: for each base ID, keep the edition whose date is
  // closest to today but still in the future. If all editions are past, keep
  // the most recent one.
  const today = new Date().toISOString().slice(0, 10);
  const byBaseId = new Map<string, EqEvent>();

  for (const event of deduped) {
    const baseId = stripYear(toId(event.Name));
    const date = parseDate(event.Date);
    const existing = byBaseId.get(baseId);

    if (!existing) {
      byBaseId.set(baseId, event);
      continue;
    }

    const existingDate = parseDate(existing.Date);
    const eventIsFuture = date >= today;
    const existingIsFuture = existingDate >= today;

    if (eventIsFuture && !existingIsFuture) {
      // Prefer future over past
      byBaseId.set(baseId, event);
    } else if (eventIsFuture && existingIsFuture) {
      // Both future: prefer nearest (smaller date)
      if (date < existingDate) byBaseId.set(baseId, event);
    } else if (!eventIsFuture && !existingIsFuture) {
      // Both past: prefer most recent (larger date)
      if (date > existingDate) byBaseId.set(baseId, event);
    }
    // existing is future, event is past: keep existing
  }

  const nearestEditions = Array.from(byBaseId.values());
  console.log(`  ${nearestEditions.length} events after nearest-upcoming dedup`);

  // Process each event
  const output: LangrennEvent[] = [];

  for (const event of nearestEditions) {
    const officialDate = parseDate(event.Date);
    const cityName = event.City.Name ?? event.Organizer.Name ?? event.Name;

    // Pick distance from Race entries (take the largest non-zero value)
    const distances = Object.values(event.Race)
      .map((r) => r.Distance)
      .filter((d) => d > 0);
    const metres = distances.length > 0 ? Math.max(...distances) : 0;

    // Generate stable year-less ID
    const id = stripYear(toId(event.Name));

    // Apply hardcoded override if available (corrects known bad EQ Timing data)
    const kmOverride = DISTANCE_OVERRIDES[id];
    const km =
      kmOverride !== undefined ? kmOverride : metres > 0 ? Math.round(metres / 100) / 10 : 0;
    if (kmOverride !== undefined) {
      console.log(
        `    ⚠ Distance override applied for "${id}": ${Math.round(metres / 100) / 10} km → ${kmOverride} km`,
      );
    }

    console.log(
      `  Processing: ${event.Name} → id: ${id} (${officialDate}, ${event.Sport.Name}, ${cityName})`,
    );

    // Use EQ Timing coordinates if available, otherwise geocode
    let lat: number;
    let lon: number;
    let region: string;

    const eqLat = event.City.Coordinate.Latitude;
    const eqLon = event.City.Coordinate.Longitude;

    if (eqLat !== 0 && eqLon !== 0) {
      lat = eqLat;
      lon = eqLon;
      region = "Norge";
      // Still geocode to get a proper region label
      await sleep(1000);
      const geo = await geocode(cityName);
      if (geo) region = regionFromNominatim(geo);
    } else {
      // Geocode city name via Nominatim
      await sleep(1000); // Nominatim requires ≥1s between requests
      const geo = await geocode(cityName);
      if (!geo) {
        console.warn(`    No geocode result for "${cityName}", skipping`);
        continue;
      }
      lat = parseFloat(geo.lat);
      lon = parseFloat(geo.lon);
      region = regionFromNominatim(geo);
    }

    console.log(`    → ${lat.toFixed(3)}, ${lon.toFixed(3)} (${region})`);

    output.push({
      id,
      name: event.Name,
      discipline: "langrenn",
      officialDate,
      distance: km,
      distanceLabel: kmOverride !== undefined ? `${kmOverride} km` : distanceLabel(metres),
      sportLevel: event.Sportlevel.Code,
      region,
      url: event.Homepage ?? "",
      waypoints: [{ label: `Start/Mål – ${cityName}`, lat, lon }],
    });
  }

  // Write output
  const outputPath = resolve(__dirname, "../src/data/langrenn-events.json");
  writeFileSync(
    outputPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        source: "eqtiming.com / Norges Skiforbund (organizationId=32)",
        events: output,
      },
      null,
      2,
    ),
  );

  console.log(`\nWrote ${output.length} events to src/data/langrenn-events.json`);

  // Warn if result count looks suspiciously round (potential silent truncation)
  if (output.length > 0 && output.length % 100 === 0) {
    console.warn(
      `  ⚠ Event count (${output.length}) is a round number — verify the API didn't silently truncate results.`,
    );
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
