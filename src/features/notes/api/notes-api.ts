import { useCallback, useMemo } from "react";
import { useApiClient } from "@lib/api/api-client";
import type {
  Note,
  CreateNotePayload,
  UpdateNotePayload,
} from "../types/note-types";

const NOTES_PATH = "/notes";

export const useNotesApi = () => {
  const client = useApiClient();

  const fetchNotes = useCallback(
    async (opts: { archived?: boolean } = {}): Promise<Note[]> => {
      const { data } = await client.get<Note[]>(NOTES_PATH, {
        params: opts.archived ? { archived: "true" } : undefined,
      });
      return data;
    },
    [client],
  );

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

  const deleteNote = useCallback(
    async (id: string): Promise<void> => {
      await client.delete(`${NOTES_PATH}/${id}`);
    },
    [client],
  );

  return useMemo(
    () => ({ fetchNotes, fetchNote, createNote, updateNote, deleteNote }),
    [fetchNotes, fetchNote, createNote, updateNote, deleteNote],
  );
};
