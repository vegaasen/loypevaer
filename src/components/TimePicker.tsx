import { useState } from "react";
import type { Discipline } from "../lib/arrangements";
import { calcFinishTimeFromSpeed, formatPace, paceToKmh } from "../lib/timing";

const SPEED_OPTIONS = [15, 18, 20, 22, 25, 28, 30, 32, 35, 38, 40] as const;

function formatDuration(decimalHours: number): string {
  const hrs = Math.floor(decimalHours);
  const mins = Math.round((decimalHours - hrs) * 60);
  if (mins === 0) return `${hrs}t`;
  return `${hrs}t ${mins}m`;
}
// Pace options in decimal min/km — displayed as mm:ss
const PACE_OPTIONS = [
  3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 9.0, 10.0, 12.0,
] as const;

type Props = {
  startTime: string;
  finishTime: string;
  onStartChange: (time: string) => void;
  onFinishChange: (time: string) => void;
  onClear: () => void;
  /** Race distance in km. When provided, enables speed-based finish time calculation. */
  distanceKm?: number;
  /** Known mass-start time in "HH:MM". When provided and startTime is empty, shows a prefill hint. */
  officialStartTime?: string;
  /** When "løping", shows a pace picker (min/km) instead of a speed picker (km/t). */
  discipline?: Discipline;
};

export function TimePicker({
  startTime,
  finishTime,
  onStartChange,
  onFinishChange,
  onClear,
  distanceKm,
  officialStartTime,
  discipline,
}: Props) {
  const hasValues = startTime !== "" || finishTime !== "";
  const timingActive = startTime !== "" && finishTime !== "";
  const [selectedSpeed, setSelectedSpeed] = useState("");
  const isPace = discipline === "løping";

  function handleSpeedChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const raw = Number(e.target.value);
    if (!raw || !startTime || !distanceKm) return;
    setSelectedSpeed(e.target.value);
    const kmh = isPace ? paceToKmh(raw) : raw;
    const computed = calcFinishTimeFromSpeed(startTime, distanceKm, kmh);
    onFinishChange(computed);
  }

  return (
    <>
      <div className="picker-field">
        <label htmlFor="ritt-start-time" className="picker-field__label">
          Starttid
          {officialStartTime && !startTime && (
            <button
              type="button"
              className="picker-field__reset-link"
              onClick={() => onStartChange(officialStartTime)}
            >
              ↩ {officialStartTime}
            </button>
          )}
        </label>
        <input
          id="ritt-start-time"
          type="time"
          value={startTime}
          onChange={(e) => onStartChange(e.target.value)}
          className="picker-field__input"
        />
      </div>

      {distanceKm != null && (
        <div className="picker-field">
          <label htmlFor="ritt-speed" className="picker-field__label">
            {isPace ? "Tempo" : "Fart"}
          </label>
          <select
            id="ritt-speed"
            className="picker-field__input picker-field__select"
            value={startTime ? selectedSpeed : ""}
            onChange={handleSpeedChange}
            disabled={!startTime}
          >
            <option value="" disabled>
              {isPace ? "Velg…" : "Velg…"}
            </option>
            {isPace
              ? PACE_OPTIONS.map((p) => {
                  const estHours = distanceKm
                    ? Math.round(((distanceKm * p) / 60) * 10) / 10
                    : null;
                  return (
                    <option key={p} value={p}>
                      {formatPace(p)} min/km
                      {estHours != null ? ` ≈ ${formatDuration(estHours)}` : ""}
                    </option>
                  );
                })
              : SPEED_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s} km/t{distanceKm ? ` ≈ ${formatDuration(distanceKm / s)}` : ""}
                  </option>
                ))}
          </select>
        </div>
      )}

      <div className="picker-field">
        <label htmlFor="ritt-finish-time" className="picker-field__label">
          Sluttid
        </label>
        <input
          id="ritt-finish-time"
          type="time"
          value={finishTime}
          onChange={(e) => onFinishChange(e.target.value)}
          className="picker-field__input"
        />
      </div>

      {hasValues && (
        <button
          type="button"
          onClick={onClear}
          className="picker-field__clear"
          title="Fjern tider"
          aria-label="Fjern tider"
        >
          ×
        </button>
      )}

      {timingActive && (
        <div className="ritt-page__timing-hint">
          Viser vær ved forventet ankomsttid på hvert punkt
        </div>
      )}
    </>
  );
}
