// src/components/WaxTips.tsx
import type { WaypointWeather } from "../hooks/useWeather";
import { gearGroup } from "../lib/disciplines";
import { getWaxTips } from "../lib/waxTips";
import { resolveWeatherValues } from "../lib/weather";

type Props = {
  results: WaypointWeather[];
  discipline: string;
};

export function WaxTips({ results, discipline }: Props) {
  if (gearGroup(discipline) !== "ski") return null;

  const loaded = results.filter((r) => r.data != null);
  if (loaded.length === 0) return null;

  const temps = loaded.map((r) => resolveWeatherValues(r.data!).temp);
  const tips = getWaxTips(Math.min(...temps), Math.max(...temps));

  return (
    <details className="wax-tips__details">
      <summary className="wax-tips__summary">Smøretips</summary>
      <div className="wax-tips__body">
        <div className="gear-suggestion__heading">Smøretips (klassisk)</div>
        <ul className="wax-tips__list">
          <li>
            <span className="wax-tips__label">Feste:</span> {tips.grip.label} ({tips.grip.range})
          </li>
          <li>
            <span className="wax-tips__label">Glid:</span> {tips.glide.label} ({tips.glide.range})
          </li>
        </ul>
        {tips.wideRange && (
          <p className="wax-tips__note">
            Stort temperaturspenn langs løypa — vurder klister eller test smøring på stedet.
          </p>
        )}
        <p className="wax-tips__disclaimer">
          Basert på lufttemperatur, ikke snøtemperatur — bruk som utgangspunkt og test smøring før
          start.
        </p>
      </div>
    </details>
  );
}
