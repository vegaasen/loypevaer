/**
 * Returns the Norwegian month name (title-cased) for a zero-based month index.
 * e.g. monthName(0) → "Januar", monthName(2) → "Mars"
 */
export function monthName(month: number): string {
  return new Date(2000, month, 1)
    .toLocaleDateString("nb-NO", { month: "long" })
    .replace(/^\w/, (c) => c.toUpperCase());
}
