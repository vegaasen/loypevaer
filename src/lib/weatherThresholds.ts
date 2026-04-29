/**
 * Shared weather threshold constants used by WeatherCard and GearSuggestion.
 * Centralised here so business rules only need to change in one place.
 */

/** Temperature (°C) below which conditions are considered freezing. */
export const TEMP_FREEZE = 0;

/** Temperature (°C) below which conditions are considered very cold. */
export const TEMP_VERY_COLD = 5;

/** Temperature (°C) below which conditions are considered cold. */
export const TEMP_COLD = 10;

/** Precipitation (mm) above which conditions are considered light rain. */
export const PRECIP_LIGHT = 0.5;

/** Precipitation (mm) above which conditions are considered heavy rain. */
export const PRECIP_HEAVY = 2;

/** Wind speed (km/h) above which wind is considered significant for headwind checks. */
export const WIND_SIGNIFICANT = 10;

/** Wind speed (km/h) above which wind is considered strong. */
export const WIND_STRONG = 20;
