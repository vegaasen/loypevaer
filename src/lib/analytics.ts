/**
 * Thin typed wrappers around gtag for custom GA4 events.
 * All functions are no-ops if gtag is not loaded (e.g. blocked by an ad-blocker)
 * or if the user has not granted analytics consent.
 */

const STORAGE_KEY = "loypevaer:cookie-consent";

/**
 * Called once at app start-up to restore a previously stored consent decision
 * into the GA4 consent state (so returning visitors don't need to re-accept).
 */
export function restoreConsentFromStorage(): void {
  if (typeof gtag === "undefined") return;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "granted" || stored === "denied") {
      gtag("consent", "update", { analytics_storage: stored });
    }
  } catch {
    // private mode — leave default denied
  }
}

function safeGtagEvent(
  eventName: string,
  params: Record<string, string | number>,
) {
  if (typeof gtag === "undefined") return;
  gtag("event", eventName, params);
}

/**
 * Fired when a user navigates to a race/arrangement detail page.
 */
export function trackRaceSelected(
  id: string,
  name: string,
  discipline: string,
) {
  safeGtagEvent("select_race", {
    race_id: id,
    race_name: name,
    discipline,
  });
}

/**
 * Fired when a user clicks a waypoint weather card.
 */
export function trackWaypointSelected(
  raceId: string,
  waypointLabel: string,
  waypointIndex: number,
) {
  safeGtagEvent("select_waypoint", {
    race_id: raceId,
    waypoint_label: waypointLabel,
    waypoint_index: waypointIndex,
  });
}

/**
 * Fired when a user clicks the official race website link.
 */
export function trackExternalLinkClick(url: string, raceName: string) {
  safeGtagEvent("click_race_website", {
    race_name: raceName,
    link_url: url,
  });
}

/**
 * Fired when a GPX file or URL is successfully parsed on the /gpx route.
 * source: "file" = local upload, "url" = loaded from URL.
 */
export function trackGpxLoaded(
  source: "file" | "url",
  distanceKm: number,
  waypointCount: number,
): void {
  safeGtagEvent("gpx_loaded", {
    gpx_source: source,
    gpx_distance_km: distanceKm,
    gpx_waypoint_count: waypointCount,
  });
}

/**
 * Fired when a user submits feedback via the snackbar prompt.
 * value: 5 = thumbs up, 1 = thumbs down (extensible to full 1–5 scale).
 */
export function trackFeedback(value: 1 | 5, eventId: string): void {
  safeGtagEvent("user_feedback", {
    feedback_value: value,
    event_id: eventId,
  });
}
