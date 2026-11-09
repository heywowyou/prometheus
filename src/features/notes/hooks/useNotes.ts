import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@lib/query/keys";
import { useNotesApi } from "../api/notes-api";
import type {
  CreateNotePayload,
  Note,
  UpdateNotePayload,
} from "../types/note-types";

export const useNotes = () => {
  const queryClient = useQueryClient();
  const api = useNotesApi();
  const listKey = queryKeys.notes.list();

  const query = useQuery({
    queryKey: listKey,
    queryFn: api.fetchNotes,
  });

  const prependToCache = (note: Note) => {
    queryClient.setQueryData<Note[]>(listKey, (previous) =>
      previous ? [note, ...previous] : [note],
    );
  };

  const removeFromCache = (id: string) => {
    queryClient.setQueryData<Note[]>(listKey, (previous) =>
      previous?.filter((note) => note._id !== id),
    );
  };

  const createNote = useMutation({
    mutationFn: (payload: CreateNotePayload = {}) => api.createNote(payload),
    onSuccess: prependToCache,
  });

  const updateNote = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateNotePayload }) =>
      api.updateNote(id, payload),
    onSuccess: (updated) => {
      // Pinning reorders the list, so re-sort rather than patch in place.
      queryClient.setQueryData<Note[]>(listKey, (previous) =>
        previous
          ?.map((note) => (note._id === updated._id ? updated : note))
          .sort((a, b) => {
            if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
            return (
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );
          }),
      );
      queryClient.setQueryData(queryKeys.notes.detail(updated._id), updated);
    },
  });

  const archiveNote = useMutation({
    mutationFn: (id: string) => api.updateNote(id, { archived: true }),
    onSuccess: (_archived, id) => removeFromCache(id),
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
    archiveNote: (id: string) => archiveNote.mutate(id),
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.notes.list() });
    },
  });

  return {
    note: query.data ?? null,
    loading: query.isPending,
    error: query.error,
    save: (payload: UpdateNotePayload) => save.mutateAsync(payload),
    saving: save.isPending,
  };
};
