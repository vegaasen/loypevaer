import type { Waypoint } from "./weather";

export interface GpxTrackPoint {
  lat: number;
  lon: number;
  ele: number | null;
}

/**
 * Parse a GPX XML string into a flat array of track points.
 * Handles <trkpt> elements; ignores <wpt> for sampling purposes.
 */
export function parseGpx(xml: string): GpxTrackPoint[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");

  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    throw new Error(`Ugyldig GPX-fil: ${parseError.textContent ?? "ukjent feil"}`);
  }

  const trkpts = doc.querySelectorAll("trkpt");
  if (trkpts.length === 0) {
    throw new Error(
      "Ingen sporpunkter funnet i GPX-filen. Kontroller at filen inneholder <trkpt>-elementer.",
    );
  }

  const points: GpxTrackPoint[] = [];
  trkpts.forEach((pt) => {
    const lat = parseFloat(pt.getAttribute("lat") ?? "");
    const lon = parseFloat(pt.getAttribute("lon") ?? "");
    if (Number.isNaN(lat) || Number.isNaN(lon)) return;
    const eleEl = pt.querySelector("ele");
    const ele = eleEl ? parseFloat(eleEl.textContent ?? "") : null;
    points.push({ lat, lon, ele: ele !== null && !Number.isNaN(ele) ? ele : null });
  });

  if (points.length === 0) {
    throw new Error("Ingen gyldige sporpunkter funnet i GPX-filen.");
  }

  return points;
}

/** Haversine distance in km between two lat/lon points. */
function haversineKm(a: GpxTrackPoint, b: GpxTrackPoint): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * sinDLon * sinDLon;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Cumulative distance (km) array for a list of track points. */
function cumulativeDistances(points: GpxTrackPoint[]): number[] {
  const dists = [0];
  for (let i = 1; i < points.length; i++) {
    dists.push(dists[i - 1] + haversineKm(points[i - 1], points[i]));
  }
  return dists;
}

/**
 * Downsample a GPX track to at most `count` waypoints.
 * Always includes start and finish. Intermediate points are chosen
 * at equidistant intervals along the route.
 *
 * Returns Waypoint[] ready for use with useWeather / WeatherStrip.
 */
export function downsampleGpx(points: GpxTrackPoint[], count = 8): Waypoint[] {
  if (points.length === 0) return [];
  if (points.length <= count) {
    return points.map((p, i) => gpxPointToWaypoint(p, i, points.length));
  }

  const dists = cumulativeDistances(points);
  const totalDist = dists[dists.length - 1];

  const selected: GpxTrackPoint[] = [];
  const targetCount = Math.max(2, count);

  for (let i = 0; i < targetCount; i++) {
    const targetDist = (i / (targetCount - 1)) * totalDist;
    // Binary search for the closest point at this distance
    let lo = 0;
    let hi = dists.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (dists[mid] < targetDist) lo = mid + 1;
      else hi = mid;
    }
    selected.push(points[lo]);
  }

  return selected.map((p, i) => gpxPointToWaypoint(p, i, selected.length));
}

function gpxPointToWaypoint(p: GpxTrackPoint, index: number, total: number): Waypoint {
  let label: string;
  if (index === 0) label = "Start";
  else if (index === total - 1) label = "Mål";
  else label = `Punkt ${index}`;

  return {
    label,
    lat: Math.round(p.lat * 1e5) / 1e5,
    lon: Math.round(p.lon * 1e5) / 1e5,
    ...(p.ele != null ? { altitude: Math.round(p.ele) } : {}),
  };
}

/**
 * Compute total distance in km for a list of track points.
 */
export function gpxTotalDistanceKm(points: GpxTrackPoint[]): number {
  const dists = cumulativeDistances(points);
  return Math.round(dists[dists.length - 1]);
}

/**
 * Fetch a GPX file from a URL and parse it.
 * Uses a CORS proxy if needed, but tries direct first.
 */
export async function fetchGpxFromUrl(url: string): Promise<GpxTrackPoint[]> {
  let text: string;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    text = await res.text();
  } catch {
    throw new Error(
      "Kunne ikke laste GPX fra URL. Kontroller at adressen er riktig og at tjenesten tillater nedlasting (CORS).",
    );
  }
  return parseGpx(text);
}
