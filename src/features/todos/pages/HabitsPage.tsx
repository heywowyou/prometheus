import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ChevronDown, Flame, PlayCircle, Plus } from "lucide-react";
import { Button } from "@components/ui/button";
import EmptyState from "@components/feedback/EmptyState";
import { useLocalStorage } from "@lib/hooks/useLocalStorage";
import { cn } from "@lib/utils";
import { useHabitCompletions, usePausedTodos, useTodos } from "../hooks/useTodos";
import { recentCycles } from "../habit-dots";
import { Heatmap } from "@components/ui/heatmap";
import TodoItem from "../components/TodoItem";
import TaskModal, { type TaskSubmitValues } from "../components/TaskModal";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import TodoHistoryDialog from "../components/TodoHistoryDialog";
import QuickAddInput from "../components/QuickAddInput";
import SortableTodoList from "../components/SortableTodoList";
import { compareSectionTodos, isOverdue } from "../due";
import type { RecurrenceType, Todo } from "../types/todo-types";

type ModalState =
  | { type: "none" }
  | { type: "new" }
  | { type: "edit"; task: Todo }
  | { type: "delete"; task: Todo }
  | { type: "history"; task: Todo };

const SECTIONS: Array<{ key: RecurrenceType; title: string; quickAdd: string }> = [
  { key: "daily", title: "Daily", quickAdd: "daily" },
  { key: "weekly", title: "This week", quickAdd: "weekly" },
  { key: "monthly", title: "This month", quickAdd: "monthly" },
];

/** Columns of the consistency heatmap; fits the side panel. */
const CONSISTENCY_WEEKS = 16;

/** How long a finished one-time task stays visible in its section. */
const RECENT_DONE_DAYS = 7;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const byLastCompleted = (a: Todo, b: Todo) =>
  new Date(b.lastCompletedAt ?? 0).getTime() - new Date(a.lastCompletedAt ?? 0).getTime();

interface SectionData {
  open: Todo[];
  done: Todo[];
  /** One-time tasks finished more than a week ago. */
  olderDone: Todo[];
}

/** Keeps rows without a drag grip aligned with the sortable rows above them. */
function HandleSpacer() {
  return <span aria-hidden className="-ml-1.5 mr-0.5 w-5 shrink-0" />;
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

/** Habits: daily, weekly and monthly routines with streaks and timers. Tasks live in the lists. */
function HabitsPage() {
  const navigate = useNavigate();
  const {
    todos: allTodos,
    convertTodo,
    loading,
    createTodo,
    updateTodo,
    toggleTodo,
    reorderTodos,
    timerAction,
    pauseTodo,
    deleteTodo,
  } = useTodos();
  const { pausedTodos, resumeTodo } = usePausedTodos();
  const todos = useMemo(() => allTodos.filter((todo) => todo.recurrenceType !== "none"), [allTodos]);
  const { data: completions, loading: completionsLoading } = useHabitCompletions(CONSISTENCY_WEEKS * 7 + 7);
  const daysByHabit = useMemo(
    () => new Map((completions?.habits ?? []).map((habit) => [habit.todoId, new Set(habit.days)])),
    [completions],
  );

  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const [collapsed, setCollapsed] = useLocalStorage<string[]>("todo-collapsed", [], isStringArray);
  const [showOlder, setShowOlder] = useState(false);
  const [pausedOpen, setPausedOpen] = useState(false);
  const [now] = useState(() => new Date());


  const sections = useMemo(() => {
    const cutoff = now.getTime() - RECENT_DONE_DAYS * 86_400_000;
    const result = {} as Record<RecurrenceType, SectionData>;
    for (const { key } of SECTIONS) {
      const items = todos.filter((todo) => todo.recurrenceType === key);
      const done = items.filter((todo) => todo.completed).sort(byLastCompleted);
      const isOld = (todo: Todo) =>
        key === "none" && new Date(todo.lastCompletedAt ?? 0).getTime() < cutoff;
      result[key] = {
        open: items.filter((todo) => !todo.completed).sort(compareSectionTodos),
        done: done.filter((todo) => !isOld(todo)),
        olderDone: done.filter(isOld),
      };
    }
    return result;
  }, [todos, now]);

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
    renderTrailing: (task: Todo) => {
      if (task.recurrenceType === "none") return null;
      const cycles = recentCycles(task.recurrenceType, daysByHabit.get(task._id) ?? new Set());
      return (
        <span className="hidden items-center gap-[3px] sm:flex" aria-label="Recent history">
          {cycles.map((cycle) => (
            <span
              key={cycle.key}
              title={`${cycle.label}: ${cycle.done ? "done" : "missed"}`}
              className={cn("h-2 w-2 rounded-full", cycle.done ? "bg-rating" : "bg-secondary")}
            />
          ))}
        </span>
      );
    },
    onConvert: (task: Todo) => {
      void convertTodo(task._id, "task").then((converted) =>
        toast(`“${task.text}” now repeats as a task`, {
          action: {
            label: "Open",
            onClick: () => navigate(converted.when && converted.when <= new Date().toISOString().slice(0, 10) ? "/todos/today" : "/todos/upcoming"),
          },
        }),
      );
    },
  };

  const submitNew = (values: TaskSubmitValues) =>
    createTodo({ ...values, dueDate: values.dueDate ?? undefined });

  const summary = [
    daily.open.length + daily.done.length > 0
      ? `${daily.done.length} of ${daily.open.length + daily.done.length} daily habits done`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4 pt-2 sm:pt-6">
        <div>
          <h1 className="flex items-center gap-3 page-title">
            <Flame className="h-8 w-8 text-streak" />
            Habits
          </h1>
          {!loading && summary && (
            <p className="mt-3 font-serif text-lg text-soft sm:text-xl">{summary}</p>
          )}
        </div>
        <Button onClick={() => setModal({ type: "new" })} title="New habit">
          <Plus className="h-4 w-4" />
          New habit
        </Button>
      </div>

      {loading ? (
        <div className="space-y-6">
          {SECTIONS.map(({ key }) => (
            <div key={key} className="space-y-2">
              <div className="h-7 w-32 animate-pulse rounded-full bg-card" />
              <div className="h-14 animate-pulse rounded-2xl bg-card" />
              <div className="h-14 animate-pulse rounded-2xl bg-card opacity-60" />
            </div>
          ))}
        </div>
      ) : todos.length === 0 && pausedTodos.length === 0 ? (
        <EmptyState
          icon={Flame}
          message="No habits yet."
          action={{ label: "Create a habit", onClick: () => setModal({ type: "new" }) }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-14">
          <div className="space-y-12">
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
                    className="mb-3 flex w-full items-center gap-3 rounded-xl py-1 text-left"
                  >
                    <h2 className="section-title">{title}</h2>
                    {/* Sections with a progress bar already show done/total. */}
                    {key === "none" && (
                      <span className="text-[13px] tabular-nums text-muted-foreground">
                        {data.open.length || ""}
                      </span>
                    )}
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform",
                        isCollapsed && "-rotate-90",
                      )}
                    />
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
                    <div className="border-b border-border">
                      <SortableTodoList
                        todos={data.open}
                        onReorder={reorderTodos}
                        {...itemHandlers}
                      />
                      <QuickAddInput recurrenceType={key} label={quickAdd} onCreate={createTodo} />

                      {data.done.length > 0 && (
                        <div className="opacity-75">
                          {data.done.map((todo) => (
                            <div key={todo._id} className="border-t border-border py-0.5">
                              <div className="-mx-3">
                                <TodoItem todo={todo} {...itemHandlers} handle={<HandleSpacer />} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {data.olderDone.length > 0 && (
                        <>
                          {showOlder && (
                            <div className="opacity-60">
                              {data.olderDone.map((todo) => (
                                <div key={todo._id} className="border-t border-border py-0.5">
                                  <div className="-mx-3">
                                    <TodoItem todo={todo} {...itemHandlers} handle={<HandleSpacer />} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => setShowOlder((on) => !on)}
                            className="block border-t border-border py-3 text-[13px] text-muted-foreground hover:text-foreground"
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

          <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
            <div className="panel p-6">
              <h2 className="eyebrow mb-4">Consistency</h2>
              <Heatmap
                days={completions?.totals}
                weeks={CONSISTENCY_WEEKS}
                loading={completionsLoading}
                describe={(count) => (count ? `${count} habit${count === 1 ? "" : "s"} done` : "nothing done")}
              />
            </div>
            <div className="panel p-6">
              <h2 className="eyebrow mb-4">Streaks</h2>
              {topStreaks.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No running streaks. Tick a habit to start one.
                </p>
              ) : (
                <ul className="space-y-3">
                  {topStreaks.map((todo) => (
                    <li key={todo._id}>
                      <button
                        type="button"
                        onClick={() => setModal({ type: "history", task: todo })}
                        className="flex w-full items-center justify-between gap-3 text-left hover:text-foreground"
                      >
                        <span className="truncate font-serif text-lg text-foreground">{todo.text}</span>
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
              <div className="panel">
                <button
                  type="button"
                  onClick={() => setPausedOpen((open) => !open)}
                  aria-expanded={pausedOpen}
                  className="flex w-full items-center gap-2 p-6 text-left"
                >
                  <h2 className="eyebrow">Paused</h2>
                  <span className="text-xs text-muted-foreground">{pausedTodos.length}</span>
                  <ChevronDown
                    className={cn(
                      "ml-auto h-4 w-4 text-muted-foreground transition-transform",
                      !pausedOpen && "-rotate-90",
                    )}
                  />
                </button>
                {pausedOpen && (
                  <ul className="space-y-2 px-6 pb-6">
                    {pausedTodos.map((todo) => (
                      <li key={todo._id} className="flex items-center justify-between gap-2 py-1">
                        <span className="min-w-0">
                          <span className="block truncate font-serif text-lg text-foreground">{todo.text}</span>
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

      <TaskModal
        isOpen={modal.type === "new"}
        onClose={() => setModal({ type: "none" })}
        onSubmit={submitNew}
        defaultRecurrence="daily"
      />
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

export default HabitsPage;
