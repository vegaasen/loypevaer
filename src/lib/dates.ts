/**
 * Parse a YYYY-MM-DD date string as local midnight (avoids UTC timezone shifts).
 */
export function parseDateLocal(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00`);
}

/**
 * Returns a new Date set to local midnight of today.
 * Centralises the `new Date() + setHours(0,0,0,0)` pattern so callers avoid
 * repeating it and tests can control the clock via vi.setSystemTime().
 */
export function getTodayMidnight(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Format a YYYY-MM-DD date string in Norwegian long format,
 * e.g. "23. august 2025".
 */
export function formatNorwegianDate(dateStr: string): string {
  return parseDateLocal(dateStr).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Number of whole days from today (local midnight) to the given date.
 * Negative = in the past.
 */
export function daysUntil(dateStr: string): number {
  const today = getTodayMidnight();
  const target = parseDateLocal(dateStr);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Human-readable Norwegian countdown string, e.g. "om 3 dager", "i dag", "i går".
 */
export function formatCountdown(dateStr: string): string {
  const diff = daysUntil(dateStr);
  if (diff === 0) return "i dag";
  if (diff === 1) return "i morgen";
  if (diff === -1) return "i går";
  if (diff > 0) return `om ${diff} dager`;
  return `${Math.abs(diff)} dager siden`;
}
