import { useCallback, useEffect, useRef, useState } from "react";

export type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

interface UseDebouncedSaveOptions<T> {
  /** Performs the save. Called with the merged pending changes. */
  save: (changes: T) => Promise<unknown>;
  delayMs?: number;
}

const RETRY_BASE_MS = 2_000;
const RETRY_MAX_MS = 30_000;

const isEmpty = (value: object) => Object.keys(value).length === 0;

/**
 * Debounces a partial save and tracks its status.
 *
 * - Calls made before the timer fires are merged, so typing a title while the
 *   body changes results in one request carrying both fields.
 * - Saves run one at a time, so a slow older request can't land after a newer
 *   one and overwrite it.
 * - A failed save keeps its changes (newer edits win) and retries with
 *   backoff; `flush` retries immediately.
 * - Pending changes are flushed when the tab is hidden and on unmount, and the
 *   browser warns before closing a tab that still has unsaved changes.
 */
export const useDebouncedSave = <T extends object>({
  save,
  delayMs = 800,
}: UseDebouncedSaveOptions<T>) => {
  const [status, setStatus] = useState<SaveStatus>("idle");

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<Partial<T>>({});
  const inFlightRef = useRef<Promise<void> | null>(null);
  const retryDelayRef = useRef(RETRY_BASE_MS);

  // Kept in a ref — updated in an effect, never during render — so `schedule`
  // stays referentially stable while still calling the latest `save`.
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  const flush = useCallback((): Promise<void> => {
    const attempt = async (): Promise<void> => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      // Wait out any save already on the wire before sending the next one.
      while (inFlightRef.current) await inFlightRef.current;
      if (isEmpty(pendingRef.current)) return;

      const changes = pendingRef.current;
      pendingRef.current = {};
      setStatus("saving");

      const run = (async () => {
        try {
          await saveRef.current(changes as T);
          retryDelayRef.current = RETRY_BASE_MS;
          setStatus(isEmpty(pendingRef.current) ? "saved" : "pending");
        } catch {
          // Put the failed changes back underneath anything typed since.
          pendingRef.current = { ...changes, ...pendingRef.current };
          setStatus("error");

          const delay = retryDelayRef.current;
          retryDelayRef.current = Math.min(delay * 2, RETRY_MAX_MS);
          timerRef.current = setTimeout(() => void attempt(), delay);
        } finally {
          inFlightRef.current = null;
        }
      })();

      inFlightRef.current = run;
      await run;
    };

    return attempt();
  }, []);

  const schedule = useCallback(
    (changes: Partial<T>) => {
      pendingRef.current = { ...pendingRef.current, ...changes };
      setStatus("pending");

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => void flush(), delayMs);
    },
    [delayMs, flush],
  );

  useEffect(() => {
    // Mobile browsers often kill a backgrounded tab without `beforeunload`, so
    // hiding the tab is the last reliable moment to send the edit.
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isEmpty(pendingRef.current) || inFlightRef.current) {
        event.preventDefault();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [flush]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);

      // The component is going away, but the edit shouldn't: send what's left
      // once any in-flight save has finished.
      const changes = pendingRef.current;
      pendingRef.current = {};
      if (isEmpty(changes)) return;

      const previous = inFlightRef.current ?? Promise.resolve();
      void previous
        .then(() => saveRef.current(changes as T))
        .catch(() => undefined);
    },
    [],
  );

  return { status, schedule, flush };
};
