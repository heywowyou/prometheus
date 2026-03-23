import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, LayoutGrid, List, Pin } from "lucide-react";
import { useNotes } from "../hooks/useNotes";
import NoteCard from "../components/NoteCard";
import DeleteNoteModal from "../components/DeleteNoteModal";
import { Button } from "../../../components/ui/button";
import { useNotesApi } from "../api/notes-api";
import type { Note } from "../types/note-types";

type View = "list" | "grid";

function getStoredView(): View {
  try {
    const v = localStorage.getItem("notes-view");
    return v === "list" || v === "grid" ? v : "grid";
  } catch {
    return "grid";
  }
}

function NotesDashboardPageInner() {
  const navigate = useNavigate();
  const { notes, loading, createNote, pinNote, archiveNote, deleteNote } = useNotes();
  const { createNote: apiCreate } = useNotesApi();

  const [view, setView] = useState<View>(getStoredView);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);

  const handleViewChange = (v: View) => {
    setView(v);
    try { localStorage.setItem("notes-view", v); } catch { /* ignore */ }
  };

  const handleNewNote = async () => {
    const note = await createNote();
    navigate(`/notes/${note._id}`);
  };

  const handleDuplicate = async (note: Note) => {
    const copy = await apiCreate({ title: note.title, content: note.content });
    navigate(`/notes/${copy._id}`);
  };

  const handleDeleteConfirm = async () => {
    if (!noteToDelete) return;
    await deleteNote(noteToDelete._id);
    setNoteToDelete(null);
  };

  const pinned = notes.filter((n) => n.pinned);
  const unpinned = notes.filter((n) => !n.pinned);

  const gridClass =
    view === "grid"
      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
      : "flex flex-col gap-2";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-accent" />
          <h1 className="text-xl font-semibold text-foreground">Notes</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center border border-border rounded-md overflow-hidden">
            <button
              className={`p-1.5 ${view === "list" ? "bg-accent/10 text-accent" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => handleViewChange("list")}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              className={`p-1.5 ${view === "grid" ? "bg-accent/10 text-accent" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => handleViewChange("grid")}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          <Button size="sm" onClick={handleNewNote}>
            + New Note
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : notes.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No notes yet. Create your first note.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pinned section */}
          {pinned.length > 0 && (
            <section>
              <div className="flex items-center gap-1.5 mb-2">
                <Pin className="w-3.5 h-3.5 text-accent" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Pinned
                </span>
              </div>
              <div className={gridClass}>
                {pinned.map((note) => (
                  <NoteCard
                    key={note._id}
                    note={note}
                    view={view}
                    onPin={pinNote}
                    onDuplicate={handleDuplicate}
                    onArchive={archiveNote}
                    onDelete={setNoteToDelete}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Unpinned section */}
          {unpinned.length > 0 && (
            <section>
              {pinned.length > 0 && (
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                  Notes
                </span>
              )}
              <div className={gridClass}>
                {unpinned.map((note) => (
                  <NoteCard
                    key={note._id}
                    note={note}
                    view={view}
                    onPin={pinNote}
                    onDuplicate={handleDuplicate}
                    onArchive={archiveNote}
                    onDelete={setNoteToDelete}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <DeleteNoteModal
        open={noteToDelete !== null}
        onClose={() => setNoteToDelete(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

function NotesDashboardPage() {
  return <NotesDashboardPageInner />;
}

export default NotesDashboardPage;
