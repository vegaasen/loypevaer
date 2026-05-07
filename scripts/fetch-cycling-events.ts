/**
 * Sync script: fetches Norwegian cycling events from the EQ Timing API
 * (via live.eqtiming.com, organizationId=13 = Norges Cykleforbund),
 * filters to road/off-road/cyclocross disciplines, deduplicates against
 * cycling-manual.json, strips year suffixes from IDs (keeping only the
 * nearest upcoming edition per event), merges waypoints from
 * cycling-waypoints.json, geocodes each venue via Nominatim,
 * and writes the result to src/data/cycling-events.json.
 *
 * Usage:
 *   bun scripts/fetch-cycling-events.ts
 *   bun scripts/fetch-cycling-events.ts --year 2027   (specific year)
 *
 * Run weekly via GitHub Actions (.github/workflows/refresh-cycling.yml).
 *
 * API endpoint (no auth required):
 *   https://live.eqtiming.com/api/Events
 *     ?organizationId=13
 *     &dateFrom=dd-mm-yyyy
 *     &dateTo=dd-mm-yyyy
 *
 * Note: skip/take parameters exist but skip is ignored server-side — the API
 * returns all matching events in a single response. One year of NCF events
 * is ~300–800 records, well within what a single request handles.
 */

import { writeFileSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EQ_API_BASE = "https://live.eqtiming.com/api/Events";
const NCF_ORG_ID = 13; // Norges Cykleforbund

/**
 * EQ Timing Sport.Name values to include.
 * Bane, BMX, Trial, Utfor, Enduro are excluded — not endurance route events.
 */
const INCLUDED_SPORTS = new Set(["Landevei", "Terreng", "Gravel", "Sykkelkross"]);

/** Discipline mapping from EQ Timing Sport.Name to our Discipline type */
const SPORT_TO_DISCIPLINE: Record<string, string> = {
  Landevei: "landevei",
  Gravel: "landevei",
  Terreng: "terreng",
  Sykkelkross: "cx",
};

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

type CyclingEvent = {
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

type ManualEvent = {
  id: string;
  name: string;
};

type WaypointMap = Record<string, Waypoint[]>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Strip trailing year suffix from a slugified ID, e.g. "tyrifjorden-rundt-2026" → "tyrifjorden-rundt" */
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
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      {
        headers: {
          "User-Agent": "loypevaer-cycling-sync/1.0 (github.com/vegaasen/loypevaer)",
        },
      }
    );
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
  const url =
    `${EQ_API_BASE}?organizationId=${NCF_ORG_ID}&dateFrom=${start}&dateTo=${end}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "loypevaer-cycling-sync/1.0 (github.com/vegaasen/loypevaer)",
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

  // Load cycling-manual.json IDs for deduplication
  const manualPath = resolve(__dirname, "../src/data/cycling-manual.json");
  const manualData = JSON.parse(readFileSync(manualPath, "utf-8")) as { events: ManualEvent[] };
  const manualIds = new Set(manualData.events.map((e) => e.id));

  // Load cycling-waypoints.json for merging
  const waypointsPath = resolve(__dirname, "../src/data/cycling-waypoints.json");
  const waypointMap = JSON.parse(readFileSync(waypointsPath, "utf-8")) as WaypointMap;

  console.log(`Fetching NCF cycling events for year(s): ${years.join(", ")}…`);
  console.log(`  ${manualIds.size} manual events loaded for deduplication`);
  console.log(`  ${Object.keys(waypointMap).length} waypoint entries loaded`);

  // Fetch all years
  const allRaw: EqEvent[] = [];
  for (const year of years) {
    console.log(`  Fetching ${year}…`);
    const events = await fetchEventsForYear(year);
    console.log(`    → ${events.length} events returned`);
    allRaw.push(...events);
  }

  // Filter: validated + included sports
  const filtered = allRaw.filter((e) => {
    if (!e.Validated) return false;
    return INCLUDED_SPORTS.has(e.Sport.Name);
  });

  console.log(
    `  ${allRaw.length} total → ${filtered.length} after sport/validation filter`
  );

  // Filter: minimum distance 45 km; exclude unknown distance (km === 0)
  const distanceFiltered = filtered.filter((e) => {
    const distances = Object.values(e.Race).map((r) => r.Distance).filter((d) => d > 0);
    const km = distances.length > 0 ? Math.max(...distances) / 1000 : 0;
    return km >= 45;
  });

  console.log(`  ${distanceFiltered.length} events after distance filter (≥45 km, unknown excluded)`);

  // Dedup against cycling-manual.json (by base ID)
  const deduped = distanceFiltered.filter((e) => {
    const baseId = stripYear(toId(e.Name));
    if (manualIds.has(baseId)) {
      console.log(`  Skipping manual duplicate: "${e.Name}" (id: ${baseId})`);
      return false;
    }
    return true;
  });

  console.log(`  ${deduped.length} events after deduplication against cycling-manual.json`);

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
  const output: CyclingEvent[] = [];

  for (const event of nearestEditions) {
    const officialDate = parseDate(event.Date);
    const discipline = SPORT_TO_DISCIPLINE[event.Sport.Name] ?? "landevei";
    const cityName = event.City.Name ?? event.Organizer.Name ?? event.Name;

    // Pick distance from Race entries (take the largest non-zero value)
    const distances = Object.values(event.Race)
      .map((r) => r.Distance)
      .filter((d) => d > 0);
    const metres = distances.length > 0 ? Math.max(...distances) : 0;
    const km = metres > 0 ? Math.round(metres / 100) / 10 : 0;

    // Generate stable year-less ID
    const id = stripYear(toId(event.Name));

    console.log(
      `  Processing: ${event.Name} → id: ${id} (${officialDate}, ${event.Sport.Name}, ${cityName})`
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

    // Merge waypoints: prefer hand-curated waypoints over geocoded pin
    const waypoints: Waypoint[] = waypointMap[id] ?? [{ label: `Start/Mål – ${cityName}`, lat, lon }];

    output.push({
      id,
      name: event.Name,
      discipline,
      officialDate,
      distance: km,
      distanceLabel: distanceLabel(metres),
      sportLevel: event.Sportlevel.Code,
      region,
      url: event.Homepage ?? "",
      waypoints,
    });
  }

  // Write output
  const outputPath = resolve(__dirname, "../src/data/cycling-events.json");
  writeFileSync(
    outputPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        source: "eqtiming.com / Norges Cykleforbund (organizationId=13)",
        events: output,
      },
      null,
      2
    )
  );

  console.log(`\nWrote ${output.length} events to src/data/cycling-events.json`);

  // Warn if result count looks suspiciously round (potential silent truncation)
  if (output.length > 0 && output.length % 100 === 0) {
    console.warn(
      `  ⚠ Event count (${output.length}) is a round number — verify the API didn't silently truncate results.`
    );
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

