import { parseDateLocal } from "./dates";

/**
 * Group an array of race objects (that have an `officialDate: string` field)
 * by year then by month (0-indexed).
 *
 * Returns a Map<year, Map<month, T[]>> sorted by date ascending within each bucket.
 */
export function groupByYearMonth<T extends { officialDate: string }>(
  races: T[],
): Map<number, Map<number, T[]>> {
  const sorted = [...races].sort(
    (a, b) =>
      parseDateLocal(a.officialDate).getTime() -
      parseDateLocal(b.officialDate).getTime(),
  );
  const grouped = new Map<number, Map<number, T[]>>();
  for (const race of sorted) {
    const d = parseDateLocal(race.officialDate);
    const year = d.getFullYear();
    const month = d.getMonth();
    if (!grouped.has(year)) grouped.set(year, new Map());
    const byMonth = grouped.get(year)!;
    if (!byMonth.has(month)) byMonth.set(month, []);
    byMonth.get(month)!.push(race);
  }
  return grouped;
}
