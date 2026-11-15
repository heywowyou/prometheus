import { useCallback, useMemo } from "react";
import { useApiClient } from "@lib/api/api-client";
import type {
  Backlinks,
  Note,
  NoteIndexEntry,
  NoteSummary,
  NoteVersion,
  NoteVersionSummary,
  NotesFilter,
  TagCount,
  CreateNotePayload,
  UpdateNotePayload,
} from "../types/note-types";

const NOTES_PATH = "/notes";

export const useNotesApi = () => {
  const client = useApiClient();

  const fetchNotes = useCallback(
    async ({ view, query, tag }: NotesFilter): Promise<NoteSummary[]> => {
      const { data } = await client.get<NoteSummary[]>(NOTES_PATH, {
        params: {
          view,
          ...(query ? { q: query } : {}),
          ...(tag ? { tag } : {}),
        },
      });
      return data;
    },
    [client],
  );

  const fetchTags = useCallback(async (): Promise<TagCount[]> => {
    const { data } = await client.get<TagCount[]>(`${NOTES_PATH}/tags`);
    return data;
  }, [client]);

  const fetchNote = useCallback(
    async (id: string): Promise<Note> => {
      const { data } = await client.get<Note>(`${NOTES_PATH}/${id}`);
      return data;
    },
    [client],
  );

  const createNote = useCallback(
    async (payload: CreateNotePayload): Promise<Note> => {
      const { data } = await client.post<Note>(NOTES_PATH, payload);
      return data;
    },
    [client],
  );

  const updateNote = useCallback(
    async (id: string, payload: UpdateNotePayload): Promise<Note> => {
      const { data } = await client.patch<Note>(`${NOTES_PATH}/${id}`, payload);
      return data;
    },
    [client],
  );

  const duplicateNote = useCallback(
    async (id: string): Promise<Note> => {
      const { data } = await client.post<Note>(`${NOTES_PATH}/${id}/duplicate`);
      return data;
    },
    [client],
  );

  /** Moves a note to the trash (kept 30 days). */
  const trashNote = useCallback(
    async (id: string): Promise<Note> => {
      const { data } = await client.delete<Note>(`${NOTES_PATH}/${id}`);
      return data;
    },
    [client],
  );

  const restoreNote = useCallback(
    async (id: string): Promise<Note> => {
      const { data } = await client.patch<Note>(`${NOTES_PATH}/${id}/restore`);
      return data;
    },
    [client],
  );

  /** Permanent delete; the API only allows it for notes already in the trash. */
  const deleteNoteForever = useCallback(
    async (id: string): Promise<void> => {
      await client.delete(`${NOTES_PATH}/${id}`, { params: { permanent: "true" } });
    },
    [client],
  );

  /** Every live note, light: the page tree, link targets and the graph. */
  const fetchIndex = useCallback(async (): Promise<NoteIndexEntry[]> => {
    const { data } = await client.get<NoteIndexEntry[]>(`${NOTES_PATH}/index`);
    return data;
  }, [client]);

  /** Sets the order of a page's children (`null`: the top level). */
  const reorderNotes = useCallback(
    async (parentId: string | null, ids: string[]): Promise<void> => {
      await client.patch(`${NOTES_PATH}/reorder`, { parentId, ids });
    },
    [client],
  );

  /** The daily note for `date` (`YYYY-MM-DD`), created on first open. */
  const openDaily = useCallback(
    async (date: string, title: string): Promise<Note> => {
      const { data } = await client.post<Note>(`${NOTES_PATH}/daily/${date}`, { title });
      return data;
    },
    [client],
  );

  const fetchBacklinks = useCallback(
    async (id: string): Promise<Backlinks> => {
      const { data } = await client.get<Backlinks>(`${NOTES_PATH}/${id}/backlinks`);
      return data;
    },
    [client],
  );

  const fetchVersions = useCallback(
    async (id: string): Promise<NoteVersionSummary[]> => {
      const { data } = await client.get<NoteVersionSummary[]>(`${NOTES_PATH}/${id}/versions`);
      return data;
    },
    [client],
  );

  const fetchVersion = useCallback(
    async (id: string, versionId: string): Promise<NoteVersion> => {
      const { data } = await client.get<NoteVersion>(
        `${NOTES_PATH}/${id}/versions/${versionId}`,
      );
      return data;
    },
    [client],
  );

  const restoreVersion = useCallback(
    async (id: string, versionId: string): Promise<Note> => {
      const { data } = await client.post<Note>(
        `${NOTES_PATH}/${id}/versions/${versionId}/restore`,
      );
      return data;
    },
    [client],
  );

  return useMemo(
    () => ({
      fetchIndex,
      reorderNotes,
      openDaily,
      fetchBacklinks,
      fetchVersions,
      fetchVersion,
      restoreVersion,
      fetchNotes,
      fetchTags,
      fetchNote,
      createNote,
      updateNote,
      duplicateNote,
      trashNote,
      restoreNote,
      deleteNoteForever,
    }),
    [
      fetchIndex,
      reorderNotes,
      openDaily,
      fetchBacklinks,
      fetchVersions,
      fetchVersion,
      restoreVersion,
      fetchNotes,
      fetchTags,
      fetchNote,
      createNote,
      updateNote,
      duplicateNote,
      trashNote,
      restoreNote,
      deleteNoteForever,
    ],
  );
};
