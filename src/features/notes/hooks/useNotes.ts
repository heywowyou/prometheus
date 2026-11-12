import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@lib/query/keys";
import { getErrorMessage } from "@lib/api/errors";
import { useNotesApi } from "../api/notes-api";
import type {
  CreateNotePayload,
  NoteSummary,
  NotesFilter,
  UpdateNotePayload,
} from "../types/note-types";

/** One slice of the notes list (a view, optionally searched or tag-filtered). */
export const useNotes = (filter: NotesFilter) => {
  const api = useNotesApi();

  const query = useQuery({
    queryKey: queryKeys.notes.list(filter),
    queryFn: () => api.fetchNotes(filter),
    // Typing in search swaps keys; keep the last results up meanwhile.
    placeholderData: keepPreviousData,
  });

  return {
    notes: query.data ?? [],
    loading: query.isPending,
    fetching: query.isFetching,
    error: query.error,
  };
};

/** Every tag in use, most used first. */
export const useNoteTags = () => {
  const api = useNotesApi();
  const query = useQuery({
    queryKey: queryKeys.notes.tags(),
    queryFn: api.fetchTags,
    staleTime: 60_000,
  });
  return query.data ?? [];
};

type QueryClient = ReturnType<typeof useQueryClient>;

/** Refetches every notes list and the tag counts. */
const refreshNotes = (queryClient: QueryClient) => {
  void queryClient.invalidateQueries({ queryKey: queryKeys.notes.lists() });
  void queryClient.invalidateQueries({ queryKey: queryKeys.notes.tags() });
};

const writeDetail = (queryClient: QueryClient, note: { _id: string }) => {
  queryClient.setQueryData(queryKeys.notes.detail(note._id), note);
};

/**
 * A mutation that takes a note out of the view it's in (archive, trash,
 * restore, delete). It is removed from every cached list at once, then lists
 * refetch: a note can sit in several (search results, a tag filter…), and
 * patching each by hand would drift.
 */
const useRemovingMutation = <T>(mutationFn: (id: string) => Promise<T>) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: (id: string) => {
      queryClient.setQueriesData<NoteSummary[]>(
        { queryKey: queryKeys.notes.lists() },
        (previous) => previous?.filter((note) => note._id !== id),
      );
    },
    onSuccess: (result) => {
      if (result && typeof result === "object" && "_id" in result) {
        writeDetail(queryClient, result as { _id: string });
      }
      refreshNotes(queryClient);
    },
    // Owning onError opts out of the global toast, so report it here; the
    // refetch brings back the note that was removed optimistically.
    onError: (error) => {
      toast.error(getErrorMessage(error));
      refreshNotes(queryClient);
    },
  });
};

/** Note mutations shared by the dashboard and the editor. */
export const useNoteActions = () => {
  const queryClient = useQueryClient();
  const api = useNotesApi();

  const create = useMutation({
    mutationFn: (payload: CreateNotePayload) => api.createNote(payload),
    // New notes are empty, so the API hides them from lists until written in.
    onSuccess: (note) => writeDetail(queryClient, note),
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateNotePayload }) =>
      api.updateNote(id, payload),
    onSuccess: (note) => {
      writeDetail(queryClient, note);
      refreshNotes(queryClient);
    },
  });

  const duplicate = useMutation({
    mutationFn: (id: string) => api.duplicateNote(id),
    onSuccess: (note) => {
      writeDetail(queryClient, note);
      refreshNotes(queryClient);
    },
  });

  const archive = useRemovingMutation((id) => api.updateNote(id, { archived: true }));
  const unarchive = useRemovingMutation((id) =>
    api.updateNote(id, { archived: false }),
  );
  const trash = useRemovingMutation(api.trashNote);
  const restore = useRemovingMutation(api.restoreNote);
  const deleteForever = useRemovingMutation(async (id) => {
    await api.deleteNoteForever(id);
    queryClient.removeQueries({ queryKey: queryKeys.notes.detail(id) });
  });

  return {
    createNote: (payload: CreateNotePayload = {}) => create.mutateAsync(payload),
    duplicateNote: (id: string) => duplicate.mutateAsync(id),
    setPinned: (id: string, pinned: boolean) =>
      update.mutate({ id, payload: { pinned } }),
    archiveNote: (id: string) =>
      archive.mutate(id, {
        onSuccess: () =>
          toast("Note archived", {
            action: { label: "Undo", onClick: () => unarchive.mutate(id) },
          }),
      }),
    unarchiveNote: (id: string) => unarchive.mutate(id),
    trashNote: (id: string) =>
      trash.mutate(id, {
        onSuccess: () =>
          toast("Moved to trash", {
            action: { label: "Undo", onClick: () => restore.mutate(id) },
          }),
      }),
    restoreNote: (id: string) => restore.mutate(id),
    deleteNoteForever: (id: string) => deleteForever.mutate(id),
  };
};

/** A single note plus its autosave, for the editor route. */
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
      // List order, excerpts and tag counts all depend on the saved body.
      void queryClient.invalidateQueries({ queryKey: queryKeys.notes.lists() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.notes.tags() });
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
  };
};
