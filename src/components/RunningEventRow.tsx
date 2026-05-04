import { Link } from "react-router-dom";
import { type Discipline } from "../lib/arrangements";
import { formatNorwegianDate } from "../lib/dates";
import { getRunningCategory, RUNNING_CATEGORY_LABEL } from "../lib/runningCategory";

type Props = {
  id: string;
  name: string;
  officialDate: string;
  distance: number;
  distanceLabel?: string;
  region: string;
  discipline: Discipline;
  displayDate?: string;
  planned?: boolean;
  onTogglePlanned?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  countdown?: string;
  isPast?: boolean;
  dateStatus?: "pending" | "cancelled";
};

export function RunningEventRow({
  id,
  name,
  officialDate,
  distance,
  distanceLabel,
  region,
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
  const category = getRunningCategory(distance);
  const categoryLabel = RUNNING_CATEGORY_LABEL[category];

  return (
    <Link
      to={`/arrangement/${id}`}
      className={[
        "running-row",
        planned ? "running-row--planned" : "",
        isPast ? "running-row--past" : "",
        isCancelled ? "running-row--cancelled" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="running-row__name">
        <span>{name}</span>
        {isCancelled && (
          <span className="running-row__cancelled-badge" title="Avlyst">Avlyst</span>
        )}
        {dateStatus === "pending" && !isCancelled && (
          <span className="running-row__pending-badge" title="Tentativ dato">Tentativ</span>
        )}
      </div>

      <div className="running-row__meta">
        <span className="running-row__region">{region}</span>
        <span className={`running-row__category running-row__category--${category}`}>
          {categoryLabel}
        </span>
        <span className="running-row__distance">{distanceLabel ?? `${distance} km`}</span>
      </div>

      <div className="running-row__right">
        <span className="running-row__date">{formattedDate}</span>
        {countdown && !isCancelled && (
          <span className="running-row__countdown">{countdown}</span>
        )}
        {onTogglePlanned && (
          <button
            className={`running-row__bookmark${planned ? " running-row__bookmark--active" : ""}`}
            onClick={onTogglePlanned}
            aria-label={planned ? "Fjern fra mine arrangement" : "Legg til mine arrangement"}
            aria-pressed={planned}
          >
            <span aria-hidden="true">{planned ? "📌" : "📍"}</span>
          </button>
        )}
      </div>
    </Link>
  );
}
