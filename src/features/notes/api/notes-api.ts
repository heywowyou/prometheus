import { useCallback, useMemo } from "react";
import { useApiClient } from "@lib/api/api-client";
import type {
  Note,
  NoteSummary,
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

  return useMemo(
    () => ({
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
