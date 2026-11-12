import { useEffect } from "react";

/**
 * Keeps the screen on while `active` (the live workout screen), where the
 * Screen Wake Lock API exists. The lock drops whenever the page is hidden, so
 * it is re-requested when the page comes back.
 */
export const useWakeLock = (active: boolean) => {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;

    let lock: WakeLockSentinel | null = null;
    let cancelled = false;

    const request = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const next = await navigator.wakeLock.request("screen");
        if (cancelled) void next.release();
        else lock = next;
      } catch {
        // Denied (low battery mode, unsupported in this context): not fatal.
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") void request();
    };

    void request();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibility);
      void lock?.release();
    };
  }, [active]);
};
