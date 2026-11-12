import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDebouncedSave, type SaveStatus } from "@lib/hooks/useDebouncedSave";
import { queryKeys } from "@lib/query/keys";
import { useWorkoutsApi, type SessionPayload } from "../api/workouts-api";
import type { FinishResult, SessionEntry, WorkoutSession } from "../types/workout-types";

const keys = queryKeys.workouts;

/**
 * Local copy of a session's edits, so a dropped gym connection or a killed
 * home-screen app never loses a logged set. Cleared once the server has it.
 */
interface Draft {
  savedAt: number;
  name: string;
  notes: string;
  entries: SessionEntry[];
}

const draftKey = (id: string) => `prometheus.workout-draft.${id}`;

const readDraft = (id: string): Draft | null => {
  try {
    const raw = localStorage.getItem(draftKey(id));
    if (!raw) return null;
    const draft = JSON.parse(raw) as Partial<Draft>;
    return typeof draft.savedAt === "number" && Array.isArray(draft.entries)
      ? (draft as Draft)
      : null;
  } catch {
    return null;
  }
};

const writeDraft = (id: string, draft: Draft) => {
  try {
    localStorage.setItem(draftKey(id), JSON.stringify(draft));
  } catch {
    // Storage full or blocked: the debounced save still runs.
  }
};

const clearDraft = (id: string) => {
  try {
    localStorage.removeItem(draftKey(id));
  } catch {
    // Ignore.
  }
};

/** The draft, when it holds edits newer than the server's copy. */
const pendingDraft = (session: WorkoutSession): Draft | null => {
  const draft = readDraft(session._id);
  if (!draft) return null;
  if (draft.savedAt <= new Date(session.updatedAt).getTime()) {
    clearDraft(session._id);
    return null;
  }
  return draft;
};

const toPayloadEntries = (entries: SessionEntry[]): SessionPayload["entries"] =>
  entries.map(({ exerciseId, restSec, sets }) => ({ exerciseId, restSec, sets }));

export type LiveSaveStatus = SaveStatus | "offline";

/**
 * Editing state for one session (live or finished): every change updates the
 * screen immediately, is mirrored to localStorage, and is sent to the API on a
 * short debounce, retried with backoff while offline.
 */
export const useLiveSession = (session: WorkoutSession) => {
  const api = useWorkoutsApi();
  const queryClient = useQueryClient();
  const id = session._id;

  const [initial] = useState(() => {
    const draft = pendingDraft(session);
    return {
      name: draft?.name ?? session.name,
      notes: draft?.notes ?? session.notes ?? "",
      entries: draft?.entries ?? session.entries,
      /** True when the draft still has to reach the server. */
      resync: draft !== null,
    };
  });
  const [state, setState] = useState({
    name: initial.name,
    notes: initial.notes,
    entries: initial.entries,
  });
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const save = useCallback(
    async (changes: SessionPayload) => {
      const sentAt = Date.now();
      const saved = await api.updateSession(id, changes);
      queryClient.setQueryData(keys.session(id), saved);
      if (saved.status === "in_progress") queryClient.setQueryData(keys.activeSession(), saved);
      // Nothing typed since this request left: the server copy is current.
      const draft = readDraft(id);
      if (draft && draft.savedAt <= sentAt) clearDraft(id);
    },
    [api, id, queryClient],
  );

  const { status, schedule, flush } = useDebouncedSave<SessionPayload>({ save, delayMs: 700 });

  const commit = useCallback(
    (next: { name?: string; notes?: string; entries?: SessionEntry[] }) => {
      const merged = { ...stateRef.current, ...next };
      stateRef.current = merged;
      setState(merged);
      writeDraft(id, {
        savedAt: Date.now(),
        name: merged.name,
        notes: merged.notes,
        entries: merged.entries,
      });
      schedule({
        ...(next.name !== undefined ? { name: next.name } : {}),
        ...(next.notes !== undefined ? { notes: next.notes } : {}),
        ...(next.entries !== undefined ? { entries: toPayloadEntries(next.entries) } : {}),
      });
    },
    [id, schedule],
  );

  // Edits made offline (or before the app was killed) go up on reopen.
  useEffect(() => {
    if (!initial.resync) return;
    const { name, notes, entries } = initial;
    schedule({ name, notes, entries: toPayloadEntries(entries) });
  }, [initial, schedule]);

  // Retry straight away when the phone gets its signal back.
  useEffect(() => {
    const handleOnline = () => void flush();
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [flush]);

  const setEntries = useCallback(
    (update: (entries: SessionEntry[]) => SessionEntry[]) =>
      commit({ entries: update(stateRef.current.entries) }),
    [commit],
  );

  const finishMutation = useMutation({
    mutationFn: async (): Promise<FinishResult> => {
      await flush();
      return api.finishSession(id);
    },
    onSuccess: (result) => {
      clearDraft(id);
      queryClient.setQueryData(keys.session(id), result.session);
      queryClient.setQueryData(keys.activeSession(), null);
      void queryClient.invalidateQueries({ queryKey: keys.all });
    },
  });

  const discard = useCallback(() => clearDraft(id), [id]);

  return {
    name: state.name,
    notes: state.notes,
    entries: state.entries,
    setName: (name: string) => commit({ name }),
    setNotes: (notes: string) => commit({ notes }),
    setEntries,
    saveStatus: (status === "error" ? "offline" : status) as LiveSaveStatus,
    flush,
    finish: finishMutation.mutateAsync,
    finishing: finishMutation.isPending,
    /** Forget the local draft (the session is being deleted). */
    discard,
  };
};
