import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, ImageIcon, Plus } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { Button } from "@components/ui/button";
import { cn } from "@lib/utils";
import { relativeDate } from "@lib/date/relative";
import { useTodos } from "@features/todos/hooks/useTodos";
import TodoItem from "@features/todos/components/TodoItem";
import type { RecurrenceType, Todo } from "@features/todos/types/todo-types";
import { compareOpenTodos } from "@features/todos/due";
import { useMediaLogs } from "@features/media/hooks/useMediaLogs";
import { configForType } from "@features/media/media-config";
import { resolveCoverUrl } from "@features/media/types/media-types";
import { useNoteActions, useNotes } from "@features/notes/hooks/useNotes";

const TODO_SECTIONS: Array<{ key: RecurrenceType; label: string }> = [
  { key: "daily", label: "Daily" },
  { key: "none", label: "To do" },
  { key: "weekly", label: "This week" },
  { key: "monthly", label: "This month" },
];

const RECENT_NOTES = 4;

const greeting = (hour: number) =>
  hour < 5 ? "Good night" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

function SectionHeader({ title, to, linkLabel }: { title: string; to: string; linkLabel: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h3 className="section-title">{title}</h3>
      <Link
        to={to}
        className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        {linkLabel}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

/** Daily habits done vs. due, as a bar. */
function DailyProgress({ done, total }: { done: number; total: number }) {
  if (total === 0) return null;
  const fraction = done / total;
  return (
    <div className="mb-4">
      <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
        <span>Daily habits</span>
        <span className="tabular-nums">
          {done}/{total}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
        <div
          className={cn("h-full rounded-full transition-all", fraction === 1 ? "bg-success" : "bg-rating")}
          style={{ width: `${fraction * 100}%` }}
        />
      </div>
    </div>
  );
}

/**
 * The landing page: what's due, what's in progress, and what was written last
 * — one screen instead of three tabs.
 */
function TodayPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [now] = useState(() => new Date());

  const { todos, loading: todosLoading, toggleTodo, timerAction } = useTodos();
  const { logs, loading: mediaLoading } = useMediaLogs();
  const { notes, loading: notesLoading } = useNotes({ view: "active" });
  const { createNote } = useNoteActions();

  const due = useMemo(
    () => todos.filter((todo) => !todo.completed).sort(compareOpenTodos),
    [todos],
  );
  const daily = todos.filter((todo) => todo.recurrenceType === "daily");
  const dailyDone = daily.filter((todo) => todo.completed).length;
  const inProgress = logs.filter((log) => log.status === "in_progress");
  const recentNotes = notes
    .slice()
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, RECENT_NOTES);

  const openNewNote = async () => {
    try {
      const note = await createNote();
      navigate(`/notes/${note._id}`);
    } catch {
      /* already toasted by the query client */
    }
  };

  const byGroup = (key: RecurrenceType): Todo[] =>
    due.filter((todo) => todo.recurrenceType === key);

  return (
    <div className="space-y-10">
      <div>
        <h2 className="page-title">
          {greeting(now.getHours())}
          {user?.firstName ? `, ${user.firstName}` : ""}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {now.toLocaleDateString(undefined, {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <SectionHeader title="Due" to="/todos" linkLabel="All tasks" />
          <DailyProgress done={dailyDone} total={daily.length} />

          {todosLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-14 animate-pulse rounded-xl bg-card" />
              ))}
            </div>
          ) : due.length === 0 ? (
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
              <CheckCircle2 className="h-5 w-5 text-success" />
              Nothing left to do. Nice.
            </div>
          ) : (
            <div className="space-y-6">
              {TODO_SECTIONS.map(({ key, label }) => {
                const items = byGroup(key);
                if (items.length === 0) return null;
                return (
                  <div key={key}>
                    <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {label}
                    </p>
                    <div className="space-y-2">
                      {items.map((todo) => (
                        <TodoItem
                          key={todo._id}
                          todo={todo}
                          onToggle={toggleTodo}
                          onTimer={timerAction}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <div className="space-y-10 lg:col-span-2">
          <section>
            <SectionHeader title="In progress" to="/media" linkLabel="Media log" />
            {mediaLoading ? (
              <div className="h-20 animate-pulse rounded-xl bg-card" />
            ) : inProgress.length === 0 ? (
              <p className="px-1 text-sm italic text-muted-foreground">
                Nothing in progress.
              </p>
            ) : (
              <div className="space-y-2">
                {inProgress.map((log) => {
                  const config = configForType(log.type);
                  const cover = resolveCoverUrl(log.cover);
                  return (
                    <Link
                      key={log._id}
                      to={`/media/${config.slug}`}
                      className="flex items-center gap-3 rounded-xl border border-border bg-card p-2 pr-3 transition-colors hover:border-rating/50"
                    >
                      <div className="flex h-14 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-secondary">
                        {cover ? (
                          <img src={cover} alt="" loading="lazy" className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-muted-foreground opacity-40" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{log.title}</p>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <config.icon className="h-3 w-3" />
                          {config.singular}
                          {log.releaseYear ? ` · ${log.releaseYear}` : ""}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <SectionHeader title="Recent notes" to="/notes" linkLabel="All notes" />
            {notesLoading ? (
              <div className="h-20 animate-pulse rounded-xl bg-card" />
            ) : (
              <div className="space-y-2">
                {recentNotes.map((note) => (
                  <Link
                    key={note._id}
                    to={`/notes/${note._id}`}
                    className="block rounded-xl border border-border bg-card px-3 py-2.5 transition-colors hover:border-rating/50"
                  >
                    <p className="truncate text-sm font-medium text-foreground">
                      {note.title.trim() || "Untitled"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {relativeDate(note.updatedAt)}
                      {note.excerpt ? ` · ${note.excerpt}` : ""}
                    </p>
                  </Link>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => void openNewNote()}
                >
                  <Plus className="h-4 w-4" />
                  New note
                </Button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default TodayPage;
