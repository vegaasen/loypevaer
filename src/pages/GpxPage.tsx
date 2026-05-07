import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { WeatherStrip } from "../components/WeatherStrip";
import { EventMap } from "../components/EventMap";
import { ElevationProfile } from "../components/ElevationProfile";
import { TimePicker } from "../components/TimePicker";
import { DatePicker } from "../components/DatePicker";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { GpxUploader } from "../components/GpxUploader";
import { PageMeta } from "../components/PageMeta";
import {
  parseGpx,
  downsampleGpx,
  gpxTotalDistanceKm,
  fetchGpxFromUrl,
  type GpxTrackPoint,
} from "../lib/gpx";
import { computeElevationGain } from "../lib/arrangements";
import type { Discipline } from "../lib/arrangements";
import { DISCIPLINE_LABEL } from "../lib/disciplines";
import type { Waypoint } from "../lib/weather";

const TODAY = new Date().toISOString().slice(0, 10);
const DEFAULT_WAYPOINT_COUNT = 8;

interface ParsedRoute {
  waypoints: Waypoint[];
  distanceKm: number;
  elevationGain: number | null;
  name: string;
}

function buildRoute(points: GpxTrackPoint[], name: string, count: number): ParsedRoute {
  const waypoints = downsampleGpx(points, count);
  const distanceKm = gpxTotalDistanceKm(points);
  const elevationGain = computeElevationGain(waypoints);
  return { waypoints, distanceKm, elevationGain, name };
}

export function GpxPage() {
  const [route, setRoute] = useState<ParsedRoute | null>(null);
  const [rawPoints, setRawPoints] = useState<GpxTrackPoint[] | null>(null);
  const [rawName, setRawName] = useState<string>("");
  const [waypointCount, setWaypointCount] = useState<number>(DEFAULT_WAYPOINT_COUNT);

  const [selectedDate, setSelectedDate] = useState<string>(TODAY);
  const [startTime, setStartTime] = useState<string>("");
  const [finishTime, setFinishTime] = useState<string>("");
  const [discipline, setDiscipline] = useState<Discipline>("landevei");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState<string>("");

  function applyPoints(points: GpxTrackPoint[], name: string, count: number) {
    setRawPoints(points);
    setRawName(name);
    setRoute(buildRoute(points, name, count));
    setError(null);
  }

  const handleFile = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith(".gpx")) {
      setError("Kun .gpx-filer støttes.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const points = parseGpx(text);
        const name = file.name.replace(/\.gpx$/i, "");
        applyPoints(points, name, waypointCount);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ukjent feil ved parsing av GPX.");
      }
    };
    reader.readAsText(file);
  }, [waypointCount]);

  async function handleUrlLoad() {
    if (!urlInput.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const points = await fetchGpxFromUrl(urlInput.trim());
      const name = urlInput.split("/").pop()?.replace(/\.gpx$/i, "") ?? "GPX-løype";
      applyPoints(points, name, waypointCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ukjent feil ved nedlasting av GPX.");
    } finally {
      setLoading(false);
    }
  }

  function handleWaypointCountChange(count: number) {
    setWaypointCount(count);
    if (rawPoints) {
      setRoute(buildRoute(rawPoints, rawName, count));
    }
  }

  function handleReset() {
    setRoute(null);
    setRawPoints(null);
    setRawName("");
    setError(null);
    setUrlInput("");
    setStartTime("");
    setFinishTime("");
  }

  return (
    <div className="ritt-page">
      <PageMeta
        title="Værvarsеl for din løype – Løypevær"
        description="Last opp ruten din og få værvarsеl langs hele løypa — fra start til mål."
        canonicalUrl="https://www.løypevær.no/gpx"
      />

      <Link to="/" className="ritt-page__back-link">← Alle arrangement</Link>

      <header className="ritt-page__header">
        <h1>Værvarsеl for din løype</h1>
        <p className="ritt-page__subtitle">
          Last opp ruten din og se værvarselet langs veien — fra start til mål.
        </p>
      </header>

      {!route && (
        <GpxUploader
          loading={loading}
          error={error}
          urlInput={urlInput}
          onUrlChange={setUrlInput}
          onUrlLoad={() => { void handleUrlLoad(); }}
          onFile={handleFile}
        />
      )}

      {route && (
        <>
          <div className="gpx-route-meta">
            <span className="ritt-page__meta-item">{route.name}</span>
            <span className="ritt-page__meta-item">{route.distanceKm} km</span>
            {route.elevationGain != null && (
              <span className="ritt-page__meta-item ritt-page__meta-item--elevation">
                ↑ {route.elevationGain} m
              </span>
            )}
            <span className="ritt-page__meta-item">
              {route.waypoints.length} målepunkter
            </span>
            <button className="gpx-route-meta__reset" onClick={handleReset}>
              Last inn ny GPX
            </button>
          </div>

          <div className="gpx-waypoint-count">
            <label htmlFor="gpx-wpt-count" className="gpx-waypoint-count__label">
              Antall målepunkter:
            </label>
            <input
              id="gpx-wpt-count"
              type="range"
              min={3}
              max={15}
              value={waypointCount}
              onChange={(e) => handleWaypointCountChange(Number(e.target.value))}
              className="gpx-waypoint-count__slider"
              aria-label={`${waypointCount} målepunkter`}
            />
            <span className="gpx-waypoint-count__value">{waypointCount}</span>
          </div>

          <div className="gpx-discipline">
            <label htmlFor="gpx-discipline" className="gpx-discipline__label">
              Aktivitetstype:
            </label>
            <select
              id="gpx-discipline"
              className="gpx-discipline__select"
              value={discipline}
              onChange={(e) => setDiscipline(e.target.value as Discipline)}
            >
              {(Object.entries(DISCIPLINE_LABEL) as [Discipline, string][]).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <section className="ritt-page__map-section">
            <EventMap waypoints={route.waypoints} name={route.name} discipline={discipline} />
          </section>

          <section className="ritt-page__elevation-section">
            <ElevationProfile waypoints={route.waypoints} distanceKm={route.distanceKm} />
          </section>

          <section className="ritt-page__date-section">
            <DatePicker
              value={selectedDate}
              onChange={setSelectedDate}
            />
            <TimePicker
              startTime={startTime}
              finishTime={finishTime}
              onStartChange={setStartTime}
              onFinishChange={setFinishTime}
              onClear={() => { setStartTime(""); setFinishTime(""); }}
              distanceKm={route.distanceKm}
              discipline={discipline}
            />
          </section>

          <section className="ritt-page__weather-section">
            <ErrorBoundary
              fallback={
                <p className="error-boundary__message">
                  Kunne ikke laste værmeldingen. Sjekk nettverkstilkoblingen og prøv igjen.
                </p>
              }
            >
              <WeatherStrip
                waypoints={route.waypoints}
                date={selectedDate || null}
                startTime={startTime || null}
                finishTime={finishTime || null}
              />
            </ErrorBoundary>
          </section>
        </>
      )}
    </div>
  );
}
