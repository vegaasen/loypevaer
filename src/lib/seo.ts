/**
 * Shared SEO constants — single source of truth for canonical URLs,
 * sitemap generation, and Open Graph tags.
 */

/** Canonical base URL (unicode form, for meta tags / OG). No trailing slash. */
export const SITE_URL = "https://www.løypevær.no";

/** ASCII-safe (punycode) base URL for XML sitemap and robots.txt. No trailing slash. */
export const SITE_URL_ASCII = "https://www.xn--lypevaer-d8a.no";

/**
 * Norwegian SEO keywords per discipline — used in meta titles and descriptions
 * to target searches like "rittvær", "triathlon vær", "løpsvær" etc.
 */
export function disciplineKeywords(discipline: string): string {
  switch (discipline) {
    case "landevei":
      return "rittvær, sykkelritt vær, landevei værmelding";
    case "terreng":
      return "rittvær terreng, MTB vær, terrengsykkel værmelding";
    case "langrenn":
      return "langrenn vær, skivær, rennvær, skiføre";
    case "triathlon":
      return "triathlon vær Norge, triathlon værmelding, triathlonvær";
    case "ultraløp":
      return "ultraløp vær, løpsvær, ultramaraton vær";
    case "løping":
      return "løpsvær, løp vær, maratonvær, halvmaratonvær";
    default:
      return "rittvær, utholdenhetsarrangement vær";
  }
}

/**
 * Short discipline label in Norwegian for use in SEO titles.
 */
export function disciplineSeoLabel(discipline: string): string {
  switch (discipline) {
    case "landevei":
      return "sykkelritt (landevei)";
    case "terreng":
      return "terrengritt";
    case "langrenn":
      return "langrenn";
    case "triathlon":
      return "triathlon";
    case "ultraløp":
      return "ultraløp";
    case "løping":
      return "løp";
    default:
      return "utholdenhetsarrangement";
  }
}

/**
 * Map internal discipline keys to English sport names for Schema.org.
 */
export function disciplineToSport(discipline: string): string {
  switch (discipline) {
    case "landevei":
      return "Road Cycling";
    case "terreng":
      return "Mountain Biking";
    case "langrenn":
      return "Cross-Country Skiing";
    case "triathlon":
      return "Triathlon";
    case "ultraløp":
      return "Ultramarathon";
    case "løping":
      return "Running";
    default:
      return "Endurance Sports";
  }
}
