/**
 * Pure weather-stats computation utilities.
 * Used by scripts/generate-weather-stats.ts and tested via Vitest.
 */

/**
 * Weather code penalty: returns a factor 0–1 applied to the comfort score.
 * Based on WMO weather codes. Clear sky = 1.0, thunderstorm = 0.1.
 */
function weatherCodeFactor(code: number): number {
  if (code === 0) return 1.0;
  if (code <= 2) return 0.95;
  if (code === 3) return 0.85;
  if (code <= 48) return 0.75;
  if (code <= 55) return 0.6;
  if (code <= 65) return 0.4;
  if (code <= 77) return 0.35;
  if (code <= 82) return 0.3;
  if (code <= 86) return 0.25;
  return 0.1;
}

/**
 * Composite comfort score 0–100 for endurance sport.
 * - feelsLikeMax (°C): bell curve peaking at 16°C, zero at ±12°C
 * - precipitation (mm): 0mm=1.0, ≥10mm=0.0
 * - windSpeed (m/s): 0=1.0, ≥20=0.0
 * - weatherCode: WMO code applied as a multiplier
 */
export function computeComfortScore(
  feelsLikeMax: number,
  precipitation: number,
  windSpeed: number,
  weatherCode: number,
): number {
  const tempOptimal = 16;
  const tempSpread = 12;
  const tempScore = Math.max(0, 1 - Math.abs(feelsLikeMax - tempOptimal) / tempSpread);
  const precipScore = Math.max(0, 1 - precipitation / 10);
  const windScore = Math.max(0, 1 - windSpeed / 20);
  const base = (tempScore + precipScore + windScore) / 3;
  return Math.max(0, Math.round(base * weatherCodeFactor(weatherCode) * 100));
}

/**
 * OLS linear regression slope (unit per year-step).
 * Values ordered chronologically; each index = one year step.
 * Returns null if fewer than 3 data points.
 */
export function computeTrend(values: number[]): number | null {
  if (values.length < 3) return null;
  const n = values.length;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (values[i] - yMean);
    den += (i - xMean) ** 2;
  }
  if (den === 0) return 0;
  return Math.round((num / den) * 100) / 100;
}

/** Returns the most frequently occurring value in the array. Returns 0 for empty input. */
export function statisticalMode(vals: number[]): number {
  if (vals.length === 0) return 0;
  const freq: Record<number, number> = {};
  for (const v of vals) freq[v] = (freq[v] ?? 0) + 1;
  return Number(Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0]);
}
