import { Link } from "react-router-dom";

type Props = {
  id: string;
  name: string;
  officialDate: string;
  distance: number;
  region: string;
  discipline?: "landevei" | "terreng";
  /** Override the displayed date (e.g. show saved planned date instead of official date) */
  displayDate?: string;
  planned?: boolean;
  onTogglePlanned?: (e: React.MouseEvent<HTMLButtonElement>) => void;
};

const DISCIPLINE_LABEL: Record<"landevei" | "terreng", string> = {
  landevei: "Landevei",
  terreng: "Terreng",
};

export function RittCard({
  id,
  name,
  officialDate,
  distance,
  region,
  discipline,
  displayDate,
  planned = false,
  onTogglePlanned,
}: Props) {
  const dateStr = displayDate ?? officialDate;
  const formattedDate = new Date(dateStr).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Link
      to={`ritt/${id}`}
      className={`ritt-card${planned ? " ritt-card--planned" : ""}`}
    >
      <div className="ritt-card__name">{name}</div>
      <div className="ritt-card__meta">
        <span className="ritt-card__region">{region}</span>
        <span className="ritt-card__distance">{distance} km</span>
        {discipline && (
          <span className={`ritt-card__discipline ritt-card__discipline--${discipline}`}>
            {DISCIPLINE_LABEL[discipline]}
          </span>
        )}
      </div>
      <div className="ritt-card__footer">
        <span className="ritt-card__date">{formattedDate}</span>
        {onTogglePlanned && (
          <button
            className={`ritt-card__bookmark${planned ? " ritt-card__bookmark--active" : ""}`}
            onClick={onTogglePlanned}
            title={planned ? "Fjern fra mine ritt" : "Legg til mine ritt"}
            aria-label={planned ? "Fjern fra mine ritt" : "Legg til mine ritt"}
            aria-pressed={planned}
          >
            {planned ? "📌" : "📍"}
          </button>
        )}
      </div>
    </Link>
  );
}
