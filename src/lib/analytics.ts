/**
 * Thin typed wrappers around gtag for custom GA4 events.
 * All functions are no-ops if gtag is not loaded (e.g. blocked by an ad-blocker).
 */

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
