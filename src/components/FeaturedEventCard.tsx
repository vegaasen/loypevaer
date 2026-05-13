import { memo } from "react";
import { Link } from "react-router-dom";
import { type Discipline } from "../lib/arrangements";
import { DISCIPLINE_LABEL } from "../lib/disciplines";

type Props = {
  id: string;
  name: string;
  officialDate: string;
  distance: number;
  distanceLabel?: string;
  region: string;
  discipline: Discipline;
  planned?: boolean;
  onTogglePlanned?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  countdown?: string;
  isPast?: boolean;
  dateStatus?: "pending" | "cancelled";
};

export const FeaturedEventCard = memo(function FeaturedEventCard({
  id,
  name,
  distance,
  distanceLabel,
  region,
  discipline,
  planned = false,
  onTogglePlanned,
  countdown,
  isPast = false,
  dateStatus,
}: Props) {
  const isCancelled = dateStatus === "cancelled";
  const isLongLabel = !!distanceLabel && (distanceLabel.includes("/") || distanceLabel.length > 15);

  return (
    <Link
      to={`/arrangement/${id}`}
      state={{ from: "/" }}
      className={`featured-card${isPast ? " featured-card--past" : ""}${isCancelled ? " featured-card--cancelled" : ""}`}
    >
      <div className="featured-card__header">
        <span className={`featured-card__discipline featured-card__discipline--${discipline}`}>
          {DISCIPLINE_LABEL[discipline]}
        </span>
        {countdown && !isCancelled && (
          <span className="featured-card__countdown">{countdown}</span>
        )}
      </div>

      <div className="featured-card__body">
        <span className="featured-card__name">{name}</span>
        <span className="featured-card__region">{region}</span>
      </div>

      <div className="featured-card__footer">
        <span className={`featured-card__distance${isLongLabel ? " featured-card__distance--compact" : ""}`}>
          {distanceLabel ?? `${distance} km`}
        </span>
        {onTogglePlanned && (
          <button
            className={`featured-card__bookmark${planned ? " featured-card__bookmark--active" : ""}`}
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
});
