import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  CalendarPlus,
  CheckSquare,
  Clapperboard,
  CornerDownLeft,
  Dumbbell,
  FilePlus2,
  Sprout,
  NotebookPen,
  Play,
  Plus,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@components/ui/dialog";
import { NAV_ITEMS } from "@app/navigation";
import { cn } from "@lib/utils";
import { useNoteActions, useNoteIndex, useNotes } from "@features/notes/hooks/useNotes";
import { NoteIcon } from "@features/notes/components/PageDecor";
import { dailyTitle, titleOf } from "@features/notes/note-tree";
import { useTodos } from "@features/todos/hooks/useTodos";
import { useTodoLists } from "@features/todos/hooks/useTodoLists";
import { parseTask } from "@features/todos/task-parse";
import { dayLabel, isDay } from "@features/todos/task-views";
import { toDayKey } from "@features/todos/due";
import { isTask, type Todo } from "@features/todos/types/todo-types";
import { useMediaLogs } from "@features/media/hooks/useMediaLogs";
import { MEDIA_TYPE_CONFIGS, configForType } from "@features/media/media-config";
import { useRoutines, useStartSession } from "@features/workouts/hooks/useWorkouts";

interface Row {
  key: string;
  group: string;
  icon: ReactNode;
  title: string;
  subtitle?: string;
  run: () => void | Promise<void>;
}

const LIMIT = 6;

const matches = (text: string, query: string) => {
  const haystack = text.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
};

/** Where a task lives, so opening it lands in the right list. */
const taskPath = (todo: Todo, today: string) => {
  const list = todo.projectId
    ? `/todos/projects/${todo.projectId}`
    : todo.areaId
      ? `/todos/areas/${todo.areaId}`
      : todo.when === "someday"
        ? "/todos/someday"
        : isDay(todo.when) && todo.when > today
          ? "/todos/upcoming"
          : isDay(todo.when) || (isDay(todo.dueDate) && todo.dueDate <= today)
            ? "/todos/today"
            : "/todos/inbox";
  return `${list}?task=${todo._id}`;
};

/** The palette body, mounted only while open so its queries load on demand. */
function PaletteBody({ initialQuery, close }: { initialQuery: string; close: () => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState(initialQuery);
  const [debounced, setDebounced] = useState(initialQuery.trim());
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const { entries } = useNoteIndex();
  const notes = useNoteActions();
  const { todos, createTodo } = useTodos();
  const { projects, areas } = useTodoLists();
  const { logs } = useMediaLogs();
  const { routines } = useRoutines();
  const { startSession } = useStartSession();

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), 200);
    return () => window.clearTimeout(timer);
  }, [query]);
  const { notes: textHits } = useNotes({ view: "active", query: debounced }, { enabled: debounced.length >= 2 });

  const go = (path: string) => () => {
    close();
    navigate(path);
  };

  const rows = useMemo<Row[]>(() => {
    const q = query.trim();
    const today = toDayKey(new Date());
    const out: Row[] = [];

    if (q) {
      const parsed = parseTask(q, { projects, areas });
      const chips = parsed.tokens.map((token) => token.label).join(" · ");
      if (parsed.text) {
        out.push({
          key: "add-task",
          group: "Create",
          icon: <Plus className="h-4 w-4 text-rating" />,
          title: `Add task “${parsed.text}”`,
          subtitle: chips || "To the Inbox. Dates, times, #lists and repeats are understood.",
          run: async () => {
            const created = await createTodo({
              text: parsed.text,
              recurrenceType: "none",
              interactionType: parsed.durationGoal ? "timer" : "checkbox",
              durationGoal: parsed.durationGoal ?? 0,
              ...(parsed.projectId ? { projectId: parsed.projectId } : {}),
              ...(parsed.areaId ? { areaId: parsed.areaId } : {}),
              ...(parsed.when ? { when: parsed.when, evening: Boolean(parsed.evening) } : {}),
              ...(parsed.time ? { time: parsed.time } : {}),
              ...(parsed.repeat ? { repeat: parsed.repeat } : {}),
              ...(parsed.dueDate ? { dueDate: parsed.dueDate } : {}),
              ...(parsed.tags.length ? { tags: parsed.tags } : {}),
              ...(parsed.important ? { important: true } : {}),
            });
            close();
            toast(`Added “${created.text}”`, {
              description: created.when && isDay(created.when) ? dayLabel(created.when) : undefined,
              action: { label: "Open", onClick: () => navigate(taskPath(created, today)) },
            });
          },
        });
      }
      out.push({
        key: "add-note",
        group: "Create",
        icon: <FilePlus2 className="h-4 w-4 text-muted-foreground" />,
        title: `New note “${q}”`,
        run: async () => {
          const note = await notes.createNote({ title: q });
          close();
          navigate(`/notes/${note._id}`);
        },
      });
      out.push({
        key: "add-event",
        group: "Create",
        icon: <CalendarPlus className="h-4 w-4 text-muted-foreground" />,
        title: `New event “${q}”`,
        run: go(`/calendar?new=${encodeURIComponent(q)}`),
      });
    }

    const openTasks = todos.filter((todo) => isTask(todo) && !todo.completed && (!q || matches(todo.text, q)));
    for (const todo of openTasks.slice(0, q ? LIMIT : 0)) {
      out.push({
        key: `task-${todo._id}`,
        group: "Tasks",
        icon: <CheckSquare className="h-4 w-4 text-muted-foreground" />,
        title: todo.text,
        subtitle: todo.when === "someday" ? "Someday" : isDay(todo.when) ? dayLabel(todo.when) : undefined,
        run: go(taskPath(todo, today)),
      });
    }

    const habits = todos.filter((todo) => !isTask(todo) && q && matches(todo.text, q));
    for (const habit of habits.slice(0, 3)) {
      out.push({
        key: `habit-${habit._id}`,
        group: "Habits",
        icon: <Sprout className="h-4 w-4 text-rating" />,
        title: habit.text,
        subtitle: habit.recurrenceType,
        run: go("/habits"),
      });
    }

    const noteMatches = (q
      ? entries.filter((entry) => matches(`${titleOf(entry)} ${entry.dailyDate ?? ""}`, q))
      : [...entries].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    ).slice(0, q ? LIMIT : 4);
    const seen = new Set(noteMatches.map((entry) => entry._id));
    for (const entry of noteMatches) {
      out.push({
        key: `note-${entry._id}`,
        group: q ? "Notes" : "Recent notes",
        icon: <NoteIcon icon={entry.icon} className="h-4 w-4" />,
        title: entry.dailyDate ? dailyTitle(entry.dailyDate) : titleOf(entry),
        run: go(`/notes/${entry._id}`),
      });
    }
    if (q.length >= 2) {
      for (const hit of textHits.filter((hit) => !seen.has(hit._id)).slice(0, 4)) {
        out.push({
          key: `note-text-${hit._id}`,
          group: "In notes",
          icon: <NoteIcon icon={hit.icon} className="h-4 w-4" />,
          title: titleOf(hit),
          subtitle: hit.excerpt,
          run: go(`/notes/${hit._id}`),
        });
      }
    }

    if (q) {
      for (const log of logs.filter((item) => matches(item.title, q)).slice(0, 4)) {
        const config = configForType(log.type);
        out.push({
          key: `media-${log._id}`,
          group: "Media",
          icon: <Clapperboard className="h-4 w-4 text-muted-foreground" />,
          title: log.title,
          subtitle: config?.plural,
          run: go(`/media/${config?.slug ?? ""}`),
        });
      }
    }

    for (const routine of routines.filter((item) => !q || matches(`start ${item.name} workout`, q)).slice(0, q ? 3 : 0)) {
      out.push({
        key: `routine-${routine._id}`,
        group: "Workouts",
        icon: <Play className="h-4 w-4 text-rating" />,
        title: `Start ${routine.name}`,
        run: () => {
          close();
          startSession(routine._id);
        },
      });
    }

    const destinations: Row[] = [
      ...NAV_ITEMS.map((item) => ({
        key: `go-${item.to}`,
        group: "Go to",
        icon: <item.icon className="h-4 w-4 text-muted-foreground" />,
        title: item.label,
        run: go(item.to),
      })),
      { key: "go-inbox", group: "Go to", icon: <ArrowRight className="h-4 w-4 text-muted-foreground" />, title: "Inbox", run: go("/todos/inbox") },
      { key: "go-upcoming", group: "Go to", icon: <ArrowRight className="h-4 w-4 text-muted-foreground" />, title: "Upcoming", run: go("/todos/upcoming") },
      { key: "go-repeating", group: "Go to", icon: <ArrowRight className="h-4 w-4 text-muted-foreground" />, title: "Repeating tasks", run: go("/todos/repeating") },
      { key: "go-logbook", group: "Go to", icon: <ArrowRight className="h-4 w-4 text-muted-foreground" />, title: "Completed tasks", run: go("/todos/completed") },
      { key: "go-daily", group: "Go to", icon: <NotebookPen className="h-4 w-4 text-muted-foreground" />, title: "Today's note", run: go("/notes/daily/today") },
      { key: "go-graph", group: "Go to", icon: <ArrowRight className="h-4 w-4 text-muted-foreground" />, title: "Notes graph", run: go("/notes/graph") },
      { key: "go-week", group: "Go to", icon: <CalendarDays className="h-4 w-4 text-muted-foreground" />, title: "This week in the calendar", run: go("/calendar?view=week") },
      { key: "go-exercises", group: "Go to", icon: <Dumbbell className="h-4 w-4 text-muted-foreground" />, title: "Exercises", run: go("/workouts/exercises") },
      ...MEDIA_TYPE_CONFIGS.map((config) => ({
        key: `go-media-${config.slug}`,
        group: "Go to",
        icon: <config.icon className="h-4 w-4 text-muted-foreground" />,
        title: config.plural,
        run: go(`/media/${config.slug}`),
      })),
      { key: "go-profile", group: "Go to", icon: <ArrowRight className="h-4 w-4 text-muted-foreground" />, title: "Profile and backup", run: go("/profile") },
    ];
    out.push(...destinations.filter((row) => !q || matches(row.title, q)).slice(0, q ? 4 : 8));
    return out;
    // `go` and `close` only close over stable setters and navigate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, entries, textHits, todos, projects, areas, logs, routines]);

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
    <>
      <div className="flex items-center gap-2 border-b border-border px-4">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          autoFocus
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="Search, or type to add a task, note or event"
          aria-label="Search or add"
          className="h-14 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
        />
        <kbd className="hidden rounded-md border border-border px-1.5 text-[10px] text-muted-foreground sm:inline">Esc</kbd>
      </div>
      <div ref={listRef} className="max-h-[min(60vh,520px)] overflow-y-auto p-2" role="listbox">
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
    </>
  );
}

/** App-wide search and quick add: notes, tasks, habits, media, workouts and every section. */
export default function CommandPalette({
  open,
  initialQuery,
  onOpenChange,
}: {
  open: boolean;
  initialQuery: string;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[10vh] max-w-xl translate-y-0 gap-0 overflow-hidden p-0 [&>button]:hidden">
        <DialogTitle className="sr-only">Search or add</DialogTitle>
        <DialogDescription className="sr-only">Jump anywhere, or create a task, note or event</DialogDescription>
        {open && <PaletteBody initialQuery={initialQuery} close={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}
