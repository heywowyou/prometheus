import { useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  FilePlus2,
  Home,
  LayoutGrid,
  Network,
  Plus,
  Search,
  Star,
} from "lucide-react";
import { cn } from "@lib/utils";
import { useNoteActions, useNoteIndex } from "../hooks/useNotes";
import { dailyTitle, dayKey, titleOf } from "../note-tree";
import { NoteIcon } from "./PageDecor";
import PageTree, { PageMenu } from "./PageTree";
import MoveToDialog from "./MoveToDialog";

const JOURNAL_LIMIT = 5;

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-1">
      <div className="flex h-7 items-center justify-between px-2">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function NavRow({
  to,
  icon,
  label,
  active,
  onNavigate,
  trailing,
}: {
  to: string;
  icon: ReactNode;
  label: string;
  active?: boolean;
  onNavigate?: () => void;
  trailing?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "group flex h-8 items-center gap-2 rounded-lg px-2 text-sm transition-colors",
        active ? "bg-raised text-foreground" : "text-soft hover:bg-secondary hover:text-foreground",
      )}
    >
      <Link to={to} onClick={onNavigate} className="flex min-w-0 flex-1 items-center gap-2">
        {icon}
        <span className="truncate">{label}</span>
      </Link>
      {trailing}
    </div>
  );
}

/** Everything in the notes app, in one column: search, favorites, pages, journal, templates. */
export default function NotesSidebar({
  activeId,
  onNavigate,
  onOpenSwitcher,
  className,
}: {
  activeId?: string;
  onNavigate?: () => void;
  onOpenSwitcher: () => void;
  className?: string;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { tree, loading } = useNoteIndex();
  const actions = useNoteActions();
  const [moving, setMoving] = useState<string | null>(null);
  const today = dayKey(new Date());

  const newPage = async (payload: Parameters<typeof actions.createNote>[0] = {}) => {
    const note = await actions.createNote(payload);
    onNavigate?.();
    navigate(`/notes/${note._id}`);
  };

  return (
    <div className={cn("flex flex-col gap-5 text-sm", className)}>
      <div className="space-y-0.5">
        <button
          type="button"
          onClick={onOpenSwitcher}
          className="flex h-9 w-full items-center gap-2 rounded-full border border-border bg-card px-3 text-left text-muted-foreground transition-colors hover:text-foreground"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="flex-1">Search</span>
          <kbd className="hidden rounded-md border border-border px-1.5 text-[10px] lg:inline">Ctrl K</kbd>
        </button>
        <div className="pt-2" />
        <NavRow
          to="/notes"
          icon={<Home className="h-4 w-4 text-muted-foreground" />}
          label="Home"
          onNavigate={onNavigate}
          active={activeId === undefined && location.pathname === "/notes"}
        />
        <NavRow
          to={`/notes/daily/${today}`}
          icon={<CalendarDays className="h-4 w-4 text-muted-foreground" />}
          label="Today's note"
          onNavigate={onNavigate}
          active={tree.byId.get(activeId ?? "")?.dailyDate === today}
        />
        <button
          type="button"
          onClick={() => void newPage()}
          className="flex h-8 w-full items-center gap-2 rounded-lg px-2 text-soft transition-colors hover:bg-secondary hover:text-foreground"
        >
          <FilePlus2 className="h-4 w-4 text-muted-foreground" />
          New page
        </button>
      </div>

      {tree.favorites.length > 0 && (
        <Section title="Favorites">
          <ul>
            {tree.favorites.map((entry) => (
              <li key={entry._id}>
                <NavRow
                  to={`/notes/${entry._id}`}
                  icon={<NoteIcon icon={entry.icon} className="h-4 w-4" />}
                  label={titleOf(entry)}
                  active={activeId === entry._id}
                  onNavigate={onNavigate}
                  trailing={
                    <span className="opacity-0 group-hover:opacity-100 has-[[data-state=open]]:opacity-100 touch:opacity-100">
                      <PageMenu entry={entry} onMove={() => setMoving(entry._id)} onNavigate={onNavigate} />
                    </span>
                  }
                />
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section
        title="Pages"
        action={
          <button
            type="button"
            aria-label="New page"
            onClick={() => void newPage()}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
          </button>
        }
      >
        {loading ? (
          <div className="space-y-1.5 px-2">
            {[70, 55, 80, 60].map((width) => (
              <div key={width} className="h-5 animate-pulse rounded-md bg-card" style={{ width: `${width}%` }} />
            ))}
          </div>
        ) : tree.roots.length === 0 ? (
          <p className="px-2 py-1 text-muted-foreground">No pages yet.</p>
        ) : (
          <PageTree tree={tree} activeId={activeId} onNavigate={onNavigate} />
        )}
      </Section>

      <Section title="Journal">
        <ul>
          {tree.dailies.slice(0, JOURNAL_LIMIT).map((entry) => (
            <li key={entry._id}>
              <NavRow
                to={`/notes/${entry._id}`}
                icon={<NoteIcon icon={entry.icon || undefined} className="h-4 w-4" />}
                label={entry.dailyDate === today ? "Today" : dailyTitle(entry.dailyDate ?? "")}
                active={activeId === entry._id}
                onNavigate={onNavigate}
              />
            </li>
          ))}
          {tree.dailies.length === 0 && (
            <p className="px-2 py-1 text-muted-foreground">Open today's note to start a journal.</p>
          )}
        </ul>
      </Section>

      <Section
        title="Templates"
        action={
          <button
            type="button"
            aria-label="New template"
            onClick={() => void newPage({ isTemplate: true, title: "New template" })}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
          </button>
        }
      >
        <ul>
          {tree.templates.map((entry) => (
            <li key={entry._id}>
              <NavRow
                to={`/notes/${entry._id}`}
                icon={<NoteIcon icon={entry.icon} className="h-4 w-4" />}
                label={titleOf(entry)}
                active={activeId === entry._id}
                onNavigate={onNavigate}
                trailing={
                  <button
                    type="button"
                    onClick={() => void newPage({ templateId: entry._id })}
                    className="shrink-0 rounded-full px-2 py-0.5 text-xs text-muted-foreground opacity-0 hover:bg-raised hover:text-foreground group-hover:opacity-100 touch:opacity-100"
                  >
                    Use
                  </button>
                }
              />
            </li>
          ))}
          {tree.templates.length === 0 && (
            <p className="px-2 py-1 text-muted-foreground">Save any page as a template from its menu.</p>
          )}
        </ul>
      </Section>

      <div className="space-y-0.5 border-t border-border pt-4">
        <NavRow to="/notes/graph" icon={<Network className="h-4 w-4 text-muted-foreground" />} label="Graph view" onNavigate={onNavigate} />
        <NavRow to="/notes/all" icon={<LayoutGrid className="h-4 w-4 text-muted-foreground" />} label="All notes, archive and trash" onNavigate={onNavigate} />
        {tree.favorites.length === 0 && (
          <p className="flex items-center gap-1.5 px-2 pt-2 text-xs text-muted-foreground">
            <Star className="h-3 w-3" /> Star a page to pin it to the top.
          </p>
        )}
      </div>
      <MoveToDialog noteId={moving} onClose={() => setMoving(null)} />
    </div>
  );
}
