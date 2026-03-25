import { useParams, useSearchParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { DatePicker } from "../components/DatePicker";
import { WeatherStrip } from "../components/WeatherStrip";
import ritt from "../data/ritt.json";

export function RittPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const rittData = ritt.find((r) => r.id === id);

  const initialDate = searchParams.get("date") ?? rittData?.officialDate ?? "";
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);

  // Keep URL in sync with selected date
  useEffect(() => {
    if (selectedDate) {
      setSearchParams({ date: selectedDate }, { replace: true });
    }
  }, [selectedDate, setSearchParams]);

  if (!rittData) {
    return (
      <div className="ritt-page ritt-page--not-found">
        <p>Fant ikke ritt med id «{id}».</p>
        <Link to="/">Tilbake til oversikt</Link>
      </div>
    );
  }

  const formattedOfficialDate = new Date(rittData.officialDate).toLocaleDateString(
    "nb-NO",
    { day: "numeric", month: "long", year: "numeric" }
  );

  return (
    <div className="ritt-page">
      <nav className="ritt-page__nav">
        <Link to="/">← Alle ritt</Link>
      </nav>

      <header className="ritt-page__header">
        <h1>{rittData.name}</h1>
        <div className="ritt-page__meta">
          <span>{rittData.distance} km</span>
          <span>{rittData.region}</span>
          <span>Offisiell dato: {formattedOfficialDate}</span>
          {rittData.url && (
            <a href={rittData.url} target="_blank" rel="noopener noreferrer">
              Offisiell nettside ↗
            </a>
          )}
        </div>
      </header>

      <section className="ritt-page__date-section">
        <DatePicker
          value={selectedDate}
          onChange={setSelectedDate}
          officialDate={rittData.officialDate}
        />
      </section>

      <section className="ritt-page__weather-section">
        <WeatherStrip waypoints={rittData.waypoints} date={selectedDate || null} />
      </section>
    </div>
  );
}
