import { useCallback } from "react";
import { useApiClient } from "../../../lib/api/api-client";
import type { Note, CreateNotePayload, UpdateNotePayload } from "../types/note-types";

const NOTES_PATH = "/notes";

export const useNotesApi = () => {
  const client = useApiClient();

  const fetchNotes = useCallback(async (): Promise<Note[]> => {
    const response = await client.get<Note[]>(NOTES_PATH);
    return response.data;
  }, [client]);

  const fetchNote = useCallback(async (id: string): Promise<Note> => {
    const response = await client.get<Note>(`${NOTES_PATH}/${id}`);
    return response.data;
  }, [client]);

  const createNote = useCallback(async (payload: CreateNotePayload): Promise<Note> => {
    const response = await client.post<Note>(NOTES_PATH, payload);
    return response.data;
  }, [client]);

  const updateNote = useCallback(async (id: string, payload: UpdateNotePayload): Promise<Note> => {
    const response = await client.patch<Note>(`${NOTES_PATH}/${id}`, payload);
    return response.data;
  }, [client]);

  const deleteNote = useCallback(async (id: string): Promise<void> => {
    await client.delete(`${NOTES_PATH}/${id}`);
  }, [client]);

  return { fetchNotes, fetchNote, createNote, updateNote, deleteNote };
};
