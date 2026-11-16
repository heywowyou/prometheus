import { daysUntil, toDayKey } from "./due";
import { isTask, type Todo, type TodoArea, type TodoProject } from "./types/todo-types";

/**
 * Which lists a task shows in, Things-style. Everything is derived on the
 * client from one list of open tasks (plus the ones done today), so moving a
 * task between views is a field change, never a refetch.
 */

export const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const isDay = (value: string | null | undefined): value is string =>
  typeof value === "string" && DAY_PATTERN.test(value);

export type ViewKey = "inbox" | "today" | "upcoming" | "anytime" | "someday" | "logbook";

/** Done today, still shown (ticked) where it was. */
const doneToday = (todo: Todo, today: string) =>
  todo.completed && Boolean(todo.completedAt) && toDayKey(new Date(todo.completedAt as string)) === today;

const visible = (todo: Todo, today: string) => isTask(todo) && (!todo.completed || doneToday(todo, today));

export const byOrder = (a: Todo, b: Todo) =>
  (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER) ||
  new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

export interface TaskIndex {
  today: string;
  projectsById: Map<string, TodoProject>;
  areasById: Map<string, TodoArea>;
  /** A project parked in Someday parks its tasks too. */
  isSomeday: (todo: Todo) => boolean;
  inbox: Todo[];
  /** Today, without This Evening. */
  todayList: Todo[];
  evening: Todo[];
  /** Days after today with something starting or due, ascending. */
  upcoming: Array<{ day: string; tasks: Todo[] }>;
  /** Startable now, grouped by area then project. */
  anytime: Todo[];
  someday: Todo[];
  inProject: (projectId: string) => Todo[];
  inArea: (areaId: string) => Todo[];
  /** Open tasks per project, for progress rings. */
  projectProgress: (projectId: string) => { done: number; total: number };
  tags: string[];
}

export const buildTaskIndex = (
  todos: Todo[],
  projects: TodoProject[],
  areas: TodoArea[],
  now: Date = new Date(),
): TaskIndex => {
  const today = toDayKey(now);
  const projectsById = new Map(projects.map((project) => [project._id, project]));
  const areasById = new Map(areas.map((area) => [area._id, area]));
  const tasks = todos.filter((todo) => visible(todo, today)).sort(byOrder);

  const isSomeday = (todo: Todo) =>
    todo.when === "someday" ||
    (Boolean(todo.projectId) && projectsById.get(todo.projectId as string)?.when === "someday");
  const inAList = (todo: Todo) => Boolean(todo.projectId || todo.areaId);
  const startsBy = (todo: Todo, day: string) => isDay(todo.when) && todo.when <= day;
  const dueBy = (todo: Todo, day: string) => isDay(todo.dueDate) && todo.dueDate <= day;
  const isToday = (todo: Todo) => !isSomeday(todo) && (startsBy(todo, today) || dueBy(todo, today));

  const inbox = tasks.filter((todo) => !inAList(todo) && !todo.when && !(todo.dueDate && dueBy(todo, today)));
  const todayAll = tasks.filter(isToday);
  const todayList = todayAll.filter((todo) => !todo.evening);
  const evening = todayAll.filter((todo) => todo.evening);

  const upcomingMap = new Map<string, Todo[]>();
  for (const todo of tasks) {
    if (todo.completed || isSomeday(todo) || isToday(todo)) continue;
    const day = isDay(todo.when) ? todo.when : isDay(todo.dueDate) ? todo.dueDate : null;
    if (!day || day <= today) continue;
    upcomingMap.set(day, [...(upcomingMap.get(day) ?? []), todo]);
  }
  const upcoming = [...upcomingMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, list]) => ({ day, tasks: list }));

  const anytime = tasks.filter(
    (todo) => !isSomeday(todo) && (!isDay(todo.when) || todo.when <= today) && (inAList(todo) || isToday(todo)),
  );
  const someday = tasks.filter(isSomeday);

  const allTags = new Set<string>();
  for (const todo of todos) for (const tag of todo.tags ?? []) allTags.add(tag);

  return {
    today,
    projectsById,
    areasById,
    isSomeday,
    inbox,
    todayList,
    evening,
    upcoming,
    anytime,
    someday,
    inProject: (projectId) => tasks.filter((todo) => todo.projectId === projectId),
    inArea: (areaId) => tasks.filter((todo) => todo.areaId === areaId && !todo.projectId),
    projectProgress: (projectId) => {
      const all = todos.filter((todo) => isTask(todo) && todo.projectId === projectId);
      return { done: all.filter((todo) => todo.completed).length, total: all.length };
    },
    tags: [...allTags].sort(),
  };
};

const parseDay = (key: string) => {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
};

/** "Today", "Tomorrow", "Friday", "24 Dec", "3 Jan 2027". */
export const dayLabel = (key: string, now: Date = new Date(), weekdayStyle: "long" | "short" = "long"): string => {
  const days = daysUntil(key, now);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  const date = parseDay(key);
  if (days > 1 && days < 7) return date.toLocaleDateString(undefined, { weekday: weekdayStyle });
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: "numeric" }),
  });
};

/** "Mon 17" for the Upcoming headers, with the long weekday for this week. */
export const upcomingHeader = (key: string, now: Date = new Date()) => {
  const date = parseDay(key);
  const days = daysUntil(key, now);
  const weekday = date.toLocaleDateString(undefined, { weekday: "long" });
  const month =
    date.getMonth() !== now.getMonth() || date.getFullYear() !== now.getFullYear()
      ? ` · ${date.toLocaleDateString(undefined, { month: "long", ...(date.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}) })}`
      : "";
  return { number: date.getDate(), label: days === 1 ? `Tomorrow${month}` : `${weekday}${month}` };
};

export const shiftDayKey = (key: string, days: number) => {
  const date = parseDay(key);
  date.setDate(date.getDate() + days);
  return toDayKey(date);
};

/** The next Monday after today (Things' "Next week"). */
export const nextMonday = (now: Date = new Date()) => {
  const offset = ((8 - now.getDay()) % 7) || 7;
  return shiftDayKey(toDayKey(now), offset);
};
