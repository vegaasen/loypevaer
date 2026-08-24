import { useWeather } from "../hooks/useWeather";
import { dominantWind } from "../lib/dominantWind";
import type { Waypoint } from "../lib/weather";
import { EventCard } from "./EventCard";

type Props = React.ComponentProps<typeof EventCard> & {
  waypoints: Waypoint[];
  date: string;
};

export function EventCardWithWind({ waypoints, date, ...cardProps }: Props) {
  const results = useWeather(waypoints, date);
  const wind = dominantWind(results, waypoints);
  const safeWind = wind === "Sidevind" ? null : wind;
  return <EventCard {...cardProps} windSummary={safeWind} />;
}
