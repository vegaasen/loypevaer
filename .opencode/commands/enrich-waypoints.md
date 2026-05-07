---
description: Enrich a cycling event with waypoints from a GPX file
---

Run the waypoint enrichment script for a cycling event.

Usage: /enrich-waypoints <event-id> <path-to-gpx>

Arguments provided: $ARGUMENTS

Please run:
  bun scripts/enrich-cycling-waypoints.ts $ARGUMENTS

Then confirm the enriched waypoints look correct, and remind the user to run
`bun run fetch-weather` afterwards to update the historical weather cache for
the new waypoints.

If no arguments are provided, explain:
- event-id: the kebab-case id from src/data/cycling-events.json (e.g. "birkebeinerrittet-2026")
- path-to-gpx: path to a GPX route file for this event (e.g. ~/Downloads/birken.gpx)

You can find available event IDs by searching src/data/cycling-events.json.
