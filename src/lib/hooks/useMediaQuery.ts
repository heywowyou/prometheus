import { useSyncExternalStore } from "react";

/** Live result of a CSS media query, e.g. `(min-width: 1024px)`. */
export const useMediaQuery = (query: string): boolean =>
  useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
