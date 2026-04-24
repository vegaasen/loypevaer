/**
 * Given a race date, start time, finish time, and per-waypoint fractions
 * (e.g. [0, 0.25, 0.5, 0.75, 1.0]), returns an ISO datetime string for each
 * waypoint, rounded to the nearest hour (as Open-Meteo hourly data is per full hour).
 *
 * Supports midnight-crossing races (e.g. start 23:00, finish 02:00 next day).
 * When finish < start in wall-clock minutes the finish is assumed to be the
 * following calendar day.
 *
 * @param date     "YYYY-MM-DD"
 * @param start    "HH:MM"  e.g. "09:00"
 * @param finish   "HH:MM"  e.g. "12:00"
 * @param fractions  numbers in [0, 1] — one per waypoint
 * @returns  array of "YYYY-MM-DDTHH:00" strings (same length as fractions)
 */
export function calcWaypointTimes(
  date: string,
  start: string,
  finish: string,
  fractions: number[]
): string[] {
  const [startH, startM] = start.split(":").map(Number);
  const [finishH, finishM] = finish.split(":").map(Number);

  const startMinutes = startH * 60 + startM;
  let finishMinutes = finishH * 60 + finishM;
  // Midnight-crossing: if finish is earlier than start in wall-clock time,
  // treat the finish as being on the next calendar day.
  if (finishMinutes <= startMinutes) {
    finishMinutes += 24 * 60;
  }
  const totalMinutes = finishMinutes - startMinutes;

  // Pre-compute the next calendar day for potential midnight-crossing waypoints.
  const startDate = new Date(date + "T00:00:00");
  const nextDate = new Date(startDate);
  nextDate.setDate(nextDate.getDate() + 1);
  const nextDateStr = nextDate.toISOString().split("T")[0];

  return fractions.map((fraction) => {
    const offsetMinutes = Math.round(fraction * totalMinutes);
    const absoluteMinutes = startMinutes + offsetMinutes;

    // Round to nearest hour (in absolute minutes from midnight of start day)
    const absoluteHour = Math.round(absoluteMinutes / 60);

    if (absoluteHour >= 24) {
      // Waypoint falls on the next calendar day
      const hour = absoluteHour - 24;
      const paddedHour = String(Math.min(23, hour)).padStart(2, "0");
      return `${nextDateStr}T${paddedHour}:00`;
    }

    const paddedHour = String(Math.max(0, absoluteHour)).padStart(2, "0");
    return `${date}T${paddedHour}:00`;
  });
}

/**
 * Extracts just the display time ("HH:00") from a waypoint datetime string.
 * e.g. "2025-08-23T10:00" → "10:00"
 */
export function formatArrivalTime(datetime: string): string {
  return datetime.split("T")[1] ?? "";
}

/**
 * Returns the fractions [0, 0.25, 0.5, 0.75, 1.0] for the standard 5-waypoint
 * layout used in all ritt.
 */
export const WAYPOINT_FRACTIONS = [0, 0.25, 0.5, 0.75, 1.0] as const;

/**
 * Given a start time ("HH:MM") and a distance + average speed, computes
 * the predicted finish time ("HH:MM").
 *
 * @param startTime  "HH:MM"
 * @param distanceKm Total race distance in km
 * @param speedKmh   Average speed in km/h
 * @returns "HH:MM" — clamped to 23:59 if the ride goes past midnight
 */
export function calcFinishTimeFromSpeed(
  startTime: string,
  distanceKm: number,
  speedKmh: number
): string {
  const [startH, startM] = startTime.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const durationMinutes = Math.round((distanceKm / speedKmh) * 60);
  const finishMinutes = startMinutes + durationMinutes;

  // Wrap past-midnight times back into 00:00–23:59 so the result is always a
  // valid HTML time value. calcWaypointTimes handles the date rollover separately.
  const wrappedMinutes = finishMinutes % (24 * 60);
  const h = Math.floor(wrappedMinutes / 60);
  const m = wrappedMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
