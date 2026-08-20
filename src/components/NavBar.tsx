import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { type Discipline, type RittEntry, allArrangements as ritt } from "../lib/arrangements";
import { parseDateLocal } from "../lib/dates";
import { DISCIPLINE_LABEL_WITH_EMOJI } from "../lib/disciplines";

type Race = RittEntry;

const DISCIPLINE_ORDER: Discipline[] = ["terreng", "landevei", "langrenn", "triathlon", "ultraløp"];

function groupByDiscipline(races: Race[]): Map<Discipline, Race[]> {
  const sorted = [...races].sort(
    (a, b) => parseDateLocal(a.officialDate).getTime() - parseDateLocal(b.officialDate).getTime(),
  );
  const grouped = new Map<Discipline, Race[]>();
  for (const discipline of DISCIPLINE_ORDER) grouped.set(discipline, []);
  for (const race of sorted) {
    if (grouped.has(race.discipline)) {
      grouped.get(race.discipline)?.push(race);
    }
  }
  return grouped;
}

// Computed once at module load — derived from static ritt data.
const grouped = groupByDiscipline(ritt);

export function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  // menuOpenAt stores the pathname when the menu was opened.
  // The menu is considered open only when the current pathname matches.
  const [menuOpenAt, setMenuOpenAt] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const match = location.pathname.match(/^\/arrangement\/([^/]+)/);
  const currentId = match ? match[1] : "";
  const isLopPage = location.pathname.startsWith("/lop");
  const isGpxPage = location.pathname.startsWith("/gpx");
  const isStatistikkPage = location.pathname.startsWith("/statistikk");

  const menuOpen = menuOpenAt === location.pathname;

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleOutsideClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenAt(null);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [menuOpen]);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    if (value) void navigate(`/arrangement/${value}`);
  }

  return (
    <div className="site-nav-wrapper" ref={menuRef}>
      <nav className="site-nav">
        <div className="site-nav__logo-group">
          <Link to="/" className="site-nav__logo">
            Løypevær
          </Link>
          <span className="site-nav__beta">BETA</span>
        </div>
        {/* Desktop nav controls */}
        <div className="site-nav__selector">
          <Link
            to="/"
            className={`site-nav__gpx-link site-nav__alle-link${location.pathname === "/" ? " site-nav__gpx-link--active" : ""}`}
          >
            Alle arrangement
          </Link>
          <span className="site-nav__divider" aria-hidden="true" />
          <Link
            to="/lop"
            className={`site-nav__gpx-link${isLopPage ? " site-nav__gpx-link--active" : ""}`}
          >
            Løp
          </Link>
          <span className="site-nav__divider" aria-hidden="true" />
          <Link
            to="/gpx"
            className={`site-nav__gpx-link${isGpxPage ? " site-nav__gpx-link--active" : ""}`}
          >
            Egendefinert løype (GPX)
          </Link>
          <span className="site-nav__divider" aria-hidden="true" />
          <Link
            to="/statistikk"
            className={`site-nav__gpx-link${isStatistikkPage ? " site-nav__gpx-link--active" : ""}`}
          >
            Statistikk
          </Link>
          <span className="site-nav__divider" aria-hidden="true" />
          <select
            className="site-nav__select"
            value={currentId}
            onChange={handleChange}
            aria-label="Velg arrangement"
          >
            <option value="" disabled>
              Hopp til arrangement…
            </option>
            {DISCIPLINE_ORDER.filter((d) => (grouped.get(d)?.length ?? 0) > 0).map((d) => (
              <optgroup key={d} label={DISCIPLINE_LABEL_WITH_EMOJI[d]}>
                {grouped.get(d)?.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} — {r.distance} km
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        {/* Mobile hamburger button */}
        <button
          className={`site-nav__hamburger${menuOpen ? " site-nav__hamburger--open" : ""}`}
          aria-label={menuOpen ? "Lukk meny" : "Åpne meny"}
          aria-expanded={menuOpen}
          onClick={() =>
            setMenuOpenAt((prev) => (prev === location.pathname ? null : location.pathname))
          }
        >
          <span />
          <span />
          <span />
        </button>
      </nav>
      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="site-nav__mobile-menu" role="menu">
          <Link
            to="/"
            className={`site-nav__mobile-link${location.pathname === "/" ? " site-nav__mobile-link--active" : ""}`}
            role="menuitem"
          >
            Alle arrangement
          </Link>
          <Link
            to="/lop"
            className={`site-nav__mobile-link${isLopPage ? " site-nav__mobile-link--active" : ""}`}
            role="menuitem"
          >
            Løp
          </Link>
          <Link
            to="/gpx"
            className={`site-nav__mobile-link${isGpxPage ? " site-nav__mobile-link--active" : ""}`}
            role="menuitem"
          >
            Egendefinert løype (GPX)
          </Link>
          <Link
            to="/statistikk"
            className={`site-nav__mobile-link${isStatistikkPage ? " site-nav__mobile-link--active" : ""}`}
            role="menuitem"
          >
            Statistikk
          </Link>
          <div className="site-nav__mobile-divider" />
          <select
            className="site-nav__select site-nav__mobile-select"
            value={currentId}
            onChange={handleChange}
            aria-label="Velg arrangement"
          >
            <option value="" disabled>
              Hopp til arrangement…
            </option>
            {DISCIPLINE_ORDER.filter((d) => (grouped.get(d)?.length ?? 0) > 0).map((d) => (
              <optgroup key={d} label={DISCIPLINE_LABEL_WITH_EMOJI[d]}>
                {grouped.get(d)?.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} — {r.distance} km
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
