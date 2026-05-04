import { useState } from "react";
import { calcFinishTimeFromSpeed, formatPace, paceToKmh } from "../lib/timing";
import type { Discipline } from "../lib/arrangements";

const SPEED_OPTIONS = [15, 18, 20, 22, 25, 28, 30, 32, 35, 38, 40] as const;
// Pace options in decimal min/km — displayed as mm:ss
const PACE_OPTIONS = [3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 9.0, 10.0, 12.0] as const;

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
    <div className="time-picker">
      <div className="time-picker__controls">
        <div className="time-picker__field">
          <label htmlFor="ritt-start-time" className="time-picker__label">
            Starttid
            {officialStartTime && !startTime && (
              <button
                type="button"
                className="time-picker__prefill"
                onClick={() => onStartChange(officialStartTime)}
              >
                Bruk offisiell starttid ({officialStartTime})
              </button>
            )}
          </label>
          <input
            id="ritt-start-time"
            type="time"
            value={startTime}
            onChange={(e) => onStartChange(e.target.value)}
            className="time-picker__input"
          />
        </div>

        {distanceKm != null && (
          <div className="time-picker__field">
            <label htmlFor="ritt-speed" className="time-picker__label">
              {isPace ? "Tempo (min/km)" : "Fart (km/t)"}
            </label>
            <select
              id="ritt-speed"
              className="time-picker__input time-picker__speed-select"
              value={startTime ? selectedSpeed : ""}
              onChange={handleSpeedChange}
              disabled={!startTime}
            >
              <option value="" disabled>
                {isPace ? "Velg tempo…" : "Velg fart…"}
              </option>
              {isPace
                ? PACE_OPTIONS.map((p) => {
                    const estHours = distanceKm
                      ? Math.round((distanceKm * p) / 60 * 10) / 10
                      : null;
                    return (
                      <option key={p} value={p}>
                        {formatPace(p)} min/km
                        {estHours != null ? ` ≈ ${estHours} t` : ""}
                      </option>
                    );
                  })
                : SPEED_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s} km/t
                      {distanceKm
                        ? ` ≈ ${Math.round((distanceKm / s) * 10) / 10} t`
                        : ""}
                    </option>
                  ))}
            </select>
          </div>
        )}

        <div className="time-picker__field">
          <label htmlFor="ritt-finish-time" className="time-picker__label">
            Forventet sluttid
          </label>
          <input
            id="ritt-finish-time"
            type="time"
            value={finishTime}
            onChange={(e) => onFinishChange(e.target.value)}
            className="time-picker__input"
          />
        </div>

        {hasValues && (
          <button
            type="button"
            onClick={onClear}
            className="time-picker__clear"
          >
            Fjern tider
          </button>
        )}
      </div>
      {timingActive && (
        <div className="time-picker__hint">
          Viser vær ved forventet ankomsttid på hvert punkt
        </div>
      )}
    </div>
  );
}
