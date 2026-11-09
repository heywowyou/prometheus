import { useCallback, useEffect, useRef, useState } from "react";

export type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

interface UseDebouncedSaveOptions<T> {
  /** Performs the save. Called with the merged pending changes. */
  save: (changes: T) => Promise<unknown>;
  delayMs?: number;
}

/**
 * Debounces a partial save and tracks its status.
 *
 * Calls made before the timer fires are merged, so typing a title while the
 * body changes results in one request carrying both fields. Pending changes are
 * flushed on unmount so navigating away doesn't lose the last keystrokes.
 */
export const useDebouncedSave = <T extends object>({
  save,
  delayMs = 800,
}: UseDebouncedSaveOptions<T>) => {
  const [status, setStatus] = useState<SaveStatus>("idle");

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<Partial<T>>({});

  // Kept in a ref — updated in an effect, never during render — so `schedule`
  // stays referentially stable while still calling the latest `save`.
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  const flush = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const changes = pendingRef.current;
    if (Object.keys(changes).length === 0) return;
    pendingRef.current = {};

    setStatus("saving");
    try {
      await saveRef.current(changes as T);
      setStatus("saved");
    } catch {
      // The query client surfaces the message; this only drives the indicator.
      setStatus("error");
    }
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

  useEffect(
    () => () => {
      if (!timerRef.current) return;
      clearTimeout(timerRef.current);

      // The component is going away, but the edit shouldn't: fire the pending
      // save without waiting for it.
      const changes = pendingRef.current;
      pendingRef.current = {};
      if (Object.keys(changes).length > 0) {
        void saveRef.current(changes as T).catch(() => undefined);
      }
    },
    [],
  );

  return { status, schedule, flush };
};
