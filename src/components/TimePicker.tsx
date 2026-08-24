import { useEffect, useRef, useState } from "react";
import type { Discipline } from "../lib/arrangements";
import { calcFinishTimeFromSpeed, formatPace, paceToKmh } from "../lib/timing";

const SPEED_CHIPS = [15, 20, 25, 30, 35] as const;
const PACE_CHIPS = [4.0, 5.0, 6.0, 7.0, 8.0] as const;

function formatDuration(decimalHours: number): string {
  const hrs = Math.floor(decimalHours);
  const mins = Math.round((decimalHours - hrs) * 60);
  if (mins === 0) return `${hrs}t`;
  return `${hrs}t ${mins}m`;
}

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
  const [selectedSpeed, setSelectedSpeed] = useState<number | "">("");
  const [pendingSpeed, setPendingSpeed] = useState<number | "">("");
  const isPace = discipline === "løping";

  function handleChipClick(raw: number) {
    if (!distanceKm) return;
    if (!startTime) {
      setPendingSpeed(raw);
      setSelectedSpeed("");
      document.getElementById("ritt-start-time")?.focus();
      return;
    }
    const kmh = isPace ? paceToKmh(raw) : raw;
    const computed = calcFinishTimeFromSpeed(startTime, distanceKm, kmh);
    setSelectedSpeed(raw);
    setPendingSpeed("");
    onFinishChange(computed);
  }

  const onFinishChangeRef = useRef(onFinishChange);
  useEffect(() => {
    onFinishChangeRef.current = onFinishChange;
  });

  useEffect(() => {
    if (!pendingSpeed || !startTime || !distanceKm) return;
    const kmh = isPace ? paceToKmh(pendingSpeed) : pendingSpeed;
    const computed = calcFinishTimeFromSpeed(startTime, distanceKm, kmh);
    setSelectedSpeed(pendingSpeed);
    setPendingSpeed("");
    onFinishChangeRef.current(computed);
  }, [startTime, pendingSpeed, distanceKm, isPace]);

  useEffect(() => {
    if (startTime === "" && finishTime === "") {
      setSelectedSpeed("");
      setPendingSpeed("");
    }
  }, [startTime, finishTime]);

  return (
    <>
      <div className="picker-field">
        <label htmlFor="ritt-start-time" className="picker-field__label">
          Starttid
          {pendingSpeed && !startTime && (
            <span className="picker-field__hint">← sett starttid</span>
          )}
          {officialStartTime && !startTime && !pendingSpeed && (
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
          className={["picker-field__input", pendingSpeed ? "picker-field__input--highlight" : ""]
            .filter(Boolean)
            .join(" ")}
        />
      </div>

      {distanceKm != null && (
        <div className="speed-chips">
          <div className="speed-chips__label">{isPace ? "Tempo" : "Fart"}</div>
          <div className="speed-chips__row">
            {(isPace ? PACE_CHIPS : SPEED_CHIPS).map((val) => {
              const estHours = isPace ? (distanceKm * val) / 60 : distanceKm / val;
              const isSelected = selectedSpeed === val;
              const isPending = pendingSpeed === val;
              return (
                <button
                  key={val}
                  type="button"
                  className={[
                    "speed-chip",
                    isSelected ? "speed-chip--selected" : "",
                    isPending ? "speed-chip--pending" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => handleChipClick(val)}
                  aria-pressed={isSelected}
                >
                  <span className="speed-chip__value">
                    {isPace ? `${formatPace(val)} min/km` : `${val} km/t`}
                  </span>
                  <span className="speed-chip__duration">~{formatDuration(estHours)}</span>
                </button>
              );
            })}
          </div>
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
