/**
 * WMO Weather Code → human-readable label + emoji
 * Reference: https://open-meteo.com/en/docs#weathervariables
 */
export type WeatherDescription = {
  label: string;
  emoji: string;
};

const WMO_CODES: Record<number, WeatherDescription> = {
  0: { label: "Klarvær", emoji: "☀️" },
  1: { label: "Hovedsakelig klart", emoji: "🌤️" },
  2: { label: "Delvis skyet", emoji: "⛅" },
  3: { label: "Overskyet", emoji: "☁️" },
  45: { label: "Tåke", emoji: "🌫️" },
  48: { label: "Rimtåke", emoji: "🌫️" },
  51: { label: "Lett yr", emoji: "🌦️" },
  53: { label: "Yr", emoji: "🌦️" },
  55: { label: "Tett yr", emoji: "🌧️" },
  61: { label: "Lett regn", emoji: "🌧️" },
  63: { label: "Regn", emoji: "🌧️" },
  65: { label: "Kraftig regn", emoji: "🌧️" },
  71: { label: "Lett snø", emoji: "🌨️" },
  73: { label: "Snø", emoji: "❄️" },
  75: { label: "Kraftig snø", emoji: "❄️" },
  77: { label: "Snøkorn", emoji: "🌨️" },
  80: { label: "Lett regnbyger", emoji: "🌦️" },
  81: { label: "Regnbyger", emoji: "🌦️" },
  82: { label: "Kraftige regnbyger", emoji: "⛈️" },
  85: { label: "Snøbyger", emoji: "🌨️" },
  86: { label: "Kraftige snøbyger", emoji: "❄️" },
  95: { label: "Tordenvær", emoji: "⛈️" },
  96: { label: "Tordenvær m/ hagl", emoji: "⛈️" },
  99: { label: "Kraftig tordenvær m/ hagl", emoji: "⛈️" },
};

export function describeWeatherCode(code: number): WeatherDescription {
  return WMO_CODES[code] ?? { label: `Kode ${code}`, emoji: "🌡️" };
}

/**
 * Maps MET Norway Locationforecast symbol codes (without _day/_night suffix)
 * to the nearest WMO numeric code.
 * Reference: https://api.met.no/weatherapi/weathericon/2.0/legends
 */
const YR_SYMBOL_TO_WMO: Record<string, number> = {
  clearsky: 0,
  fair: 1,
  partlycloudy: 2,
  cloudy: 3,
  fog: 45,
  lightrain: 61,
  rain: 63,
  heavyrain: 65,
  lightrainshowers: 80,
  rainshowers: 81,
  heavyrainshowers: 82,
  lightsleet: 77,
  sleet: 77,
  heavysleet: 77,
  lightsleetshowers: 77,
  sleetshowers: 77,
  heavysleetshowers: 77,
  lightsnow: 71,
  snow: 73,
  heavysnow: 75,
  lightsnowshowers: 85,
  snowshowers: 85,
  heavysnowshowers: 86,
  thunder: 95,
  rainandthunder: 95,
  lightrainandthunder: 95,
  heavyrainandthunder: 95,
  sleetandthunder: 95,
  lightsleetandthunder: 95,
  heavysleetandthunder: 95,
  snowandthunder: 95,
  lightsnowandthunder: 95,
  heavysnowandthunder: 95,
  lightrainshowersandthunder: 96,
  rainshowersandthunder: 96,
  heavyrainshowersandthunder: 99,
  lightsleetshowersandthunder: 96,
  sleetshowersandthunder: 96,
  heavysleetshowersandthunder: 99,
  lightsnowshowersandthunder: 96,
  snowshowersandthunder: 96,
  heavysnowshowersandthunder: 99,
};

/**
 * Converts a MET Norway symbol code (e.g. "clearsky_day", "heavyrain") to the
 * nearest WMO numeric code. Strips any trailing _day / _night / _polartwilight
 * suffix before looking up the table. Returns 0 (clear sky) as a safe fallback.
 */
export function yrSymbolToWmo(symbolCode: string): number {
  const base = symbolCode
    .replace(/_day$/, "")
    .replace(/_night$/, "")
    .replace(/_polartwilight$/, "");
  return YR_SYMBOL_TO_WMO[base] ?? 0;
}
