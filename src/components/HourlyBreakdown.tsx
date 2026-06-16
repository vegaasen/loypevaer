import type { HourlyEntry } from "../lib/weather";
import { describeWeatherCode } from "../lib/wmo";
import { degreesToCompass } from "../lib/wind";

type Props = {
  entries: HourlyEntry[];
};

function formatHour(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function HourlyBreakdown({ entries }: Props) {
  const realEntries = entries.filter((e) => e.hasData);
  const isSparse = realEntries.length < entries.length;

  return (
    <div className="hourly-breakdown">
      {isSparse && (
        <p className="hourly-breakdown__sparse-note">
          Yr har kun 6-timers oppløsning for denne datoen — viser kun tilgjengelige tidspunkter.
        </p>
      )}
      <table className="hourly-breakdown__table">
        <thead>
          <tr>
            <th className="hourly-breakdown__th">Tid</th>
            <th className="hourly-breakdown__th">Vær</th>
            <th className="hourly-breakdown__th">Temp</th>
            <th className="hourly-breakdown__th">Nedbør</th>
            <th className="hourly-breakdown__th">Vind</th>
          </tr>
        </thead>
        <tbody>
          {realEntries.map((entry) => {
            const { emoji } = describeWeatherCode(entry.weatherCode);
            const windDir =
              entry.windDirection !== undefined
                ? degreesToCompass(entry.windDirection)
                : null;
            return (
              <tr key={entry.hour} className="hourly-breakdown__row">
                <td className="hourly-breakdown__td hourly-breakdown__td--hour">
                  {formatHour(entry.hour)}
                </td>
                <td className="hourly-breakdown__td hourly-breakdown__td--icon">
                  {emoji}
                </td>
                <td className="hourly-breakdown__td hourly-breakdown__td--temp">
                  {entry.temp}°
                  {entry.feelsLike != null && (
                    <span className="hourly-breakdown__feels-like">
                      {" "}({entry.feelsLike}°)
                    </span>
                  )}
                </td>
                <td className="hourly-breakdown__td hourly-breakdown__td--precip">
                  {entry.precipitation} mm
                  {entry.precipitationProbability != null && (
                    <span className="hourly-breakdown__prob">
                      {" "}· {entry.precipitationProbability}%
                    </span>
                  )}
                </td>
                <td className="hourly-breakdown__td hourly-breakdown__td--wind">
                  {entry.windSpeed} km/t
                  {windDir && (
                    <span className="hourly-breakdown__wind-dir"> · {windDir}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
