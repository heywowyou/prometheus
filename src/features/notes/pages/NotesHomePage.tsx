import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, CalendarDays, FilePlus2, Network, Search } from "lucide-react";
import { useNoteActions, useNoteIndex } from "../hooks/useNotes";
import { dailyTitle, dayKey, titleOf } from "../note-tree";
import { NoteIcon } from "../components/PageDecor";
import { useNotesLayout } from "../notes-layout-context";
import type { NoteIndexEntry } from "../types/note-types";

const RECENT_LIMIT = 8;

const relative = (iso: string) => {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
};

function PageCard({ entry, path }: { entry: NoteIndexEntry; path?: string }) {
  return (
    <Link
      to={`/notes/${entry._id}`}
      className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-rating/40"
    >
      <NoteIcon icon={entry.icon} className="h-6 w-6 text-xl" />
      <span className="min-w-0">
        <span className="block truncate text-sm text-foreground">
          {entry.dailyDate ? dailyTitle(entry.dailyDate) : titleOf(entry)}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {path ? `${path} · ` : ""}
          {relative(entry.updatedAt)}
        </span>
      </span>
    </Link>
  );
}

/** Landing for /notes: today's note, recently edited and favorite pages. */
export default function NotesHomePage() {
  const navigate = useNavigate();
  const { entries, tree, loading } = useNoteIndex();
  const actions = useNoteActions();
  const { openSwitcher } = useNotesLayout();
  const today = dayKey(new Date());

  const recent = [...entries]
    .filter((entry) => !entry.isTemplate && !entry.empty)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, RECENT_LIMIT);

  const pathOf = (id: string) =>
    tree
      .pathTo(id)
      .map((entry) => titleOf(entry))
      .join(" / ");

  const newPage = async () => {
    const note = await actions.createNote({});
    navigate(`/notes/${note._id}`);
  };

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <p className="eyebrow">Notes</p>
        <h1 className="page-title">Your pages</h1>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link
          to={`/notes/daily/${today}`}
          className="flex items-center gap-3 rounded-2xl border border-rating/30 bg-rating/10 p-4 transition-colors hover:bg-rating/15"
        >
          <CalendarDays className="h-5 w-5 text-rating" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-foreground">Today's note</span>
            <span className="block truncate text-xs text-muted-foreground">{dailyTitle(today)}</span>
          </span>
          <ArrowRight className="h-4 w-4 text-rating" />
        </Link>
        <button
          type="button"
          onClick={() => void newPage()}
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-rating/40"
        >
          <FilePlus2 className="h-5 w-5 text-muted-foreground" />
          <span>
            <span className="block text-sm text-foreground">New page</span>
            <span className="block text-xs text-muted-foreground">Type / for blocks, [[ to link</span>
          </span>
        </button>
        <button
          type="button"
          onClick={openSwitcher}
          className="hidden items-center gap-3 sm:flex rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-rating/40"
        >
          <Search className="h-5 w-5 text-muted-foreground" />
          <span>
            <span className="block text-sm text-foreground">Search</span>
            <span className="block text-xs text-muted-foreground">Ctrl K from anywhere in notes</span>
          </span>
        </button>
      </div>

      {tree.favorites.length > 0 && (
        <section className="space-y-3">
          <h2 className="section-title">Favorites</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {tree.favorites.map((entry) => (
              <PageCard key={entry._id} entry={entry} path={pathOf(entry._id)} />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title">Recently edited</h2>
          <Link to="/notes/graph" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <Network className="h-4 w-4" /> Graph
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="h-[104px] animate-pulse rounded-2xl bg-card" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            Nothing written yet. Start with today's note or a new page.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {recent.map((entry) => (
              <PageCard key={entry._id} entry={entry} path={pathOf(entry._id)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
