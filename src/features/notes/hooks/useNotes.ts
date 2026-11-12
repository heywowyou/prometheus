import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@lib/query/keys";
import { useNotesApi } from "../api/notes-api";
import type {
  CreateNotePayload,
  Note,
  UpdateNotePayload,
} from "../types/note-types";

const byPinnedThenRecent = (a: Note, b: Note) => {
  if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
};

/** The notes list — active by default, or the archive — plus its mutations. */
export const useNotes = (opts: { archived?: boolean } = {}) => {
  const archived = opts.archived ?? false;
  const queryClient = useQueryClient();
  const api = useNotesApi();
  const listKey = queryKeys.notes.list({ archived });

  const query = useQuery({
    queryKey: listKey,
    queryFn: () => api.fetchNotes({ archived }),
  });

  const removeFromCache = (id: string) => {
    queryClient.setQueryData<Note[]>(listKey, (previous) =>
      previous?.filter((note) => note._id !== id),
    );
  };

  const createNote = useMutation({
    mutationFn: (payload: CreateNotePayload = {}) => api.createNote(payload),
    // New notes are never archived, so they belong in the active list.
    onSuccess: (note) => {
      queryClient.setQueryData<Note[]>(queryKeys.notes.list(), (previous) =>
        previous ? [note, ...previous] : [note],
      );
    },
  });

  const updateNote = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateNotePayload }) =>
      api.updateNote(id, payload),
    onSuccess: (updated) => {
      // Pinning reorders the list, so re-sort rather than patch in place.
      queryClient.setQueryData<Note[]>(listKey, (previous) =>
        previous
          ?.map((note) => (note._id === updated._id ? updated : note))
          .sort(byPinnedThenRecent),
      );
      queryClient.setQueryData(queryKeys.notes.detail(updated._id), updated);
    },
  });

  /** Moves a note between the active list and the archive. */
  const setArchived = useMutation({
    mutationFn: ({ id, archived: next }: { id: string; archived: boolean }) =>
      api.updateNote(id, { archived: next }),
    onSuccess: (updated) => {
      removeFromCache(updated._id);
      queryClient.setQueryData(queryKeys.notes.detail(updated._id), updated);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notes.list({ archived: updated.archived }),
      });
    },
  });

  const deleteNote = useMutation({
    mutationFn: (id: string) => api.deleteNote(id),
    onSuccess: (_result, id) => {
      removeFromCache(id);
      queryClient.removeQueries({ queryKey: queryKeys.notes.detail(id) });
    },
  });

  return {
    notes: query.data ?? [],
    loading: query.isPending,
    error: query.error,
    createNote: (payload?: CreateNotePayload) => createNote.mutateAsync(payload ?? {}),
    updateNote: (id: string, payload: UpdateNotePayload) =>
      updateNote.mutateAsync({ id, payload }),
    pinNote: (id: string, pinned: boolean) =>
      updateNote.mutate({ id, payload: { pinned } }),
    archiveNote: (id: string) => setArchived.mutate({ id, archived: true }),
    unarchiveNote: (id: string) => setArchived.mutate({ id, archived: false }),
    deleteNote: (id: string) => deleteNote.mutate(id),
    refetch: query.refetch,
  };
};

/** A single note plus a debounced autosave, for the editor route. */
export const useNote = (id: string | undefined) => {
  const queryClient = useQueryClient();
  const api = useNotesApi();

  const query = useQuery({
    queryKey: queryKeys.notes.detail(id ?? ""),
    queryFn: () => api.fetchNote(id as string),
    enabled: Boolean(id),
  });

  const save = useMutation({
    mutationFn: (payload: UpdateNotePayload) =>
      api.updateNote(id as string, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.notes.detail(updated._id), updated);
      // The dashboard's ordering depends on updatedAt, so let it refetch.
      void queryClient.invalidateQueries({ queryKey: queryKeys.notes.lists() });
    },
    // Opts out of the global toast: autosave retries with backoff and the
    // editor's save indicator reports the failure, so a toast per retry would
    // only be noise.
    onError: () => undefined,
  });

  return {
    note: query.data ?? null,
    loading: query.isPending,
    error: query.error,
    save: (payload: UpdateNotePayload) => save.mutateAsync(payload),
    saving: save.isPending,
  };
};
