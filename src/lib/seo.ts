/**
 * Shared SEO constants — single source of truth for canonical URLs,
 * sitemap generation, and Open Graph tags.
 */

/** Canonical base URL (unicode form, for meta tags / OG). No trailing slash. */
export const SITE_URL = "https://www.løypevær.no";


/**
 * Norwegian SEO keywords per discipline — used in meta titles and descriptions
 * to target searches like "løypevær", "sykkelvær", "triathlonvær" etc.
 */
export function disciplineKeywords(discipline: string): string {
  switch (discipline) {
    case "landevei":
      return "sykkelvær, rittvær, landevei værmelding";
    case "terreng":
      return "terrengvær, sykkelvær, MTB vær, terrengsykkelværmelding";
    case "langrenn":
      return "langrenn vær, skivær, rennvær, skiføre";
    case "triathlon":
      return "triathlon vær Norge, triathlon værmelding, triathlonvær";
    case "ultraløp":
      return "ultraløp vær, løpsvær, ultramaraton vær";
    case "løping":
      return "løpsvær, løp vær, maratonvær, halvmaratonvær";
    default:
      return "løypevær, arrangementvær, utholdenhetsarrangement vær";
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
 * Norwegian verb phrase for use in "Skal du [verb] X?"-style descriptions.
 */
export function disciplineVerb(discipline: string): string {
  switch (discipline) {
    case "landevei":
      return "sykle";
    case "terreng":
      return "sykle";
    case "langrenn":
      return "gå";
    case "triathlon":
      return "gjennomføre";
    case "ultraløp":
      return "løpe";
    case "løping":
      return "løpe";
    default:
      return "delta i";
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
