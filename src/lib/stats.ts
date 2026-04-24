/** Average an array of numbers, ignoring nullish entries. Returns null if all values are nullish. */
export function avg(vals: (number | undefined | null)[]): number | null {
  const clean = vals.filter((v): v is number => v != null);
  if (clean.length === 0) return null;
  return clean.reduce((a, b) => a + b, 0) / clean.length;
}

/** Returns the most frequent item in an array, or undefined if the array is empty. */
export function mode<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;
  const counts = new Map<T, number>();
  for (const v of arr) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}
