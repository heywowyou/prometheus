import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Archive, FileText, LayoutGrid, List, Pin } from "lucide-react";
import { Button } from "@components/ui/button";
import EmptyState from "@components/feedback/EmptyState";
import ConfirmDialog from "@components/feedback/ConfirmDialog";
import { useLocalStorage } from "@lib/hooks/useLocalStorage";
import { cn } from "@lib/utils";
import { useNotes } from "../hooks/useNotes";
import NoteCard from "../components/NoteCard";
import type { Note } from "../types/note-types";

type View = "list" | "grid";

const isView = (value: unknown): value is View =>
  value === "list" || value === "grid";

function NotesDashboardPage() {
  const navigate = useNavigate();
  const [showArchived, setShowArchived] = useState(false);
  const {
    notes,
    loading,
    createNote,
    pinNote,
    archiveNote,
    unarchiveNote,
    deleteNote,
  } = useNotes({ archived: showArchived });

  const [view, setView] = useLocalStorage<View>("notes-view", "grid", isView);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);

  // Failures are toasted by the query client; there's nothing to open then.
  const openCreated = async (payload?: Parameters<typeof createNote>[0]) => {
    try {
      const note = await createNote(payload);
      navigate(`/notes/${note._id}`);
    } catch {
      /* already reported */
    }
  };

  const handleDuplicate = (note: Note) =>
    void openCreated({ title: note.title, content: note.content });

  const handleToggleArchive = (note: Note) =>
    note.archived ? unarchiveNote(note._id) : archiveNote(note._id);

  const pinned = showArchived ? [] : notes.filter((note) => note.pinned);
  const unpinned = showArchived ? notes : notes.filter((note) => !note.pinned);

  const gridClass =
    view === "grid"
      ? "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
      : "flex flex-col gap-2";

  const viewButton = (target: View, Icon: typeof List, label: string) => (
    <button
      type="button"
      onClick={() => setView(target)}
      aria-pressed={view === target}
      title={label}
      className={cn(
        "p-1.5",
        view === target
          ? "bg-rating/10 text-rating"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );

  const renderSection = (items: Note[]) => (
    <div className={gridClass}>
      {items.map((note) => (
        <NoteCard
          key={note._id}
          note={note}
          view={view}
          onPin={pinNote}
          onDuplicate={handleDuplicate}
          onToggleArchive={handleToggleArchive}
          onDelete={setNoteToDelete}
        />
      ))}
    </div>
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="page-title">{showArchived ? "Archive" : "Notes"}</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowArchived((on) => !on)}
            aria-pressed={showArchived}
            className={cn(
              "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors",
              showArchived
                ? "border-rating bg-rating/10 text-rating"
                : "border-border text-muted-foreground hover:border-muted hover:text-foreground",
            )}
          >
            <Archive className="h-3 w-3" />
            Archived
          </button>
          <div className="flex items-center overflow-hidden rounded-md border border-border">
            {viewButton("list", List, "List view")}
            {viewButton("grid", LayoutGrid, "Grid view")}
          </div>
          <Button size="sm" onClick={() => void openCreated()}>
            New note
          </Button>
        </div>
      </div>

      {loading ? (
        <div className={gridClass}>
          {Array.from({ length: view === "grid" ? 6 : 5 }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "animate-pulse rounded-lg border border-border bg-card",
                view === "grid" ? "h-32 p-4" : "h-14 p-3",
              )}
            />
          ))}
        </div>
      ) : notes.length === 0 ? (
        showArchived ? (
          <EmptyState icon={Archive} message="No archived notes." />
        ) : (
          <EmptyState
            icon={FileText}
            message="No notes yet."
            action={{
              label: "Create your first note",
              onClick: () => void openCreated(),
            }}
          />
        )
      ) : (
        <div className="space-y-6">
          {pinned.length > 0 && (
            <section>
              <div className="mb-2 flex items-center gap-1.5">
                <Pin className="h-3.5 w-3.5 text-rating" />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Pinned
                </span>
              </div>
              {renderSection(pinned)}
            </section>
          )}

          {unpinned.length > 0 && (
            <section>
              {pinned.length > 0 && (
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Notes
                </span>
              )}
              {renderSection(unpinned)}
            </section>
          )}
        </div>
      )}

      <ConfirmDialog
        open={noteToDelete !== null}
        onClose={() => setNoteToDelete(null)}
        onConfirm={() => {
          if (noteToDelete) deleteNote(noteToDelete._id);
          setNoteToDelete(null);
        }}
        title="Delete note?"
        description="This action cannot be undone. The note will be permanently deleted."
      />
    </div>
  );
}

export default NotesDashboardPage;
