import { Link } from "react-router-dom";

type Props = {
  id: string;
  name: string;
  officialDate: string;
  distance: number;
  region: string;
};

export function RittCard({ id, name, officialDate, distance, region }: Props) {
  const formattedDate = new Date(officialDate).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Link to={`/ritt/${id}`} className="ritt-card">
      <div className="ritt-card__name">{name}</div>
      <div className="ritt-card__meta">
        <span className="ritt-card__region">{region}</span>
        <span className="ritt-card__distance">{distance} km</span>
      </div>
      <div className="ritt-card__date">{formattedDate}</div>
    </Link>
  );
}
