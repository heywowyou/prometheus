import { Fragment } from "react";
import { Link } from "react-router-dom";
import { Archive, Box, CalendarDays, Inbox, Layers, Moon, Sprout, Star } from "lucide-react";
import { toDayKey } from "../due";
import { useRowContext } from "../hooks/useTaskActions";
import { shiftDayKey, upcomingHeader } from "../task-views";
import { useTodosData } from "../todos-outlet";
import { isTask, type Todo } from "../types/todo-types";
import ListHeader from "../components/tasks/ListHeader";
import NewTaskInput from "../components/tasks/NewTaskInput";
import TaskList from "../components/tasks/TaskList";
import ProgressPie from "../components/tasks/ProgressPie";
import CompletedSection from "../components/tasks/CompletedSection";

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-10 text-center font-serif text-xl italic text-muted-foreground">{children}</p>;
}

function Loading() {
  return (
    <div className="space-y-2">
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className="h-11 animate-pulse rounded-xl bg-card" style={{ opacity: 1 - index * 0.2 }} />
      ))}
    </div>
  );
}

export function InboxPage() {
  const data = useTodosData();
  const context = useRowContext(data, { showWhen: true });
  const tasks = data.index.inbox;
  return (
    <>
      <ListHeader
        icon={<Inbox className="h-6 w-6 text-info" />}
        title="Inbox"
        subtitle="New tasks wait here until you give them a day or a project."
      />
      <NewTaskInput defaults={{}} projects={data.projects} areas={data.areas} onCreate={data.createTodo} />
      {data.loading ? <Loading /> : tasks.length === 0 ? <Empty>Inbox zero.</Empty> : (
        <TaskList todos={tasks} context={context} onReorder={data.reorderTodos} />
      )}
      <CompletedSection data={data} />
    </>
  );
}

export function TodayListPage() {
  const data = useTodosData();
  const context = useRowContext(data, { showList: true });
  const { todayList, evening, today } = data.index;
  const habitsLeft = data.todos.filter(
    // Rest days and few-days-a-week habits don't count as left.
    (todo) => !isTask(todo) && todo.recurrenceType === "daily" && !todo.completed && !todo.skipped && !todo.perWeek,
  ).length;
  const date = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

  return (
    <>
      <ListHeader
        icon={<Star className="h-6 w-6 fill-highlight text-highlight" />}
        title="Today"
        subtitle={`${date}. What you plan to do today.`}
        actions={
          habitsLeft > 0 ? (
            <Link
              to="/habits"
              className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-soft hover:text-foreground"
            >
              <Sprout className="h-3.5 w-3.5 text-rating" />
              {habitsLeft} habit{habitsLeft === 1 ? "" : "s"} left
            </Link>
          ) : null
        }
      />
      <NewTaskInput
        defaults={{ when: today }}
        projects={data.projects}
        areas={data.areas}
        onCreate={data.createTodo}
        placeholder="New task for today"
      />
      {data.loading ? (
        <Loading />
      ) : todayList.length === 0 && evening.length === 0 ? (
        <Empty>Nothing planned. Enjoy the day.</Empty>
      ) : (
        <>
          <TaskList todos={todayList} context={context} onReorder={data.reorderTodos} />
          {evening.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-1 flex items-center gap-2 border-b border-border pb-2 text-sm font-medium text-info">
                <Moon className="h-4 w-4" /> This Evening
              </h2>
              <TaskList todos={evening} context={context} onReorder={data.reorderTodos} />
            </section>
          )}
        </>
      )}
      <CompletedSection data={data} />
    </>
  );
}

export function UpcomingPage() {
  const data = useTodosData();
  const context = useRowContext(data, { showList: true });
  const { upcoming, today } = data.index;
  const byDay = new Map(upcoming.map((group) => [group.day, group.tasks]));
  const week = Array.from({ length: 7 }, (_, index) => shiftDayKey(today, index + 1));
  const later = upcoming.filter((group) => group.day > week[6]!);

  const dayBlock = (day: string, tasks: Todo[]) => {
    const header = upcomingHeader(day);
    return (
      <section key={day} className="mt-6">
        <h2 className="flex items-baseline gap-3 border-b border-border pb-1.5">
          <span className="font-serif text-3xl leading-none text-foreground tabular-nums">{header.number}</span>
          <span className="text-sm text-muted-foreground">{header.label}</span>
        </h2>
        {tasks.length > 0 && <TaskList todos={tasks} context={context} onReorder={data.reorderTodos} className="mt-1" />}
      </section>
    );
  };

  return (
    <>
      <ListHeader
        icon={<CalendarDays className="h-6 w-6 text-info" />}
        title="Upcoming"
        subtitle="Tasks planned for the days ahead. Each moves to Today on its day."
      />
      <NewTaskInput
        defaults={{ when: shiftDayKey(toDayKey(new Date()), 1) }}
        projects={data.projects}
        areas={data.areas}
        onCreate={data.createTodo}
        placeholder="New task for tomorrow (or type a day)"
      />
      {data.loading ? (
        <Loading />
      ) : (
        <>
          {week.map((day) => dayBlock(day, byDay.get(day) ?? []))}
          {later.map((group) => dayBlock(group.day, group.tasks))}
        </>
      )}
    </>
  );
}

export function AnytimePage() {
  const data = useTodosData();
  const context = useRowContext(data, { showWhen: true });
  const { anytime, areasById } = data.index;
  const loose = anytime.filter((todo) => !todo.projectId && !todo.areaId);
  const areaGroups = new Map<string | null, Map<string | null, Todo[]>>();
  for (const todo of anytime) {
    if (!todo.projectId && !todo.areaId) continue;
    const project = todo.projectId ? data.index.projectsById.get(todo.projectId) : undefined;
    const areaId = project ? (project.areaId ?? null) : (todo.areaId ?? null);
    const projectId = todo.projectId ?? null;
    if (!areaGroups.has(areaId)) areaGroups.set(areaId, new Map());
    const projects = areaGroups.get(areaId)!;
    projects.set(projectId, [...(projects.get(projectId) ?? []), todo]);
  }
  const orderedAreas = [null, ...data.areas.map((area) => area._id)].filter((id) => areaGroups.has(id));

  return (
    <>
      <ListHeader
        icon={<Layers className="h-6 w-6 text-rating" />}
        title="Anytime"
        subtitle="Everything without a day that you could do now, by area and project."
      />
      {data.loading ? (
        <Loading />
      ) : anytime.length === 0 ? (
        <Empty>Nothing available right now.</Empty>
      ) : (
        <>
          {loose.length > 0 && <TaskList todos={loose} context={context} onReorder={data.reorderTodos} />}
          {orderedAreas.map((areaId) => {
            const area = areaId ? areasById.get(areaId) : undefined;
            const projects = areaGroups.get(areaId)!;
            return (
              <section key={areaId ?? "none"} className="mt-8">
                {area && (
                  <Link
                    to={`/todos/areas/${area._id}`}
                    className="mb-1 flex items-center gap-2 border-b border-border pb-2 text-sm font-medium text-foreground hover:text-rating"
                  >
                    <Box className="h-4 w-4 text-muted-foreground" /> {area.title || "New area"}
                  </Link>
                )}
                {[...projects.entries()].map(([projectId, tasks]) => {
                  const project = projectId ? data.index.projectsById.get(projectId) : undefined;
                  const progress = projectId ? data.index.projectProgress(projectId) : null;
                  return (
                    <Fragment key={projectId ?? "loose"}>
                      {project && progress && (
                        <Link
                          to={`/todos/projects/${project._id}`}
                          className="mt-3 flex items-center gap-2 text-sm text-soft hover:text-foreground"
                        >
                          <ProgressPie done={progress.done} total={progress.total} className="text-info" />
                          {project.title || "New project"}
                        </Link>
                      )}
                      <TaskList todos={tasks} context={context} onReorder={data.reorderTodos} />
                    </Fragment>
                  );
                })}
              </section>
            );
          })}
        </>
      )}
    </>
  );
}

export function SomedayPage() {
  const data = useTodosData();
  const context = useRowContext(data, { showList: true });
  const parked = data.projects.filter((project) => project.when === "someday");
  return (
    <>
      <ListHeader
        icon={<Archive className="h-6 w-6 text-muted-foreground" />}
        title="Someday"
        subtitle="Ideas and maybes, out of the way until you want them."
      />
      <NewTaskInput
        defaults={{ when: "someday" }}
        projects={data.projects}
        areas={data.areas}
        onCreate={data.createTodo}
        placeholder="Something for someday"
      />
      {parked.length > 0 && (
        <div className="mb-4 space-y-1">
          {parked.map((project) => (
            <Link
              key={project._id}
              to={`/todos/projects/${project._id}`}
              className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-[15px] text-soft hover:bg-secondary/50"
            >
              <Box className="h-4 w-4 text-info" /> {project.title || "New project"}
            </Link>
          ))}
        </div>
      )}
      {data.loading ? <Loading /> : data.index.someday.length === 0 && parked.length === 0 ? (
        <Empty>Nothing parked.</Empty>
      ) : (
        <TaskList todos={data.index.someday} context={context} onReorder={data.reorderTodos} />
      )}
      <CompletedSection data={data} />
    </>
  );
}
