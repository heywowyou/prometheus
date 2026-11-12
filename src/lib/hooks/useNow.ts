import { useEffect, useState } from "react";

/**
 * The current time, re-rendering every `intervalMs` while `active`.
 * Inactive components don't tick, so only running timers cost anything.
 */
export const useNow = (active: boolean, intervalMs = 1_000): number => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    const tick = () => setNow(Date.now());
    // Catch up straight away (the stored time may be from long before the
    // timer started), then tick on the interval.
    const first = setTimeout(tick, 0);
    const interval = setInterval(tick, intervalMs);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
  }, [active, intervalMs]);

  return now;
};
