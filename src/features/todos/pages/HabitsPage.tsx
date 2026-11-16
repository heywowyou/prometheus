import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ChevronDown, PlayCircle, Plus, Sprout } from "lucide-react";
import { Button } from "@components/ui/button";
import EmptyState from "@components/feedback/EmptyState";
import { useLocalStorage } from "@lib/hooks/useLocalStorage";
import { cn } from "@lib/utils";
import FocusTimer from "@features/focus/components/FocusTimer";
import { useHabitCompletions, usePausedTodos, useTodos } from "../hooks/useTodos";
import { describeCycle, recentCycles, type Cycle } from "../habit-dots";
import TaskModal, { type TaskSubmitValues } from "../components/TaskModal";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import TodoHistoryDialog from "../components/TodoHistoryDialog";
import QuickAddInput from "../components/QuickAddInput";
import SortableTodoList from "../components/SortableTodoList";
import { compareSectionTodos, toDayKey } from "../due";
import type { RecurrenceType, Todo } from "../types/todo-types";

type ModalState =
  | { type: "none" }
  | { type: "new" }
  | { type: "edit"; task: Todo }
  | { type: "delete"; task: Todo }
  | { type: "history"; task: Todo };

type HabitCadence = Exclude<RecurrenceType, "none">;

const SECTIONS: Array<{ key: HabitCadence; title: string; quickAdd: string }> = [
  { key: "daily", title: "Daily", quickAdd: "daily" },
  { key: "weekly", title: "This week", quickAdd: "weekly" },
  { key: "monthly", title: "This month", quickAdd: "monthly" },
];

/** Enough history for six weeks or six months of dots. */
const HISTORY_DAYS = 190;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const DOT_STYLES: Record<Cycle["state"], string> = {
  done: "bg-rating",
  skipped: "border border-dashed border-muted-foreground/70",
  open: "bg-secondary",
  future: "border border-border",
};

function CycleDots({ cycles }: { cycles: Cycle[] }) {
  return (
    <span className="hidden items-center gap-[3px] sm:flex" aria-label="Recent history">
      {cycles.map((cycle) => (
        <span key={cycle.key} title={describeCycle(cycle)} className={cn("h-2 w-2 rounded-full", DOT_STYLES[cycle.state])} />
      ))}
    </span>
  );
}

function ProgressBar({ done, total }: { done: number; total: number }) {
  if (total === 0) return null;
  return (
    <span className="flex items-center gap-2 text-xs tabular-nums text-muted-foreground">
      {done}/{total}
      <span className="h-1.5 w-14 overflow-hidden rounded-full bg-secondary">
        <span className="block h-full rounded-full bg-rating" style={{ width: `${(done / total) * 100}%` }} />
      </span>
    </span>
  );
}

/**
 * Whether a habit is expected today, for the day's tally: every-day habits
 * are; a few-days-a-week habit only counts once it's done, so rest days never
 * read as misses. Skipped habits are out of the tally.
 */
const countsToday = (todo: Todo) => !todo.skipped && (!todo.perWeek || todo.completed);

/** This week's check-ins (Monday to today), across habits, from completion days. */
const weekCheckIns = (habits: Array<{ days: string[] }>, now: Date) => {
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  const from = toDayKey(monday);
  return habits.reduce((sum, habit) => sum + habit.days.filter((day) => day >= from).length, 0);
};

/**
 * Habits: daily, weekly and monthly routines, in your own order. No streaks to
 * protect: rest days are skips, and the week starts fresh every Monday.
 */
function HabitsPage() {
  const navigate = useNavigate();
  const {
    todos: allTodos,
    convertTodo,
    loading,
    createTodo,
    updateTodo,
    toggleTodo,
    skipTodo,
    reorderTodos,
    timerAction,
    pauseTodo,
    deleteTodo,
  } = useTodos();
  const { pausedTodos, resumeTodo } = usePausedTodos();
  const todos = useMemo(() => allTodos.filter((todo) => todo.recurrenceType !== "none"), [allTodos]);
  const { data: completions } = useHabitCompletions(HISTORY_DAYS);
  const daysByHabit = useMemo(
    () => new Map((completions?.habits ?? []).map((habit) => [habit.todoId, new Set(habit.days)])),
    [completions],
  );

  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const [collapsed, setCollapsed] = useLocalStorage<string[]>("todo-collapsed", [], isStringArray);
  const [pausedOpen, setPausedOpen] = useState(false);
  const now = useMemo(() => new Date(), []);

  // One list per section in the user's order; done and skipped habits stay in place.
  const sections = useMemo(() => {
    const result = {} as Record<HabitCadence, Todo[]>;
    for (const { key } of SECTIONS) {
      result[key] = todos.filter((todo) => todo.recurrenceType === key).sort(compareSectionTodos);
    }
    return result;
  }, [todos]);

  const habitIds = new Set(todos.map((todo) => todo._id));
  const checkIns = weekCheckIns(
    (completions?.habits ?? []).filter((habit) => habitIds.has(habit.todoId)),
    now,
  );
  const restDays = todos.filter((todo) => todo.skipped).length;
  const flexible = todos.filter((todo) => todo.recurrenceType === "daily" && todo.perWeek);

  const toggleCollapsed = (key: string) =>
    setCollapsed(collapsed.includes(key) ? collapsed.filter((k) => k !== key) : [...collapsed, key]);

  const itemHandlers = {
    onToggle: toggleTodo,
    onTimer: timerAction,
    onSkip: skipTodo,
    onRename: (id: string, text: string) => {
      void updateTodo(id, { text }).catch(() => undefined);
    },
    onEdit: (task: Todo) => setModal({ type: "edit", task }),
    onDelete: (task: Todo) => setModal({ type: "delete", task }),
    onHistory: (task: Todo) => setModal({ type: "history", task }),
    onPause: pauseTodo,
    renderTrailing: (task: Todo) =>
      task.recurrenceType === "none" ? null : (
        <CycleDots cycles={recentCycles(task.recurrenceType, daysByHabit.get(task._id) ?? new Set(), task.skips)} />
      ),
    onConvert: (task: Todo) => {
      void convertTodo(task._id, "task").then((converted) =>
        toast(`“${task.text}” now repeats as a task`, {
          action: {
            label: "Open",
            onClick: () =>
              navigate(converted.when && converted.when <= toDayKey(new Date()) ? "/todos/today" : "/todos/upcoming"),
          },
        }),
      );
    },
  };

  const submitNew = (values: TaskSubmitValues) => createTodo({ ...values, dueDate: undefined });

  const daily = sections.daily.filter(countsToday);
  const dailyDone = daily.filter((todo) => todo.completed).length;
  const summary =
    daily.length > 0
      ? dailyDone === daily.length
        ? "Everything for today is done."
        : `${dailyDone} of ${daily.length} done today`
      : null;

  return (
    <>
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4 pt-2 sm:pt-6">
        <div>
          <h1 className="flex items-center gap-3 page-title">
            <Sprout className="h-8 w-8 text-rating" />
            Habits
          </h1>
          {!loading && summary && <p className="mt-3 font-serif text-lg text-soft sm:text-xl">{summary}</p>}
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
          icon={Sprout}
          message="No habits yet."
          action={{ label: "Create a habit", onClick: () => setModal({ type: "new" }) }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-14">
          <div className="space-y-12">
            {SECTIONS.map(({ key, title, quickAdd }) => {
              const items = sections[key];
              const isCollapsed = collapsed.includes(key);
              const tallied = items.filter(countsToday);
              const done = tallied.filter((todo) => todo.completed).length;

              return (
                <section key={key}>
                  <button
                    type="button"
                    onClick={() => toggleCollapsed(key)}
                    aria-expanded={!isCollapsed}
                    className="mb-3 flex w-full items-center gap-3 rounded-xl py-1 text-left"
                  >
                    <h2 className="section-title">{title}</h2>
                    <ChevronDown
                      className={cn("h-4 w-4 text-muted-foreground transition-transform", isCollapsed && "-rotate-90")}
                    />
                    <span className="ml-auto">
                      <ProgressBar done={done} total={tallied.length} />
                    </span>
                  </button>

                  {!isCollapsed && (
                    <div className="border-b border-border">
                      <SortableTodoList todos={items} onReorder={reorderTodos} {...itemHandlers} />
                      <QuickAddInput recurrenceType={key} label={quickAdd} onCreate={createTodo} />
                    </div>
                  )}
                </section>
              );
            })}
            <p className="text-xs text-muted-foreground">
              Drag the grip to reorder. To rest a day, open a habit's menu and choose Skip: it won't count as missed.
            </p>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
            <div className="panel p-6">
              <h2 className="eyebrow mb-3">This week</h2>
              <p className="font-serif text-4xl leading-none tabular-nums text-foreground">{checkIns}</p>
              <p className="mt-2 text-sm text-soft">
                {checkIns === 1 ? "check-in so far" : "check-ins so far"}
                {restDays > 0 ? ` · ${restDays} resting today` : ""}
              </p>
              {flexible.length > 0 && (
                <ul className="mt-5 space-y-2.5 border-t border-border pt-4">
                  {flexible.map((todo) => {
                    const target = todo.perWeek ?? 7;
                    const count = Math.min(todo.thisWeek ?? 0, target);
                    return (
                      <li key={todo._id} className="flex items-center justify-between gap-3">
                        <span className="truncate font-serif text-lg text-foreground">{todo.text}</span>
                        <span className="flex shrink-0 items-center gap-2 text-xs tabular-nums text-muted-foreground">
                          <span className="flex gap-[3px]">
                            {Array.from({ length: target }, (_, index) => (
                              <span
                                key={index}
                                className={cn("h-2 w-2 rounded-full", index < count ? "bg-rating" : "bg-secondary")}
                              />
                            ))}
                          </span>
                          {count}/{target}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <FocusTimer />

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
                    className={cn("ml-auto h-4 w-4 text-muted-foreground transition-transform", !pausedOpen && "-rotate-90")}
                  />
                </button>
                {pausedOpen && (
                  <ul className="space-y-2 px-6 pb-6">
                    {pausedTodos.map((todo) => (
                      <li key={todo._id} className="flex items-center justify-between gap-2 py-1">
                        <span className="min-w-0">
                          <span className="block truncate font-serif text-lg text-foreground">{todo.text}</span>
                          <span className="text-xs capitalize text-muted-foreground">{todo.recurrenceType}</span>
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
          modal.type === "edit"
            ? updateTodo(modal.task._id, { ...values, dueDate: undefined })
            : Promise.resolve()
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
      <TodoHistoryDialog todo={modal.type === "history" ? modal.task : null} onClose={() => setModal({ type: "none" })} />
    </>
  );
}

export default HabitsPage;
