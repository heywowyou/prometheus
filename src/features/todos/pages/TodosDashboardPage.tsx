import { useEffect, useMemo, useState } from "react";
import { CheckSquare, ChevronDown, Flame, PlayCircle, Plus } from "lucide-react";
import { Button } from "@components/ui/button";
import EmptyState from "@components/feedback/EmptyState";
import { useLocalStorage } from "@lib/hooks/useLocalStorage";
import { cn } from "@lib/utils";
import { usePausedTodos, useTodos } from "../hooks/useTodos";
import TodoItem from "../components/TodoItem";
import TaskModal, { type TaskSubmitValues } from "../components/TaskModal";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import TodoHistoryDialog from "../components/TodoHistoryDialog";
import QuickAddInput from "../components/QuickAddInput";
import { compareOpenTodos, daysUntil, isOverdue } from "../due";
import type { RecurrenceType, Todo } from "../types/todo-types";

type ModalState =
  | { type: "none" }
  | { type: "new" }
  | { type: "edit"; task: Todo }
  | { type: "delete"; task: Todo }
  | { type: "history"; task: Todo };

const SECTIONS: Array<{ key: RecurrenceType; title: string; quickAdd: string }> = [
  { key: "none", title: "To do", quickAdd: "one-time" },
  { key: "daily", title: "Daily", quickAdd: "daily" },
  { key: "weekly", title: "This week", quickAdd: "weekly" },
  { key: "monthly", title: "This month", quickAdd: "monthly" },
];

/** How long a finished one-time task stays visible in its section. */
const RECENT_DONE_DAYS = 7;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

const byLastCompleted = (a: Todo, b: Todo) =>
  new Date(b.lastCompletedAt ?? 0).getTime() - new Date(a.lastCompletedAt ?? 0).getTime();

interface SectionData {
  open: Todo[];
  done: Todo[];
  /** One-time tasks finished more than a week ago. */
  olderDone: Todo[];
}

function ProgressBar({ done, total }: { done: number; total: number }) {
  if (total === 0) return null;
  return (
    <span className="flex items-center gap-2 text-xs tabular-nums text-muted-foreground">
      {done}/{total}
      <span className="h-1.5 w-14 overflow-hidden rounded-full bg-secondary">
        <span
          className={cn("block h-full rounded-full", done === total ? "bg-success" : "bg-rating")}
          style={{ width: `${(done / total) * 100}%` }}
        />
      </span>
    </span>
  );
}

function TodosDashboardPage() {
  const {
    todos,
    loading,
    createTodo,
    updateTodo,
    toggleTodo,
    timerAction,
    pauseTodo,
    deleteTodo,
  } = useTodos();
  const { pausedTodos, resumeTodo } = usePausedTodos();

  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const [collapsed, setCollapsed] = useLocalStorage<string[]>("todo-collapsed", [], isStringArray);
  const [showOlder, setShowOlder] = useState(false);
  const [pausedOpen, setPausedOpen] = useState(false);
  const [now] = useState(() => new Date());

  // "n" anywhere on the page opens a new task.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "n" || event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTyping(event.target) || document.querySelector("[role=dialog]")) return;
      event.preventDefault();
      setModal({ type: "new" });
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const sections = useMemo(() => {
    const cutoff = now.getTime() - RECENT_DONE_DAYS * 86_400_000;
    const result = {} as Record<RecurrenceType, SectionData>;
    for (const { key } of SECTIONS) {
      const items = todos.filter((todo) => todo.recurrenceType === key);
      const done = items.filter((todo) => todo.completed).sort(byLastCompleted);
      const isOld = (todo: Todo) =>
        key === "none" && new Date(todo.lastCompletedAt ?? 0).getTime() < cutoff;
      result[key] = {
        open: items.filter((todo) => !todo.completed).sort(compareOpenTodos),
        done: done.filter((todo) => !isOld(todo)),
        olderDone: done.filter(isOld),
      };
    }
    return result;
  }, [todos, now]);

  const overdue = todos.filter((todo) => isOverdue(todo, now)).length;
  const dueToday = todos.filter(
    (todo) => !todo.completed && todo.dueDate && daysUntil(todo.dueDate, now) === 0,
  ).length;
  const daily = sections.daily;
  const topStreaks = todos
    .filter((todo) => (todo.streak?.current ?? 0) > 0)
    .sort((a, b) => (b.streak?.current ?? 0) - (a.streak?.current ?? 0))
    .slice(0, 5);

  const toggleCollapsed = (key: string) =>
    setCollapsed(collapsed.includes(key) ? collapsed.filter((k) => k !== key) : [...collapsed, key]);

  const itemHandlers = {
    onToggle: toggleTodo,
    onTimer: timerAction,
    onRename: (id: string, text: string) => {
      void updateTodo(id, { text }).catch(() => undefined);
    },
    onEdit: (task: Todo) => setModal({ type: "edit", task }),
    onDelete: (task: Todo) => setModal({ type: "delete", task }),
    onHistory: (task: Todo) => setModal({ type: "history", task }),
    onPause: pauseTodo,
  };

  const submitNew = (values: TaskSubmitValues) =>
    createTodo({ ...values, dueDate: values.dueDate ?? undefined });

  const summary = [
    daily.open.length + daily.done.length > 0
      ? `${daily.done.length} of ${daily.open.length + daily.done.length} daily habits done`
      : null,
    dueToday ? `${dueToday} due today` : null,
    overdue ? `${overdue} overdue` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h2 className="page-title">Todos</h2>
          {!loading && summary && <p className="mt-1 text-sm text-muted-foreground">{summary}</p>}
        </div>
        <Button onClick={() => setModal({ type: "new" })} title="New task (N)">
          <Plus className="h-4 w-4" />
          New task
        </Button>
      </div>

      {loading ? (
        <div className="space-y-6">
          {SECTIONS.map(({ key }) => (
            <div key={key} className="space-y-2">
              <div className="h-5 w-28 animate-pulse rounded-md bg-card" />
              <div className="h-12 animate-pulse rounded-xl bg-card" />
              <div className="h-12 animate-pulse rounded-xl bg-card opacity-60" />
            </div>
          ))}
        </div>
      ) : todos.length === 0 && pausedTodos.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          message="Your workspace is empty."
          action={{ label: "Create your first task", onClick: () => setModal({ type: "new" }) }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            {SECTIONS.map(({ key, title, quickAdd }) => {
              const data = sections[key];
              const isCollapsed = collapsed.includes(key);
              const total = data.open.length + data.done.length;
              const sectionOverdue = data.open.filter((todo) => isOverdue(todo, now)).length;

              return (
                <section key={key}>
                  <button
                    type="button"
                    onClick={() => toggleCollapsed(key)}
                    aria-expanded={!isCollapsed}
                    className="mb-2 flex w-full items-center gap-2 rounded-md px-1 py-1 text-left"
                  >
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform",
                        isCollapsed && "-rotate-90",
                      )}
                    />
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                      {title}
                    </h3>
                    <span className="text-xs text-muted-foreground">{data.open.length || ""}</span>
                    {sectionOverdue > 0 && (
                      <span className="rounded-full bg-destructive/15 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
                        {sectionOverdue} overdue
                      </span>
                    )}
                    <span className="ml-auto">
                      {key !== "none" && <ProgressBar done={data.done.length} total={total} />}
                    </span>
                  </button>

                  {!isCollapsed && (
                    <div className="space-y-1.5">
                      {data.open.map((todo) => (
                        <TodoItem key={todo._id} todo={todo} {...itemHandlers} />
                      ))}
                      <QuickAddInput recurrenceType={key} label={quickAdd} onCreate={createTodo} />

                      {data.done.length > 0 && (
                        <div className="space-y-1.5 pt-1 opacity-70">
                          {data.done.map((todo) => (
                            <TodoItem key={todo._id} todo={todo} {...itemHandlers} />
                          ))}
                        </div>
                      )}
                      {data.olderDone.length > 0 && (
                        <>
                          {showOlder && (
                            <div className="space-y-1.5 opacity-60">
                              {data.olderDone.map((todo) => (
                                <TodoItem key={todo._id} todo={todo} {...itemHandlers} />
                              ))}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => setShowOlder((on) => !on)}
                            className="px-1 text-xs text-muted-foreground hover:text-foreground"
                          >
                            {showOlder
                              ? "Hide older completed tasks"
                              : `Show ${data.olderDone.length} completed over ${RECENT_DONE_DAYS} days ago`}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </section>
              );
            })}
          </div>

          <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Streaks
              </h3>
              {topStreaks.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No running streaks. Tick a habit to start one.
                </p>
              ) : (
                <ul className="space-y-2">
                  {topStreaks.map((todo) => (
                    <li key={todo._id}>
                      <button
                        type="button"
                        onClick={() => setModal({ type: "history", task: todo })}
                        className="flex w-full items-center justify-between gap-2 text-left text-sm hover:text-foreground"
                      >
                        <span className="truncate text-foreground">{todo.text}</span>
                        <span className="flex shrink-0 items-center gap-1 text-xs tabular-nums text-streak">
                          <Flame className="h-3.5 w-3.5" />
                          {todo.streak?.current}
                          <span className="text-muted-foreground">/ {todo.streak?.best}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {pausedTodos.length > 0 && (
              <div className="rounded-xl border border-border bg-card">
                <button
                  type="button"
                  onClick={() => setPausedOpen((open) => !open)}
                  aria-expanded={pausedOpen}
                  className="flex w-full items-center gap-2 p-4 text-left"
                >
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Paused
                  </h3>
                  <span className="text-xs text-muted-foreground">{pausedTodos.length}</span>
                  <ChevronDown
                    className={cn(
                      "ml-auto h-4 w-4 text-muted-foreground transition-transform",
                      !pausedOpen && "-rotate-90",
                    )}
                  />
                </button>
                {pausedOpen && (
                  <ul className="space-y-1 px-4 pb-4">
                    {pausedTodos.map((todo) => (
                      <li key={todo._id} className="flex items-center justify-between gap-2 py-1">
                        <span className="min-w-0">
                          <span className="block truncate text-sm text-foreground">{todo.text}</span>
                          <span className="text-xs capitalize text-muted-foreground">
                            {todo.recurrenceType}
                            {todo.streak && todo.streak.best > 0 && ` · best ${todo.streak.best}`}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => resumeTodo(todo._id)}
                          className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <PlayCircle className="h-3.5 w-3.5" />
                          Resume
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </aside>
        </div>
      )}

      <TaskModal isOpen={modal.type === "new"} onClose={() => setModal({ type: "none" })} onSubmit={submitNew} />
      <TaskModal
        isOpen={modal.type === "edit"}
        onClose={() => setModal({ type: "none" })}
        task={modal.type === "edit" ? modal.task : null}
        onSubmit={(values) =>
          modal.type === "edit" ? updateTodo(modal.task._id, values) : Promise.resolve()
        }
      />
      <DeleteConfirmModal
        isOpen={modal.type === "delete"}
        onClose={() => setModal({ type: "none" })}
        task={modal.type === "delete" ? modal.task : null}
        onConfirm={(id) => {
          deleteTodo(id);
          setModal({ type: "none" });
        }}
      />
      <TodoHistoryDialog
        todo={modal.type === "history" ? modal.task : null}
        onClose={() => setModal({ type: "none" })}
      />
    </>
  );
}

export default TodosDashboardPage;
