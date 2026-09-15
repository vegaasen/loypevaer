// src/components/WaxTips.tsx
import type { WaxTips as WaxTipsData } from "../lib/waxTips";

type Props = {
  tips: WaxTipsData;
};

export function WaxTips({ tips }: Props) {
  return (
    <div className="wax-tips">
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
  );
}
