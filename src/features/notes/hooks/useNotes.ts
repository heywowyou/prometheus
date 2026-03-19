import { useState, useEffect, useCallback } from "react";
import { useNotesApi } from "../api/notes-api";
import type { Note } from "../types/note-types";

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const { fetchNotes, createNote: apiCreate, updateNote: apiUpdate, deleteNote: apiDelete } = useNotesApi();

  const load = useCallback(async () => {
    try {
      const data = await fetchNotes();
      setNotes(data);
    } catch (error) {
      console.error("Failed to fetch notes:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchNotes]);

  const createNote = useCallback(async (title = "", content = ""): Promise<Note> => {
    const note = await apiCreate({ title, content });
    setNotes((prev) => [note, ...prev]);
    return note;
  }, [apiCreate]);

  const updateNote = useCallback(async (
    id: string,
    data: { title?: string; content?: string; pinned?: boolean; archived?: boolean }
  ): Promise<Note> => {
    const updated = await apiUpdate(id, data);
    setNotes((prev) => prev.map((n) => (n._id === id ? updated : n)));
    return updated;
  }, [apiUpdate]);

  const pinNote = useCallback(async (id: string, pinned: boolean) => {
    const updated = await apiUpdate(id, { pinned });
    setNotes((prev) => prev.map((n) => (n._id === id ? updated : n)));
  }, [apiUpdate]);

  const archiveNote = useCallback(async (id: string) => {
    await apiUpdate(id, { archived: true });
    setNotes((prev) => prev.filter((n) => n._id !== id));
  }, [apiUpdate]);

  const deleteNote = useCallback(async (id: string) => {
    await apiDelete(id);
    setNotes((prev) => prev.filter((n) => n._id !== id));
  }, [apiDelete]);

  useEffect(() => {
    void load();
  }, [load]);

  return { notes, loading, createNote, updateNote, pinNote, archiveNote, deleteNote, refetch: load };
};
