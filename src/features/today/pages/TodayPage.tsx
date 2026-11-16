import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Check, ImageIcon, NotebookPen, Pause, Play, Plus } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@clerk/clerk-react";
import { cn } from "@lib/utils";
import { AppIcon } from "@components/ui/icon-picker";
import { relativeDate } from "@lib/date/relative";
import { formatClock } from "@lib/date/duration";
import { useNow } from "@lib/hooks/useNow";
import { useTaskData } from "@features/todos/hooks/useTaskData";
import { useRowContext } from "@features/todos/hooks/useTaskActions";
import TasksUiProvider from "@features/todos/components/tasks/TasksUiProvider";
import TaskList from "@features/todos/components/tasks/TaskList";
import NewTaskInput from "@features/todos/components/tasks/NewTaskInput";
import { useEvents } from "@features/calendar/hooks/useCalendar";
import { COLOR_VARS } from "@features/calendar/types/calendar-types";
import { formatTime } from "@features/calendar/calendar-dates";
import { toDayKey } from "@features/todos/due";
import { compareSectionTodos, isOverdue } from "@features/todos/due";
import FocusTimer from "@features/focus/components/FocusTimer";
import { isRepeatRecord, timerElapsedMs, type TimerAction, type Todo } from "@features/todos/types/todo-types";
import { useMediaLogs } from "@features/media/hooks/useMediaLogs";
import { configForType } from "@features/media/media-config";
import { resolveCoverUrl } from "@features/media/types/media-types";
import { useNoteActions, useNotes } from "@features/notes/hooks/useNotes";
import WorkoutsTodayCard from "@features/workouts/components/WorkoutsTodayCard";
import { useWorkoutSummary } from "@features/workouts/hooks/useWorkouts";
import { nextRoutine } from "@features/workouts/workout-format";

const TODO_LIMIT = 8;
const SHELF_LIMIT = 6;
const RECENT_NOTES = 4;

const greeting = (hour: number) =>
  hour < 5 ? "Good night" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
const count = (n: number) => WORDS[n] ?? String(n);

/** "a, b and c" */
const listJoin = (parts: string[]) =>
  parts.length <= 1 ? parts.join("") : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const isRunning = (todo: Todo) =>
  todo.interactionType === "timer" && Boolean(todo.timer?.startedAt) && !todo.completed;

function Section({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="section-title sm:text-[2rem]">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function AsideLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="shrink-0 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
    >
      {children}
    </Link>
  );
}

/** The running timer, front and centre. Completes the task once the goal is reached. */
function NowCard({
  todo,
  onTimer,
  onToggle,
}: {
  todo: Todo;
  onTimer: (id: string, action: TimerAction) => void;
  onToggle: (id: string) => void;
}) {
  const now = useNow(true);
  const goalMs = Math.max(1, todo.durationGoal) * 60_000;
  const elapsed = timerElapsedMs(todo, now);
  const fraction = Math.min(1, elapsed / goalMs);

  // Same rule as the task row: once per run, also when the page opens on a
  // timer that finished while it was closed.
  const completedRunRef = useRef<string | null>(null);
  useEffect(() => {
    const run = todo.timer?.startedAt ?? null;
    if (!run || elapsed < goalMs || completedRunRef.current === run) return;
    completedRunRef.current = run;
    onToggle(todo._id);
    toast.success(`${todo.text}: time's up`);
  }, [elapsed, goalMs, onToggle, todo._id, todo.text, todo.timer?.startedAt]);

  return (
    <section aria-label="Timer running" className="panel flex flex-wrap items-center gap-x-5 gap-y-4 p-5 sm:p-6">
      <button
        type="button"
        onClick={() => onTimer(todo._id, "pause")}
        aria-label={`Pause timer for ${todo.text}`}
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-rating text-rating-foreground transition-colors hover:bg-rating-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
      >
        <Pause className="h-5 w-5 fill-current" />
      </button>
      <div className="min-w-0 flex-1 basis-40">
        <p className="truncate font-serif text-2xl leading-tight">{todo.text}</p>
        <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-rating transition-[width] duration-1000 ease-linear"
            style={{ width: `${fraction * 100}%` }}
          />
        </div>
      </div>
      <p className="font-serif text-[2.5rem] leading-none tabular-nums">
        {formatClock(elapsed)}
        <span className="text-xl text-muted-foreground"> / {formatClock(goalMs)}</span>
      </p>
    </section>
  );
}

/** The time, beside the date. Its own component so only it re-renders every second. */
function Clock() {
  const now = new Date(useNow(true, 1_000));
  return (
    <time
      dateTime={now.toISOString()}
      className="font-sans text-sm normal-case tracking-normal tabular-nums text-soft"
    >
      {now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" })}
    </time>
  );
}

/** One daily habit as a tappable pill. */
function HabitPill({
  todo,
  onToggle,
  onTimer,
}: {
  todo: Todo;
  onToggle: (id: string) => void;
  onTimer: (id: string, action: TimerAction) => void;
}) {
  const running = isRunning(todo);
  const now = useNow(running);
  const isTimer = todo.interactionType === "timer";
  const skipped = Boolean(todo.skipped) && !todo.completed;
  const weekly = todo.perWeek && todo.recurrenceType === "daily" ? todo.perWeek : null;

  const activate = () => {
    if (isTimer && !todo.completed) onTimer(todo._id, running ? "pause" : "start");
    else onToggle(todo._id);
  };

  const label = todo.completed
    ? `${todo.text}, done. Tap to undo`
    : skipped
      ? `${todo.text}, resting today. Tap to mark done`
    : isTimer
      ? `${running ? "Pause" : "Start"} ${todo.text}`
      : `Mark ${todo.text} done`;

  return (
    <button
      type="button"
      onClick={activate}
      aria-label={label}
      aria-pressed={todo.completed}
      className={cn(
        "flex h-11 max-w-full items-center gap-2 rounded-full border px-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        todo.completed
          ? "border-raised bg-raised text-soft"
          : skipped
            ? "border-dashed border-border text-muted-foreground"
            : running
            ? "border-rating/60 bg-rating/10 text-foreground"
            : "border-border bg-card text-foreground hover:border-muted-foreground/60",
      )}
    >
      {todo.completed ? (
        <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={3} />
      ) : isTimer ? (
        running ? (
          <Pause className="h-3.5 w-3.5 shrink-0 fill-current text-rating" />
        ) : (
          <Play className="h-3.5 w-3.5 shrink-0 fill-current text-muted-foreground" />
        )
      ) : todo.icon ? (
        <AppIcon name={todo.icon} className={cn("h-4 w-4", skipped ? "text-muted-foreground" : "text-soft")} />
      ) : null}
      <span className={cn("truncate", todo.completed && "line-through decoration-soft/50")}>
        {todo.text}
      </span>
      {running ? (
        <span className="tabular-nums text-rating">{formatClock(timerElapsedMs(todo, now))}</span>
      ) : !todo.completed && isTimer ? (
        <span className="tabular-nums text-muted-foreground">
          {(todo.timer?.elapsedMs ?? 0) > 0
            ? `${formatClock(todo.timer?.elapsedMs ?? 0)} / ${todo.durationGoal}m`
            : `${todo.durationGoal}m`}
        </span>
      ) : skipped ? (
        <span className="text-xs">rest</span>
      ) : weekly ? (
        <span className="text-xs tabular-nums text-muted-foreground">
          {Math.min(todo.thisWeek ?? 0, weekly)}/{weekly}
        </span>
      ) : null}
    </button>
  );
}

/**
 * The landing page, read top to bottom like a journal: how the day stands,
 * what's running, the habits, what's due, the next workout, what's in
 * progress and what was written last.
 */
function TodayPage() {
  const navigate = useNavigate();
  const { hash } = useLocation();
  // The header's timer pill links to #focus.
  useEffect(() => {
    if (hash === "#focus") document.getElementById("focus")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash]);
  const { user } = useUser();
  // Ticks every 30 s, so the date, greeting and lists roll over at midnight.
  const liveNow = useNow(true, 30_000);
  const now = useMemo(() => new Date(liveNow), [liveNow]);

  const data = useTaskData();
  const { todos, loading: todosLoading, toggleTodo, timerAction } = data;
  const rowContext = useRowContext(data, { showList: true });
  const { logs, loading: mediaLoading } = useMediaLogs();
  const { notes, loading: notesLoading } = useNotes({ view: "active" });
  const { createNote } = useNoteActions();
  const { summary: workouts } = useWorkoutSummary();
  const todayKeyValue = toDayKey(now);
  const { events: agenda, loading: agendaLoading } = useEvents(todayKeyValue, todayKeyValue);

  // Habits keep the order set on the Habits page.
  const daily = useMemo(
    () => todos.filter((todo) => todo.recurrenceType === "daily").sort(compareSectionTodos),
    [todos],
  );
  // The day's tally: rest days and flexible habits not done today don't count against it.
  const tallied = daily.filter((todo) => !todo.skipped && (!todo.perWeek || todo.completed));
  const dailyDone = tallied.filter((todo) => todo.completed).length;
  // The week's and month's habits sit with the daily ones, not in the task list.
  const periodic = useMemo(
    () =>
      todos
        .filter((todo) => todo.recurrenceType === "weekly" || todo.recurrenceType === "monthly")
        .sort((a, b) => a.recurrenceType.localeCompare(b.recurrenceType) * -1 || compareSectionTodos(a, b)),
    [todos],
  );
  const running = todos.find(isRunning) ?? null;

  // The to-do Today list: overdue first, done ones (ticked today) last.
  const due = useMemo(() => {
    // A repeating task done today has already moved on; its done record stays in Tasks.
    const tasks = [...data.index.todayList, ...data.index.evening].filter((todo) => !isRepeatRecord(todo));
    const rank = (todo: Todo) => (todo.completed ? 2 : isOverdue(todo, now) ? 0 : 1);
    return tasks.sort((a, b) => rank(a) - rank(b));
  }, [data.index, now]);
  const overdue = due.filter((todo) => isOverdue(todo, now)).length;

  const inProgress = logs.filter((log) => log.status === "in_progress");
  const recentNotes = notes
    .filter((note) => !note.dailyDate)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, RECENT_NOTES);

  const summaryLine = useMemo(() => {
    if (todosLoading) return null;
    const sentences: string[] = [];
    if (running) {
      const minutes = Math.floor(timerElapsedMs(running, liveNow) / 60_000);
      sentences.push(
        minutes < 1
          ? `You've just started ${running.text.toLowerCase()}.`
          : `You're ${count(minutes)} minute${minutes === 1 ? "" : "s"} into ${running.text.toLowerCase()}.`,
      );
    }
    const parts: string[] = [];
    const habitsLeft = tallied.length - dailyDone;
    if (tallied.length > 0) {
      parts.push(
        habitsLeft === 0
          ? "every habit is done"
          : `${count(habitsLeft)} habit${habitsLeft === 1 ? " is" : "s are"} left today`,
      );
    }
    if (overdue > 0) parts.push(`${count(overdue)} task${overdue === 1 ? " is" : "s are"} overdue`);
    if (workouts?.active) parts.push(`${workouts.active.name.toLowerCase()} is in progress`);
    else if (workouts) {
      const next = nextRoutine(workouts);
      if (next) parts.push(`${next.name.toLowerCase()} is next`);
    }
    if (parts.length > 0) sentences.push(`${capitalize(listJoin(parts))}.`);
    return sentences.join(" ") || "A blank page. Add a habit or a task to get going.";
  }, [todosLoading, running, liveNow, tallied.length, dailyDone, overdue, workouts]);

  const openNewNote = async () => {
    try {
      const note = await createNote();
      navigate(`/notes/${note._id}`);
    } catch {
      /* already toasted by the query client */
    }
  };

  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-12 sm:gap-14">
      <header className="pt-2 sm:pt-6">
        <p className="eyebrow flex flex-wrap items-baseline gap-x-3">
          <span>{now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</span>
          <Clock />
        </p>
        <h1 className="mt-4 font-serif text-[2.75rem] font-normal leading-[1.02] sm:text-[4.25rem]">
          {greeting(now.getHours())}
          {user?.firstName ? (
            <>
              , <span className="italic">{user.firstName}.</span>
            </>
          ) : (
            "."
          )}
        </h1>
        {summaryLine ? (
          <p className="mt-5 max-w-[34rem] font-serif text-xl leading-relaxed text-soft sm:text-[1.375rem]">
            {summaryLine}
          </p>
        ) : (
          <div className="mt-5 h-7 w-3/4 animate-pulse rounded-full bg-card" />
        )}
      </header>

      {running && <NowCard todo={running} onTimer={timerAction} onToggle={toggleTodo} />}

      {(todosLoading || daily.length > 0 || periodic.length > 0) && (
        <Section
          title="Habits"
          aside={
            !todosLoading && (
              <span className="flex items-center gap-4">
                {tallied.length > 0 && (
                  <span className="text-[13px] tabular-nums text-muted-foreground">
                    {dailyDone} of {tallied.length}
                  </span>
                )}
                <AsideLink to="/habits">All habits</AsideLink>
              </span>
            )
          }
        >
          {todosLoading ? (
            <div className="flex flex-wrap gap-2.5">
              {[28, 36, 24, 40].map((width) => (
                <div key={width} className="h-11 animate-pulse rounded-full bg-card" style={{ width: `${width * 4}px` }} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {daily.length > 0 && (
                <div className="flex flex-wrap gap-2.5">
                  {daily.map((todo) => (
                    <HabitPill key={todo._id} todo={todo} onToggle={toggleTodo} onTimer={timerAction} />
                  ))}
                </div>
              )}
              {periodic.length > 0 && (
                <div>
                  <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">This week and month</p>
                  <div className="flex flex-wrap gap-2.5">
                    {periodic.map((todo) => (
                      <HabitPill key={todo._id} todo={todo} onToggle={toggleTodo} onTimer={timerAction} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Section>
      )}

      <div id="focus" className="scroll-mt-28">
        <FocusTimer />
      </div>

      {!agendaLoading && agenda.length > 0 && (
        <Section title="Agenda" aside={<AsideLink to="/calendar?view=day">Calendar</AsideLink>}>
          <ul className="divide-y divide-border border-t border-border">
            {agenda.map((event) => {
              const ended = !event.allDay && new Date(event.end).getTime() < liveNow;
              return (
                <li key={event._id} className={cn("flex items-baseline gap-4 py-3.5", ended && "opacity-50")}>
                  <span className="w-24 shrink-0 text-[13px] tabular-nums text-muted-foreground">
                    {event.allDay ? "All day" : `${formatTime(new Date(event.start))}`}
                  </span>
                  <span className="h-2 w-2 shrink-0 self-center rounded-full" style={{ background: COLOR_VARS[event.color] }} />
                  <span className="min-w-0 flex-1 truncate font-serif text-xl text-foreground">{event.title || "Untitled"}</span>
                  {event.location && (
                    <span className="hidden shrink-0 truncate text-[13px] text-muted-foreground sm:inline">{event.location}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      <Section title="To do" aside={<AsideLink to="/todos/today">All tasks</AsideLink>}>
        <TasksUiProvider>
          <NewTaskInput
            defaults={{ when: todayKeyValue }}
            projects={data.projects}
            areas={data.areas}
            onCreate={data.createTodo}
            placeholder="Add a task for today"
          />
          {todosLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-11 animate-pulse rounded-xl bg-card" />
              ))}
            </div>
          ) : due.length === 0 ? (
            <p className="py-3 font-serif text-xl italic text-soft">Nothing left to do. Nice.</p>
          ) : (
            <>
              <TaskList todos={due.slice(0, TODO_LIMIT)} context={rowContext} />
              {due.length > TODO_LIMIT && (
                <Link
                  to="/todos/today"
                  className="mt-3 inline-block text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {due.length - TODO_LIMIT} more in Tasks
                </Link>
              )}
            </>
          )}
        </TasksUiProvider>
      </Section>

      <WorkoutsTodayCard />

      <Section title="On the shelf" aside={<AsideLink to="/media">Media log</AsideLink>}>
        {mediaLoading ? (
          <div className="grid grid-cols-3 gap-4 sm:gap-5">
            {[0, 1, 2].map((index) => (
              <div key={index} className="aspect-[2/3] animate-pulse rounded-2xl bg-card" />
            ))}
          </div>
        ) : inProgress.length === 0 ? (
          <p className="font-serif text-xl italic text-soft">Nothing in progress right now.</p>
        ) : (
          <div className="grid grid-cols-3 items-start gap-x-4 gap-y-7 sm:gap-x-5">
            {inProgress.slice(0, SHELF_LIMIT).map((log) => {
              const config = configForType(log.type);
              const cover = resolveCoverUrl(log.cover);
              return (
                <Link
                  key={log._id}
                  to={`/media/${config.slug}`}
                  className="group flex min-w-0 flex-col gap-2.5 focus-visible:outline-none"
                >
                  <div
                    className={cn(
                      config.coverAspect,
                      "flex w-full items-center justify-center overflow-hidden rounded-2xl border border-border bg-secondary transition-colors group-hover:border-muted-foreground/60 group-focus-visible:ring-2 group-focus-visible:ring-ring",
                    )}
                  >
                    {cover ? (
                      <img src={cover} alt="" loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-muted-foreground opacity-40" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-serif text-lg leading-tight sm:text-xl">{log.title}</p>
                    <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <config.icon className="h-3 w-3 shrink-0" />
                      <span className="truncate capitalize">
                        {config.singular}
                        {log.releaseYear ? ` · ${log.releaseYear}` : ""}
                      </span>
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Section>

      <Section
        title="Lately written"
        aside={
          <div className="flex shrink-0 items-center gap-4">
            <Link
              to="/notes/daily/today"
              className="flex items-center gap-1 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
            >
              <NotebookPen className="h-3.5 w-3.5" />
              Today's note
            </Link>
            <button
              type="button"
              onClick={() => void openNewNote()}
              className="flex items-center gap-1 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
              New
            </button>
          </div>
        }
      >
        {notesLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((index) => (
              <div key={index} className="h-12 animate-pulse rounded-2xl bg-card" />
            ))}
          </div>
        ) : recentNotes.length === 0 ? (
          <p className="font-serif text-xl italic text-soft">Nothing written yet.</p>
        ) : (
          <div className="divide-y divide-border border-t border-border">
            {recentNotes.map((note) => (
              <Link
                key={note._id}
                to={`/notes/${note._id}`}
                className="group flex items-baseline justify-between gap-4 py-4"
              >
                <span
                  className={cn(
                    "min-w-0 truncate font-serif text-xl transition-colors group-hover:text-rating",
                    !note.title.trim() && "italic text-soft",
                  )}
                >
                  {note.title.trim() || note.excerpt || "Untitled"}
                </span>
                <span className="shrink-0 text-[13px] text-muted-foreground">
                  {relativeDate(note.updatedAt)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

export default TodayPage;
