interface Props {
  /** °C per year, e.g. +0.23 or -0.05 */
  slope: number;
}

/**
 * Shows a compact trend indicator.
 * ↑ warming / ↓ cooling / → flat (|slope| < 0.05)
 */
export function TrendBadge({ slope }: Props) {
  const abs = Math.abs(slope);
  const isFlat = abs < 0.05;
  const direction = isFlat ? "flat" : slope > 0 ? "up" : "down";
  const arrow = direction === "up" ? "↑" : direction === "down" ? "↓" : "→";
  const label = isFlat ? "Stabil temperatur" : `${slope > 0 ? "+" : ""}${slope.toFixed(2)} °C/år`;

  return (
    <span className={`trend-badge trend-badge--${direction}`} title={label}>
      {arrow} {isFlat ? "Stabil" : label}
    </span>
  );
}
