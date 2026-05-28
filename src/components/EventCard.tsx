import { memo } from "react";
import { Link } from "react-router-dom";
import { type Discipline } from "../lib/arrangements";
import { DISCIPLINE_LABEL } from "../lib/disciplines";
import { formatNorwegianDate } from "../lib/dates";

type Props = {
  id: string;
  name: string;
  officialDate: string;
  distance: number;
  /** Human-readable distance label (e.g. "750m / 20km / 5km" for triathlon). Falls back to `{distance} km`. */
  distanceLabel?: string;
  region: string;
  discipline: Discipline;
  /** Override the displayed date (e.g. show saved planned date instead of official date) */
  displayDate?: string;
  planned?: boolean;
  onTogglePlanned?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /** Countdown string, e.g. "om 3 dager" or "i dag" */
  countdown?: string;
  /** True when the race date has already passed */
  isPast?: boolean;
  /** "pending" = date not yet officially confirmed; "cancelled" = event has been cancelled */
  dateStatus?: "pending" | "cancelled";
};

export const EventCard = memo(function EventCard({
  id,
  name,
  officialDate,
  distance,
  distanceLabel,
  region,
  discipline,
  displayDate,
  planned = false,
  onTogglePlanned,
  countdown,
  isPast = false,
  dateStatus,
}: Props) {
  const dateStr = displayDate ?? officialDate;
  const formattedDate = formatNorwegianDate(dateStr);
  const isCancelled = dateStatus === "cancelled";
  const isCompactPast = isPast && !planned && !isCancelled;

  return (
    <Link
      to={`/arrangement/${id}`}
      state={{ from: "/" }}
      className={[
        "ritt-card",
        planned ? "ritt-card--planned" : "",
        isPast ? "ritt-card--past" : "",
        isCompactPast ? "ritt-card--past-compact" : "",
        isCancelled ? "ritt-card--cancelled" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-date={isCompactPast ? formattedDate : undefined}
    >
      <div className="ritt-card__name">
        <span title={name}>{name}</span>
        {onTogglePlanned && !isCompactPast && (
          <button
            className={`ritt-card__bookmark${planned ? " ritt-card__bookmark--active" : ""}`}
            onClick={onTogglePlanned}
            aria-label={planned ? "Fjern fra mine arrangement" : "Legg til mine arrangement"}
            aria-pressed={planned}
          >
            <span aria-hidden="true">{planned ? "📌" : "📍"}</span>
            <span className="ritt-card__bookmark-label">{planned ? "Lagret" : "Lagre"}</span>
          </button>
        )}
      </div>
      <div className="ritt-card__meta">
        <span className="ritt-card__region">{region}</span>
        <span className="ritt-card__distance">{distanceLabel ?? `${distance} km`}</span>
      </div>
      <div
        className={`ritt-card__footer${dateStatus === "pending" ? " ritt-card__footer--pending" : ""}${isCancelled ? " ritt-card__footer--cancelled" : ""}`}
      >
        <div className="ritt-card__footer-main">
          <span className={`ritt-card__discipline ritt-card__discipline--${discipline}`}>
            {DISCIPLINE_LABEL[discipline]}
          </span>
          <div className="ritt-card__footer-right">
            <span className="ritt-card__date">{formattedDate}</span>
            {countdown && !isCancelled && (
              <span className="ritt-card__countdown">{countdown}</span>
            )}
          </div>
        </div>
        {dateStatus === "pending" && (
          <div className="ritt-card__footer-tentative">
            <span className="ritt-card__pending" title="Datoen er ikke offisielt bekreftet ennå">Tentativ dato</span>
          </div>
        )}
        {isCancelled && (
          <div className="ritt-card__footer-cancelled">
            <span className="ritt-card__cancelled-badge" title="Dette arrangementet er avlyst">Avlyst</span>
          </div>
        )}
      </div>
    </Link>
  );
});
