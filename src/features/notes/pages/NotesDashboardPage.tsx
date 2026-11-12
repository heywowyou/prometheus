import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Archive,
  FileText,
  LayoutGrid,
  List,
  Pin,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@components/ui/button";
import EmptyState from "@components/feedback/EmptyState";
import ConfirmDialog from "@components/feedback/ConfirmDialog";
import { useLocalStorage } from "@lib/hooks/useLocalStorage";
import { useDebouncedValue } from "@lib/hooks/useDebouncedValue";
import { cn } from "@lib/utils";
import { useNoteActions, useNoteTags, useNotes } from "../hooks/useNotes";
import NoteCard from "../components/NoteCard";
import {
  TRASH_RETENTION_DAYS,
  type NoteSummary,
  type NotesView,
} from "../types/note-types";

type Layout = "list" | "grid";

const isLayout = (value: unknown): value is Layout =>
  value === "list" || value === "grid";

const VIEWS: Array<{ value: NotesView; label: string }> = [
  { value: "active", label: "Notes" },
  { value: "archived", label: "Archived" },
  { value: "trash", label: "Trash" },
];

/** True when a keystroke is going into a text field, not the page. */
const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

function NotesDashboardPage() {
  const navigate = useNavigate();
  const searchRef = useRef<HTMLInputElement>(null);

  const [view, setView] = useState<NotesView>("active");
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const [layout, setLayout] = useLocalStorage<Layout>("notes-view", "grid", isLayout);
  const [noteToDelete, setNoteToDelete] = useState<NoteSummary | null>(null);

  const query = useDebouncedValue(search.trim(), 250);
  const { notes, loading, fetching } = useNotes({
    view,
    query,
    tag: tag ?? undefined,
  });
  const tags = useNoteTags();
  const actions = useNoteActions();

  // Ctrl/⌘+K anywhere, or "/" when not typing, jumps to search.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const combo = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k";
      if (combo || (event.key === "/" && !isTyping(event.target))) {
        event.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const openNew = async () => {
    try {
      const note = await actions.createNote(tag ? { tags: [tag] } : {});
      navigate(`/notes/${note._id}`);
    } catch {
      /* already toasted by the query client */
    }
  };

  const duplicate = async (id: string) => {
    try {
      const copy = await actions.duplicateNote(id);
      navigate(`/notes/${copy._id}`);
    } catch {
      /* already toasted by the query client */
    }
  };

  const filtering = query !== "" || tag !== null;
  const grouped = view === "active" && !filtering;
  const pinned = grouped ? notes.filter((note) => note.pinned) : [];
  const others = grouped ? notes.filter((note) => !note.pinned) : notes;

  const listClass =
    layout === "grid"
      ? "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
      : "flex flex-col gap-2";

  const renderSection = (items: NoteSummary[]) => (
    <div className={listClass}>
      {items.map((note) => (
        <NoteCard
          key={note._id}
          note={note}
          layout={layout}
          view={view}
          activeTag={tag ?? undefined}
          onPin={actions.setPinned}
          onDuplicate={(id) => void duplicate(id)}
          onArchive={actions.archiveNote}
          onUnarchive={actions.unarchiveNote}
          onTrash={actions.trashNote}
          onRestore={actions.restoreNote}
          onDeleteForever={setNoteToDelete}
          onTagClick={(next) => setTag((current) => (current === next ? null : next))}
        />
      ))}
    </div>
  );

  const layoutButton = (target: Layout, Icon: typeof List, label: string) => (
    <button
      type="button"
      onClick={() => setLayout(target)}
      aria-pressed={layout === target}
      title={label}
      className={cn(
        "p-1.5",
        layout === target
          ? "bg-rating/10 text-rating"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );

  const emptyState = () => {
    if (filtering) {
      return (
        <EmptyState
          icon={Search}
          message={
            query
              ? `No notes match “${query}”${tag ? ` in #${tag}` : ""}.`
              : `No notes tagged #${tag}.`
          }
        />
      );
    }
    if (view === "archived") return <EmptyState icon={Archive} message="No archived notes." />;
    if (view === "trash") return <EmptyState icon={Trash2} message="The trash is empty." />;
    return (
      <EmptyState
        icon={FileText}
        message="No notes yet."
        action={{ label: "Create your first note", onClick: () => void openNew() }}
      />
    );
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="page-title">Notes</h2>
        <Button size="sm" onClick={() => void openNew()}>
          New note
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[12rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={searchRef}
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setSearch("");
                event.currentTarget.blur();
              }
            }}
            placeholder="Search notes"
            aria-label="Search notes"
            className="h-9 w-full rounded-xl border border-border bg-transparent pl-8 pr-14 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-border px-1.5 text-[10px] text-muted-foreground sm:block">
            Ctrl K
          </kbd>
        </div>

        <div
          role="tablist"
          aria-label="Notes view"
          className="flex items-center overflow-hidden rounded-xl border border-border text-xs"
        >
          {VIEWS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={view === option.value}
              onClick={() => setView(option.value)}
              className={cn(
                "px-3 py-2 font-medium transition-colors",
                view === option.value
                  ? "bg-rating/10 text-rating"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex items-center overflow-hidden rounded-md border border-border">
          {layoutButton("list", List, "List view")}
          {layoutButton("grid", LayoutGrid, "Grid view")}
        </div>
      </div>

      {view !== "trash" && tags.length > 0 && (
        <div className="-mx-4 mb-5 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {tags.map(({ tag: name, count }) => (
            <button
              key={name}
              type="button"
              aria-pressed={tag === name}
              onClick={() => setTag((current) => (current === name ? null : name))}
              className={cn(
                "flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors",
                tag === name
                  ? "border-rating bg-rating/10 text-rating"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              #{name}
              <span className="opacity-60">{count}</span>
              {tag === name && <X className="h-3 w-3" />}
            </button>
          ))}
        </div>
      )}

      {view === "trash" && (
        <p className="mb-4 text-xs text-muted-foreground">
          Notes in the trash are deleted for good after {TRASH_RETENTION_DAYS} days.
        </p>
      )}

      {loading ? (
        <div className={listClass}>
          {Array.from({ length: layout === "grid" ? 6 : 5 }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "animate-pulse rounded-lg border border-border bg-card",
                layout === "grid" ? "h-32 p-4" : "h-14 p-3",
              )}
            />
          ))}
        </div>
      ) : notes.length === 0 ? (
        emptyState()
      ) : (
        <div className={cn("space-y-6 transition-opacity", fetching && "opacity-70")}>
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

          {others.length > 0 && (
            <section>
              {pinned.length > 0 && (
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Notes
                </span>
              )}
              {renderSection(others)}
            </section>
          )}
        </div>
      )}

      <ConfirmDialog
        open={noteToDelete !== null}
        onClose={() => setNoteToDelete(null)}
        onConfirm={() => {
          if (noteToDelete) actions.deleteNoteForever(noteToDelete._id);
          setNoteToDelete(null);
        }}
        title="Delete forever?"
        description={`“${noteToDelete?.title.trim() || "Untitled"}” will be permanently deleted. This can't be undone.`}
        confirmLabel="Delete forever"
      />
    </div>
  );
}

export default NotesDashboardPage;
