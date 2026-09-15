// src/lib/waxTips.ts

type WaxBand = {
  maxTemp: number;
  label: string;
  range: string;
};

/** Classic-ski grip wax bands, keyed by snow/air temperature (°C), loosely
 *  following the public Swix wax-temperature chart (swixsport.com smøretips). */
const GRIP_WAX_TABLE: WaxBand[] = [
  { maxTemp: -15, label: "Grønn (ekstra kald, nysnø)", range: "under -15°C" },
  { maxTemp: -8, label: "Blå ekstra", range: "-15 til -8°C" },
  { maxTemp: -4, label: "Blå", range: "-8 til -4°C" },
  { maxTemp: -1, label: "Fiolett", range: "-4 til -1°C" },
  { maxTemp: 0, label: "Fiolett/klister-kombi", range: "-1 til 0°C" },
  { maxTemp: 1, label: "Rød klister", range: "0 til +1°C" },
  { maxTemp: 3, label: "Fiolett klister", range: "+1 til +3°C" },
  { maxTemp: Infinity, label: "Gul klister (våt/gammel snø)", range: "over +3°C" },
];

/** Glide wax bands (skate and classic base), same temperature-band logic. */
const GLIDE_WAX_TABLE: WaxBand[] = [
  { maxTemp: -10, label: "Kald glid (blå)", range: "under -10°C" },
  { maxTemp: -3, label: "Universal glid (fiolett/rød)", range: "-10 til -3°C" },
  { maxTemp: Infinity, label: "Varm glid (gul/rød)", range: "over -3°C" },
];

function lookup(table: WaxBand[], temp: number): WaxBand {
  return table.find((band) => temp <= band.maxTemp) ?? table[table.length - 1];
}

export type WaxTips = {
  grip: WaxBand;
  glide: WaxBand;
  /** True when the temperature spread along the course is wide enough that a
   *  single wax choice is risky — worth a klister fallback or testing kick on site. */
  wideRange: boolean;
};

/**
 * Approximates classic-ski grip and glide wax recommendations from forecast
 * air temperature. Air temp is a proxy for snow temp, not a replacement for
 * it — actual snow condition (fresh/old, wet/dry, sun exposure) can shift the
 * right choice, so this is a starting point, not a substitute for testing
 * kick before the start.
 */
export function getWaxTips(minTemp: number, maxTemp: number): WaxTips {
  const grip = lookup(GRIP_WAX_TABLE, minTemp);
  const glide = lookup(GLIDE_WAX_TABLE, (minTemp + maxTemp) / 2);
  return { grip, glide, wideRange: maxTemp - minTemp > 4 };
}
