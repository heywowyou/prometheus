import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, CornerDownLeft, FilePlus2, LayoutGrid, Network, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@components/ui/dialog";
import { cn } from "@lib/utils";
import { useNoteActions, useNoteIndex, useNotes } from "../hooks/useNotes";
import { dailyTitle, dayKey, titleOf } from "../note-tree";
import { matches } from "../editor/suggestion-list";
import { NoteIcon } from "./PageDecor";

interface Row {
  key: string;
  group: string;
  icon: ReactNode;
  title: string;
  subtitle?: string;
  run: () => void | Promise<void>;
}

const MAX_TITLE_MATCHES = 8;
const MAX_TEXT_MATCHES = 6;

/** Ctrl/Cmd+K: jump to any page by title or text, or run a notes action. */
export default function QuickSwitcher({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const navigate = useNavigate();
  const { entries, tree } = useNoteIndex();
  const actions = useNoteActions();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), 200);
    return () => window.clearTimeout(timer);
  }, [query]);

  // Full-text search only once there's something worth searching for.
  const textSearch = debounced.length >= 2;
  const { notes: textHits } = useNotes({ view: "active", query: debounced }, { enabled: textSearch });

  const close = () => {
    onOpenChange(false);
    setQuery("");
    setActive(0);
  };

  const go = (path: string) => () => {
    close();
    navigate(path);
  };

  const rows = useMemo<Row[]>(() => {
    const trimmed = query.trim();
    const pathLabel = (id: string) =>
      tree
        .pathTo(id)
        .map((entry) => titleOf(entry))
        .join(" / ");

    const byRecency = [...entries].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const titleMatches = (trimmed ? entries.filter((entry) => matches(`${titleOf(entry)} ${entry.dailyDate ?? ""}`, trimmed)) : byRecency)
      .sort((a, b) => {
        if (!trimmed) return 0;
        // Prefix matches first, then recent.
        const lower = trimmed.toLowerCase();
        const aStarts = titleOf(a).toLowerCase().startsWith(lower) ? 0 : 1;
        const bStarts = titleOf(b).toLowerCase().startsWith(lower) ? 0 : 1;
        return aStarts - bStarts || b.updatedAt.localeCompare(a.updatedAt);
      })
      .slice(0, MAX_TITLE_MATCHES);

    const seen = new Set(titleMatches.map((entry) => entry._id));
    const pages: Row[] = titleMatches.map((entry) => ({
      key: entry._id,
      group: trimmed ? "Pages" : "Recent",
      icon: <NoteIcon icon={entry.icon} className="h-4 w-4" />,
      title: entry.dailyDate ? dailyTitle(entry.dailyDate) : titleOf(entry),
      subtitle: entry.isTemplate ? "Template" : pathLabel(entry._id) || undefined,
      run: go(`/notes/${entry._id}`),
    }));

    const text: Row[] = textSearch && trimmed
      ? textHits
          .filter((hit) => !seen.has(hit._id))
          .slice(0, MAX_TEXT_MATCHES)
          .map((hit) => ({
            key: `text-${hit._id}`,
            group: "In the text",
            icon: <NoteIcon icon={hit.icon} className="h-4 w-4" />,
            title: titleOf(hit),
            subtitle: hit.excerpt,
            run: go(`/notes/${hit._id}`),
          }))
      : [];

    const today = dayKey(new Date());
    const commands: Row[] = [
      ...(trimmed
        ? [
            {
              key: "create",
              group: "Actions",
              icon: <FilePlus2 className="h-4 w-4 text-muted-foreground" />,
              title: `New page “${trimmed}”`,
              run: async () => {
                const note = await actions.createNote({ title: trimmed });
                close();
                navigate(`/notes/${note._id}`);
              },
            },
          ]
        : []),
      {
        key: "today",
        group: "Actions",
        icon: <CalendarDays className="h-4 w-4 text-muted-foreground" />,
        title: "Today's note",
        run: go(`/notes/daily/${today}`),
      },
      {
        key: "new",
        group: "Actions",
        icon: <FilePlus2 className="h-4 w-4 text-muted-foreground" />,
        title: "New blank page",
        run: async () => {
          const note = await actions.createNote({});
          close();
          navigate(`/notes/${note._id}`);
        },
      },
      {
        key: "graph",
        group: "Actions",
        icon: <Network className="h-4 w-4 text-muted-foreground" />,
        title: "Graph view",
        run: go("/notes/graph"),
      },
      {
        key: "all",
        group: "Actions",
        icon: <LayoutGrid className="h-4 w-4 text-muted-foreground" />,
        title: "All notes, archive and trash",
        run: go("/notes/all"),
      },
    ].filter((row) => !trimmed || row.key === "create" || matches(row.title, trimmed));

    return [...pages, ...text, ...commands];
    // `go` and `close` only close over stable setters and navigate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, tree, query, textSearch, textHits, actions, navigate]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (index + 1) % Math.max(rows.length, 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (index - 1 + rows.length) % Math.max(rows.length, 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      void rows[active]?.run();
    }
  };

  let lastGroup = "";

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="top-[12vh] max-w-xl translate-y-0 gap-0 overflow-hidden p-0 [&>button]:hidden">
        <DialogTitle className="sr-only">Search notes</DialogTitle>
        <DialogDescription className="sr-only">Jump to a page or run an action</DialogDescription>
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search pages or type a command…"
            aria-label="Search pages"
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden rounded-md border border-border px-1.5 text-[10px] text-muted-foreground sm:inline">Esc</kbd>
        </div>
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2" role="listbox">
          {rows.length === 0 && <p className="px-3 py-6 text-center text-sm text-muted-foreground">Nothing found.</p>}
          {rows.map((row, index) => {
            const header = row.group !== lastGroup ? row.group : null;
            lastGroup = row.group;
            return (
              <div key={row.key}>
                {header && (
                  <p className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    {header}
                  </p>
                )}
                <button
                  type="button"
                  role="option"
                  aria-selected={index === active}
                  data-index={index}
                  onMouseMove={() => setActive(index)}
                  onClick={() => void row.run()}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm",
                    index === active ? "bg-raised text-foreground" : "text-soft",
                  )}
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center">{row.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{row.title}</span>
                    {row.subtitle && <span className="block truncate text-xs text-muted-foreground">{row.subtitle}</span>}
                  </span>
                  {index === active && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                </button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
