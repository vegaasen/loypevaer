import { useMemo } from "react";
import type { Waypoint } from "../lib/weather";

type Props = {
  waypoints: Waypoint[];
  distanceKm: number;
};

// Internal SVG coordinate system
const VW = 480;
const VH = 100;
const PAD = { top: 10, right: 8, bottom: 28, left: 44 };
const PLOT_W = VW - PAD.left - PAD.right;
const PLOT_H = VH - PAD.top - PAD.bottom;
const BASELINE = PAD.top + PLOT_H;

// Waypoints are always at these distance fractions
const FRACTIONS = [0, 0.25, 0.5, 0.75, 1.0];

export function ElevationProfile({ waypoints, distanceKm }: Props) {
  const derived = useMemo(() => {
    const withAlt = waypoints.filter((w) => w.altitude != null);
    if (withAlt.length < 2) return null;

    const altitudes = withAlt.map((w) => w.altitude!);
    const rawMin = Math.min(...altitudes);
    const rawMax = Math.max(...altitudes);

    // Ensure a minimum visual altitude range so flat profiles aren't degenerate
    const MIN_RANGE = 100;
    const rawSpread = rawMax - rawMin;
    let visMin = rawMin;
    let visMax = rawMax;
    if (rawSpread < MIN_RANGE) {
      const extra = (MIN_RANGE - rawSpread) / 2;
      visMin = Math.max(0, rawMin - extra);
      visMax = visMin + MIN_RANGE;
    }

    const toX = (fraction: number) => PAD.left + fraction * PLOT_W;
    const toY = (alt: number) =>
      PAD.top + PLOT_H - ((alt - visMin) / (visMax - visMin)) * PLOT_H;

    const points = withAlt.map((w, i) => ({
      x: toX(FRACTIONS[i] ?? i / (withAlt.length - 1)),
      y: toY(w.altitude!),
      alt: w.altitude!,
      label: w.label,
      km: Math.round((FRACTIONS[i] ?? i / (withAlt.length - 1)) * distanceKm),
    }));

    const lineCoords = points.map((p) => `${p.x},${p.y}`).join(" ");
    const areaPath = [
      `M ${points[0].x},${points[0].y}`,
      ...points.slice(1).map((p) => `L ${p.x},${p.y}`),
      `L ${points[points.length - 1].x},${BASELINE}`,
      `L ${points[0].x},${BASELINE}`,
      "Z",
    ].join(" ");

    return { points, lineCoords, areaPath, rawMin, rawMax, visMin, visMax };
  }, [waypoints, distanceKm]);

  if (!derived) return null;

  const { points, lineCoords, areaPath, rawMin, rawMax, visMin, visMax } = derived;

  return (
    <details className="elevation-profile__details">
      <summary className="elevation-profile__summary">
        Høydeprofil
      </summary>
      <div className="elevation-profile__body">
    <div className="elevation-profile">
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        className="elevation-profile__svg"
        role="img"
        aria-label={`Høydeprofil: ${rawMin}–${rawMax} m o.h.`}
        preserveAspectRatio="none"
      >
        {/* Filled area */}
        <path d={areaPath} className="elevation-profile__area" />

        {/* Profile line */}
        <polyline
          points={lineCoords}
          className="elevation-profile__line"
          fill="none"
        />

        {/* Waypoint dots with native SVG tooltips */}
        {points.map((p, i) => (
          <g key={i} className="elevation-profile__point">
            <title>{`${p.label}: ${p.alt} m o.h.`}</title>
            {/* Larger invisible hit area for tooltip */}
            <circle cx={p.x} cy={p.y} r={10} opacity={0} />
            <circle cx={p.x} cy={p.y} r={3} className="elevation-profile__dot" />
            {/* km label below the chart */}
            <text
              x={p.x}
              y={BASELINE + 14}
              className="elevation-profile__km-label"
              textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"}
            >
              {p.km} km
            </text>
          </g>
        ))}

        {/* Min altitude label (bottom-left) */}
        <text
          x={PAD.left - 4}
          y={BASELINE}
          className="elevation-profile__alt-label"
          textAnchor="end"
          dominantBaseline="auto"
        >
          {Math.round(visMin)} m
        </text>

        {/* Max altitude label (top-left) */}
        <text
          x={PAD.left - 4}
          y={PAD.top}
          className="elevation-profile__alt-label"
          textAnchor="end"
          dominantBaseline="hanging"
        >
          {Math.round(visMax)} m
        </text>
      </svg>
    </div>
      </div>
    </details>
  );
}
