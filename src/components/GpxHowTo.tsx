import { useState } from "react";

type Platform = "strava" | "garmin" | "komoot";

export function GpxHowTo() {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<Platform>("strava");

  return (
    <div className="gpx-howto">
      <button
        className="gpx-howto__toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        Slik eksporterer du GPX {open ? "▴" : "▾"}
      </button>

      {open && (
        <div className="gpx-howto__panel">
          <div className="gpx-howto__tabs" role="tablist">
            {(["strava", "garmin", "komoot"] as const).map((p) => (
              <button
                key={p}
                role="tab"
                aria-selected={platform === p}
                className={`gpx-howto__tab${platform === p ? " gpx-howto__tab--active" : ""}`}
                onClick={() => setPlatform(p)}
              >
                {p === "strava" ? "Strava" : p === "garmin" ? "Garmin Connect" : "Komoot"}
              </button>
            ))}
          </div>

          <ol className="gpx-howto__steps">
            {platform === "strava" && (
              <>
                <li>Gå til <a href="https://www.strava.com/athlete/routes" target="_blank" rel="noopener noreferrer">strava.com/athlete/routes</a> og åpne ruten din</li>
                <li>Klikk på <strong>···</strong>-menyen øverst til høyre på ruten</li>
                <li>Velg <strong>Eksporter GPX</strong></li>
                <li>Last opp den nedlastede <code>.gpx</code>-filen ovenfor</li>
              </>
            )}
            {platform === "garmin" && (
              <>
                <li>Gå til <a href="https://connect.garmin.com/modern/courses" target="_blank" rel="noopener noreferrer">connect.garmin.com</a> og åpne kurset ditt</li>
                <li>Klikk på tannhjulikonet (<strong>⚙</strong>) ved siden av kurset</li>
                <li>Velg <strong>Eksporter som GPX</strong></li>
                <li>Last opp den nedlastede <code>.gpx</code>-filen ovenfor</li>
              </>
            )}
            {platform === "komoot" && (
              <>
                <li>Gå til <a href="https://www.komoot.com/user/tours" target="_blank" rel="noopener noreferrer">komoot.com</a> og åpne turen din</li>
                <li>Klikk på <strong>Del</strong>-knappen øverst på tursiden</li>
                <li>Velg <strong>Eksporter som GPX</strong> under nedlastingsalternativene</li>
                <li>Last opp den nedlastede <code>.gpx</code>-filen ovenfor</li>
              </>
            )}
          </ol>
        </div>
      )}
    </div>
  );
}
