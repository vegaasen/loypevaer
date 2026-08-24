import { useEffect, useRef, useState } from "react";
import type { Discipline } from "../lib/arrangements";
import { calcFinishTimeFromSpeed, formatPace, paceToKmh } from "../lib/timing";

/** Computes implied speed (km/h) from start/finish times and distance. Returns null if invalid. */
function impliedSpeedKmh(startTime: string, finishTime: string, distanceKm: number): number | null {
  const [sh, sm] = startTime.split(":").map(Number);
  const [fh, fm] = finishTime.split(":").map(Number);
  if ([sh, sm, fh, fm].some(Number.isNaN)) return null;
  let durationH = fh + fm / 60 - (sh + sm / 60);
  if (durationH <= 0) durationH += 24; // midnight crossing
  return distanceKm / durationH;
}

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
      startTimeRef.current?.focus();
      return;
    }
    const kmh = isPace ? paceToKmh(raw) : raw;
    const computed = calcFinishTimeFromSpeed(startTime, distanceKm, kmh);
    setSelectedSpeed(raw);
    setPendingSpeed("");
    onFinishChange(computed);
  }

  function handleFinishChange(time: string) {
    // User typed a custom finish time — deselect any chip
    setSelectedSpeed("");
    setPendingSpeed("");
    onFinishChange(time);
  }

  // Implied speed when no chip is selected but timing is active
  const impliedKmh =
    selectedSpeed === "" && timingActive && distanceKm != null
      ? impliedSpeedKmh(startTime, finishTime, distanceKm)
      : null;

  const startTimeRef = useRef<HTMLInputElement>(null);
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

  // Clear pending speed if distanceKm changes (stale chip guard)
  // biome-ignore lint/correctness/useExhaustiveDependencies: distanceKm is the trigger
  useEffect(() => {
    setPendingSpeed("");
  }, [distanceKm]);

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
          ref={startTimeRef}
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
                  aria-pressed={isSelected || isPending}
                >
                  <span className="speed-chip__value">
                    {isPace ? `${formatPace(val)} min/km` : `${val} km/t`}
                  </span>
                  <span className="speed-chip__duration">~{formatDuration(estHours)}</span>
                </button>
              );
            })}
            {impliedKmh != null && (
              <span className="speed-chip speed-chip--custom" aria-label="Egendefinert tid">
                <span className="speed-chip__value">
                  {isPace
                    ? `${formatPace(60 / impliedKmh)} min/km`
                    : `~${impliedKmh.toFixed(0)} km/t`}
                </span>
                <span className="speed-chip__duration">tilpasset</span>
              </span>
            )}
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
          onChange={(e) => handleFinishChange(e.target.value)}
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
