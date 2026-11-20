import { useMemo } from "react";
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
import { buildNoteTree } from "../note-tree";
import type {
  CreateNotePayload,
  NoteIndexEntry,
  NoteSummary,
  NotesFilter,
  UpdateNotePayload,
} from "../types/note-types";

/** One slice of the notes list (a view, optionally searched or tag-filtered). */
export const useNotes = (filter: NotesFilter, { enabled = true }: { enabled?: boolean } = {}) => {
  const api = useNotesApi();

  const query = useQuery({
    queryKey: queryKeys.notes.list(filter),
    queryFn: () => api.fetchNotes(filter),
    enabled,
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

/** Every live note, light, plus the page tree built from it. */
export const useNoteIndex = () => {
  const api = useNotesApi();
  const query = useQuery({
    queryKey: queryKeys.notes.index(),
    queryFn: api.fetchIndex,
    staleTime: 30_000,
  });
  const entries = query.data;
  const tree = useMemo(() => buildNoteTree(entries ?? []), [entries]);
  return { entries: entries ?? [], tree, loading: query.isPending };
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

export const useBacklinks = (id: string | undefined) => {
  const api = useNotesApi();
  return useQuery({
    queryKey: queryKeys.notes.backlinks(id ?? ""),
    queryFn: () => api.fetchBacklinks(id as string),
    enabled: Boolean(id),
    staleTime: 15_000,
  });
};

export const useNoteVersions = (id: string, enabled: boolean) => {
  const api = useNotesApi();
  return useQuery({
    queryKey: queryKeys.notes.versions(id),
    queryFn: () => api.fetchVersions(id),
    enabled,
  });
};

export const useNoteVersion = (id: string, versionId: string | null) => {
  const api = useNotesApi();
  return useQuery({
    queryKey: queryKeys.notes.version(id, versionId ?? ""),
    queryFn: () => api.fetchVersion(id, versionId as string),
    enabled: Boolean(versionId),
    staleTime: Infinity,
  });
};

type QueryClient = ReturnType<typeof useQueryClient>;

/** Refetches every notes list, the index (tree, links) and the tag counts. */
const refreshNotes = (queryClient: QueryClient) => {
  void queryClient.invalidateQueries({ queryKey: queryKeys.notes.lists() });
  void queryClient.invalidateQueries({ queryKey: queryKeys.notes.index() });
  void queryClient.invalidateQueries({ queryKey: queryKeys.notes.tags() });
};

const writeDetail = (queryClient: QueryClient, note: { _id: string }) => {
  queryClient.setQueryData(queryKeys.notes.detail(note._id), note);
};

/** Optimistically patches one index entry (rename, icon, favorite, move). */
const patchIndex = (
  queryClient: QueryClient,
  id: string,
  patch: Partial<NoteIndexEntry>,
) => {
  queryClient.setQueryData<NoteIndexEntry[]>(queryKeys.notes.index(), (previous) =>
    previous?.map((entry) => (entry._id === id ? { ...entry, ...patch } : entry)),
  );
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

/** Note mutations shared by the sidebar, the dashboard and the editor. */
export const useNoteActions = () => {
  const queryClient = useQueryClient();
  const api = useNotesApi();

  const create = useMutation({
    mutationFn: (payload: CreateNotePayload) => api.createNote(payload),
    onSuccess: (note) => {
      writeDetail(queryClient, note);
      refreshNotes(queryClient);
    },
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateNotePayload }) =>
      api.updateNote(id, payload),
    onMutate: ({ id, payload }) => {
      const patch: Partial<NoteIndexEntry> = {};
      if (payload.pinned !== undefined) patch.pinned = payload.pinned;
      if (payload.icon !== undefined) patch.icon = payload.icon;
      if (payload.title !== undefined) patch.title = payload.title;
      if (payload.parentId !== undefined) patch.parentId = payload.parentId;
      if (Object.keys(patch).length > 0) patchIndex(queryClient, id, patch);
    },
    onSuccess: (note) => {
      writeDetail(queryClient, note);
      refreshNotes(queryClient);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
      refreshNotes(queryClient);
    },
  });

  const reorder = useMutation({
    mutationFn: ({ parentId, ids }: { parentId: string | null; ids: string[] }) =>
      api.reorderNotes(parentId, ids),
    onMutate: ({ ids }) => {
      queryClient.setQueryData<NoteIndexEntry[]>(queryKeys.notes.index(), (previous) =>
        previous?.map((entry) => {
          const index = ids.indexOf(entry._id);
          return index < 0 ? entry : { ...entry, order: index + 1 };
        }),
      );
    },
    onSettled: () => refreshNotes(queryClient),
  });

  const duplicate = useMutation({
    mutationFn: (id: string) => api.duplicateNote(id),
    onSuccess: (note) => {
      writeDetail(queryClient, note);
      refreshNotes(queryClient);
    },
  });

  const restoreVersion = useMutation({
    mutationFn: ({ id, versionId }: { id: string; versionId: string }) =>
      api.restoreVersion(id, versionId),
    onSuccess: (note) => {
      writeDetail(queryClient, note);
      void queryClient.invalidateQueries({ queryKey: queryKeys.notes.versions(note._id) });
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

  const updateNote = (id: string, payload: UpdateNotePayload) =>
    update.mutateAsync({ id, payload });

  return {
    createNote: (payload: CreateNotePayload = {}) => create.mutateAsync(payload),
    updateNote,
    duplicateNote: (id: string) => duplicate.mutateAsync(id),
    setPinned: (id: string, pinned: boolean) =>
      update.mutate({ id, payload: { pinned } }),
    setIcon: (id: string, icon: string) => update.mutate({ id, payload: { icon } }),
    movePage: (id: string, parentId: string | null) =>
      update.mutateAsync({ id, payload: { parentId } }),
    reorderPages: (parentId: string | null, ids: string[]) =>
      reorder.mutateAsync({ parentId, ids }),
    restoreVersion: (id: string, versionId: string) =>
      restoreVersion.mutateAsync({ id, versionId }),
    archiveNote: (id: string) =>
      archive.mutate(id, {
        onSuccess: () =>
          toast("Page archived", {
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

/** Opens (creating on first visit) the daily note for a `YYYY-MM-DD` day. */
export const useOpenDaily = () => {
  const queryClient = useQueryClient();
  const api = useNotesApi();
  const mutation = useMutation({
    mutationFn: ({ date, title }: { date: string; title: string }) => api.openDaily(date, title),
    onSuccess: (note) => {
      writeDetail(queryClient, note);
      void queryClient.invalidateQueries({ queryKey: queryKeys.notes.index() });
    },
  });
  return mutation.mutateAsync;
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
    onMutate: (payload) => {
      if (id && payload.title !== undefined) {
        patchIndex(queryClient, id, { title: payload.title, empty: false });
      }
    },
    onSuccess: (updated) => {
      // A refetch started before this save landed would bring the old body
      // back over it (and the open editor would show it): drop it.
      void queryClient.cancelQueries({ queryKey: queryKeys.notes.detail(updated._id) });
      queryClient.setQueryData(queryKeys.notes.detail(updated._id), updated);
      // List order, excerpts, tag counts and links all depend on the saved body.
      refreshNotes(queryClient);
      void queryClient.invalidateQueries({ queryKey: queryKeys.notes.backlinks(updated._id) });
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
