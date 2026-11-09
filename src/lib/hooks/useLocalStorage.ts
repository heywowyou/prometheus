import { useCallback, useState } from "react";

/**
 * A piece of state mirrored into `localStorage`.
 *
 * `isValid` guards against stale or hand-edited values, so a bad entry falls
 * back to the default instead of rendering a broken view. Storage access is
 * wrapped because it throws in private-mode Safari and when quota is full.
 */
export const useLocalStorage = <T>(
  key: string,
  fallback: T,
  isValid: (value: unknown) => value is T,
) => {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored === null) return fallback;
      const parsed: unknown = JSON.parse(stored);
      return isValid(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  });

  const update = useCallback(
    (next: T) => {
      setValue(next);
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // Persistence is a convenience; losing it must not break the view.
      }
    },
    [key],
  );

  return [value, update] as const;
};
