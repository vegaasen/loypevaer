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
