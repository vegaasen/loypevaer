import { useEffect, useRef, useState } from "react";

/**
 * Tracks whether a `<details>` element is open by listening to its native
 * `toggle` event (which fires *after* the browser commits the open state).
 *
 * Returns a ref to attach to the `<details>` element and a boolean `isOpen`.
 *
 * @example
 * const { detailsRef, isOpen } = useDetailsOpen();
 * return <details ref={detailsRef}>...</details>;
 */
export function useDetailsOpen(): {
  detailsRef: React.RefObject<HTMLDetailsElement | null>;
  isOpen: boolean;
} {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const el = detailsRef.current;
    if (!el) return;
    const handler = () => setIsOpen(el.open);
    el.addEventListener("toggle", handler);
    return () => el.removeEventListener("toggle", handler);
  }, []);

  return { detailsRef, isOpen };
}
