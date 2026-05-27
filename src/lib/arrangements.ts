import type { Waypoint } from "./weather";
import arrangements from "../data/arrangements.json";
import triathlonData from "../data/triathlon-events.json";
import runningData from "../data/running-events.json";
import cyclingData from "../data/cycling-events.json";
import cyclingManualData from "../data/cycling-manual.json";

/** All arrangements merged: manually curated + auto-synced triathlon + running + cycling events. */
export const allArrangements: RittEntry[] = [
  ...(arrangements as RittEntry[]),
  ...(triathlonData.events as RittEntry[]),
  ...(runningData.events as RittEntry[]),
  ...(cyclingData.events as RittEntry[]),
  ...(cyclingManualData.events as RittEntry[]),
];

export type Discipline = "landevei" | "gravel" | "terreng" | "langrenn" | "triathlon" | "ultraløp" | "løping" | "cx";

export interface RittEntry {
  id: string;
  name: string;
  discipline: Discipline;
  distance: number;
  region: string;
  officialDate: string;
  /** Known mass-start time in "HH:MM" format, e.g. "08:00". Optional — not all ritt have a confirmed time. */
  officialStartTime?: string;
  /** "pending" = date not yet officially confirmed for this season. "cancelled" = event has been cancelled. */
  dateStatus?: "pending" | "cancelled";
  url?: string;
  /** Human-readable distance description, used for multi-discipline events like triathlon. */
  distanceLabel?: string;
  waypoints: Waypoint[];
  elevationGain?: number;
}

/**
 * Returns the next upcoming arrangement from the given list, or the first
 * if all are in the past.
 */
export function getNextRitt(races: RittEntry[]): RittEntry | undefined {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return [...races]
    .filter((r) => new Date(r.officialDate + "T00:00:00") >= today)
    .sort(
      (a, b) =>
        new Date(a.officialDate + "T00:00:00").getTime() -
        new Date(b.officialDate + "T00:00:00").getTime()
    )[0];
}

/**
 * Returns the soonest upcoming event per discipline (max 7), excluding
 * cancelled/past events and the "løping" and "cx" disciplines.
 */
export function getNextPerDiscipline(events: RittEntry[], now: Date = new Date()): RittEntry[] {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const excludedDisciplines: Discipline[] = ["løping", "cx"];

  const upcoming = events
    .filter(
      (e) =>
        e.dateStatus !== "cancelled" &&
        new Date(e.officialDate + "T00:00:00") >= today &&
        !excludedDisciplines.includes(e.discipline)
    )
    .sort(
      (a, b) =>
        new Date(a.officialDate + "T00:00:00").getTime() -
        new Date(b.officialDate + "T00:00:00").getTime()
    );

  const seen = new Map<Discipline, RittEntry>();
  for (const event of upcoming) {
    if (!seen.has(event.discipline)) {
      seen.set(event.discipline, event);
    }
  }

  return [...seen.values()]
    .sort(
      (a, b) =>
        new Date(a.officialDate + "T00:00:00").getTime() -
        new Date(b.officialDate + "T00:00:00").getTime()
    )
    .slice(0, 7);
}

/**
 * Computes accumulated elevation gain (metres climbed) from an ordered list
 * of waypoints with altitude data. Only positive altitude differences are summed.
 */
export function computeElevationGain(waypoints: Waypoint[]): number | null {
  const withAlt = waypoints.filter((w) => w.altitude != null);
  if (withAlt.length < 2) return null;

  let gain = 0;
  for (let i = 1; i < withAlt.length; i++) {
    const diff = withAlt[i].altitude! - withAlt[i - 1].altitude!;
    if (diff > 0) gain += diff;
  }
  return gain;
}
