import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SCROLL_KEY_PREFIX = "scroll_pos_";

export function ScrollToTop() {
  const { pathname, key } = useLocation();

  useEffect(() => {
    const saved = sessionStorage.getItem(SCROLL_KEY_PREFIX + key);
    if (saved !== null) {
      window.scrollTo(0, parseInt(saved, 10));
    } else {
      window.scrollTo(0, 0);
    }

    return () => {
      sessionStorage.setItem(SCROLL_KEY_PREFIX + key, String(window.scrollY));
    };
  }, [pathname, key]);

  return null;
}
