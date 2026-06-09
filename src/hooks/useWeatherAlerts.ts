// src/hooks/useWeatherAlerts.ts
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { allArrangements } from "../lib/arrangements";
import { isForecastRange, getWeatherCache } from "../lib/weather";
import { hasSignificantChange, type WeatherSnapshot } from "../lib/alertDiff";

const SNAPSHOTS_KEY = "weather-alert-snapshots";
const OPTED_IN_KEY = "weather-alert-events";
const STORAGE_KEY = "loypevaer:mine-ritt";

type PlannedEntry = { date: string };
type Store = Record<string, PlannedEntry>;
type Snapshots = Record<string, WeatherSnapshot>;
type OptedIn = Record<string, boolean>;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * On mount, checks bookmarked events for forecast changes and fires
 * browser Notification if permission is granted and a significant
 * change is detected. Notifications are client-pull — they fire on
 * the next app load, not server-initiated.
 */
export function useWeatherAlerts() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const store = readJson<Store>(STORAGE_KEY, {});
    const optedIn = readJson<OptedIn>(OPTED_IN_KEY, {});
    const snapshots = readJson<Snapshots>(SNAPSHOTS_KEY, {});

    const eligible = Object.entries(store).filter(
      ([id, entry]) => optedIn[id] && entry.date && isForecastRange(entry.date)
    );

    if (eligible.length === 0) return;

    void (async () => {
      // Warm the weather cache (it's a singleton, so this is cheap if already loaded)
      await getWeatherCache();

      for (const [id, entry] of eligible) {
        const event = allArrangements.find((e) => e.id === id);
        if (!event || event.waypoints.length === 0) continue;

        // Fetch current weather for first waypoint (lightweight)
        const wp = event.waypoints[0];
        const cached = queryClient.getQueryData<import("../lib/weather").WeatherData>([
          "weather",
          wp.lat,
          wp.lon,
          entry.date,
        ]);
        if (!cached) continue;

        const next: WeatherSnapshot = {
          tempMax: cached.tempMax,
          precipProbability: cached.precipitationProbability ?? 0,
          windSpeed: cached.windSpeed,
        };

        const prev = snapshots[id];
        if (!prev) {
          // First run — store snapshot, no notification
          snapshots[id] = next;
          continue;
        }

        const { changed, summary } = hasSignificantChange(prev, next);
        if (changed) {
          new Notification(`Værvarsel endret – ${event.name}`, {
            body: summary,
            tag: `weather-alert-${id}`,
          });
        }

        snapshots[id] = next;
      }

      localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots));
    })();
  // Run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
