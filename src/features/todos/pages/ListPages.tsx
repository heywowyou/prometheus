import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Archive,
  BookCheck,
  Box,
  CheckCircle2,
  Ellipsis,
  Flag,
  Heading,
  Layers,
  RotateCcw,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import ConfirmDialog from "@components/feedback/ConfirmDialog";
import { useDebouncedSave } from "@lib/hooks/useDebouncedSave";
import { cn } from "@lib/utils";
import type { ProjectPayload } from "../api/todos-api";
import { toDayKey } from "../due";
import { useLogbook } from "../hooks/useTodoLists";
import { useRowContext } from "../hooks/useTaskActions";
import { dayLabel } from "../task-views";
import { useTodosData } from "../todos-outlet";
import { useTasksUi } from "../tasks-ui";
import ListHeader from "../components/tasks/ListHeader";
import NewTaskInput from "../components/tasks/NewTaskInput";
import TaskList from "../components/tasks/TaskList";
import ProgressPie from "../components/tasks/ProgressPie";
import { DeadlinePicker } from "../components/tasks/TaskPickers";
import TaskRow from "../components/tasks/TaskRow";
import type { Todo } from "../types/todo-types";

const TaskNotes = lazy(() => import("../components/tasks/TaskNotes"));

/** A title you edit in place, styled as the page title. */
function TitleInput({
  value,
  placeholder,
  autoFocus,
  onChange,
}: {
  value: string;
  placeholder: string;
  autoFocus?: boolean;
  onChange: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);
  return (
    <input
      ref={ref}
      value={draft}
      placeholder={placeholder}
      onChange={(event) => {
        setDraft(event.target.value);
        onChange(event.target.value);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
      }}
      aria-label="Title"
      className="w-full bg-transparent font-serif text-[2.5rem] font-normal leading-none text-foreground outline-none placeholder:text-muted-foreground/60 sm:text-5xl"
    />
  );
}

export function LogbookPage() {
  const data = useTodosData();
  const context = useRowContext(data, { showList: true });
  const ui = useTasksUi();
  const logbook = useLogbook();
  const groups = new Map<string, Todo[]>();
  for (const todo of logbook.tasks) {
    const day = todo.completedAt ? toDayKey(new Date(todo.completedAt)) : "unknown";
    groups.set(day, [...(groups.get(day) ?? []), todo]);
  }

  return (
    <>
      <ListHeader icon={<BookCheck className="h-6 w-6 text-rating" />} title="Logbook" subtitle="Everything you've finished." />
      {logbook.projects.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-1 border-b border-border pb-1.5 text-sm text-muted-foreground">Projects</h2>
          {logbook.projects.map((project) => (
            <div key={project._id} className="flex items-center gap-3 rounded-xl px-2.5 py-2 text-[15px] text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-rating" />
              <span className="flex-1 truncate line-through decoration-muted-foreground/60">{project.title || "Untitled project"}</span>
              <button
                type="button"
                onClick={() => data.reopenProject(project._id)}
                className="flex items-center gap-1 text-xs hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reopen
              </button>
            </div>
          ))}
        </section>
      )}
      {logbook.loading ? (
        <div className="h-24 animate-pulse rounded-xl bg-card" />
      ) : logbook.tasks.length === 0 ? (
        <p className="py-10 text-center font-serif text-xl italic text-muted-foreground">Nothing done yet. Soon.</p>
      ) : (
        [...groups.entries()].map(([day, tasks]) => (
          <section key={day} className="mb-6">
            <h2 className="mb-1 border-b border-border pb-1.5 text-sm text-muted-foreground">
              {day === "unknown" ? "Earlier" : dayLabel(day)}
            </h2>
            <div className="-mx-2.5">
              {tasks.map((todo) => (
                <TaskRow
                  key={todo._id}
                  todo={todo}
                  context={context}
                  open={ui.openId === todo._id}
                  onOpenChange={(open) => ui.setOpenId(open ? todo._id : null)}
                />
              ))}
            </div>
          </section>
        ))
      )}
      {logbook.hasMore && (
        <button
          type="button"
          disabled={logbook.loadingMore}
          onClick={logbook.loadMore}
          className="w-full rounded-full border border-border py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          {logbook.loadingMore ? "Loading…" : "Show more"}
        </button>
      )}
    </>
  );
}

export function ProjectPage() {
  const { id = "" } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const data = useTodosData();
  const context = useRowContext(data, { showWhen: true });
  const project = data.projects.find((item) => item._id === id);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const { schedule } = useDebouncedSave<ProjectPayload>({
    save: (payload) => data.updateProject(id, payload),
  });

  if (!project) {
    return data.loading ? null : (
      <p className="py-10 text-center text-muted-foreground">
        This project is done or gone. <Link to="/todos/logbook" className="underline">Logbook</Link>
      </p>
    );
  }

  const tasks = data.index.inProject(project._id);
  const progress = data.index.projectProgress(project._id);
  const loose = tasks.filter((todo) => !todo.headingId);
  const area = project.areaId ? data.index.areasById.get(project.areaId) : undefined;
  const addHeading = () =>
    void data.updateProject(project._id, { headings: [...project.headings, { title: "New heading" }] });

  return (
    <>
      <header className="mb-6 pt-1 sm:pt-4">
        {area && (
          <Link to={`/todos/areas/${area._id}`} className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <Box className="h-3.5 w-3.5" /> {area.title || "New area"}
          </Link>
        )}
        <div className="flex items-center gap-3">
          <ProgressPie done={progress.done} total={progress.total} className="h-7 w-7 text-info" />
          <div className="min-w-0 flex-1">
            <TitleInput
              key={project._id}
              value={project.title}
              placeholder="New project"
              autoFocus={params.get("new") === "1"}
              onChange={(title) => schedule({ title })}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Project actions"
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <Ellipsis className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onClick={() => {
                  data.completeProject(project);
                  navigate("/todos/today");
                }}
              >
                <CheckCircle2 className="h-4 w-4" /> Complete project
              </DropdownMenuItem>
              <DropdownMenuItem onClick={addHeading}>
                <Heading className="h-4 w-4" /> Add heading
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowNotes(true)}>
                <Box className="h-4 w-4" /> Add notes
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => void data.updateProject(project._id, { when: project.when === "someday" ? null : "someday" })}
              >
                <Archive className="h-4 w-4" /> {project.when === "someday" ? "Make active" : "Move to Someday"}
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Layers className="h-4 w-4" /> Move to area
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => void data.updateProject(project._id, { areaId: null })}>
                    No area
                  </DropdownMenuItem>
                  {data.areas.map((item) => (
                    <DropdownMenuItem key={item._id} onClick={() => void data.updateProject(project._id, { areaId: item._id })}>
                      {item.title || "New area"}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-4 w-4" /> Delete project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 pl-10 text-sm text-muted-foreground">
          {project.when === "someday" && (
            <span className="flex items-center gap-1"><Archive className="h-3.5 w-3.5" /> Someday</span>
          )}
          <DeadlinePicker value={project.dueDate ?? null} onChange={(day) => void data.updateProject(project._id, { dueDate: day })}>
            <button
              type="button"
              className={cn("flex items-center gap-1 hover:text-foreground", !project.dueDate && "opacity-60")}
            >
              <Flag className="h-3.5 w-3.5" />
              {project.dueDate ? `Deadline ${dayLabel(project.dueDate)}` : "Deadline"}
            </button>
          </DeadlinePicker>
        </div>
        {(showNotes || project.notes) && (
          <div className="mt-3 pl-10">
            <Suspense fallback={null}>
              <TaskNotes value={project.notes} autoFocus={showNotes && !project.notes} onChange={(notes) => schedule({ notes })} />
            </Suspense>
          </div>
        )}
      </header>

      <NewTaskInput
        defaults={{ projectId: project._id }}
        projects={data.projects}
        areas={data.areas}
        onCreate={data.createTodo}
      />
      <TaskList todos={loose} context={context} onReorder={data.reorderTodos} />

      {project.headings.map((heading) => {
        const inHeading = tasks.filter((todo) => todo.headingId === heading._id);
        return (
          <section key={heading._id} className="mt-8">
            <div className="group flex items-center gap-2 border-b border-border pb-1.5">
              <input
                defaultValue={heading.title}
                aria-label="Heading"
                onBlur={(event) => {
                  const title = event.currentTarget.value.trim() || "Untitled heading";
                  if (title === heading.title) return;
                  void data.updateProject(project._id, {
                    headings: project.headings.map((item) => (item._id === heading._id ? { ...item, title } : item)),
                  });
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") event.currentTarget.blur();
                }}
                className="min-w-0 flex-1 bg-transparent text-sm font-medium text-rating outline-none"
              />
              <button
                type="button"
                aria-label="Remove heading"
                onClick={() =>
                  void data.updateProject(project._id, {
                    headings: project.headings.filter((item) => item._id !== heading._id),
                  })
                }
                className="text-muted-foreground opacity-0 hover:text-foreground group-hover:opacity-100 touch:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <TaskList todos={inHeading} context={context} onReorder={data.reorderTodos} />
            <QuickHeadingAdd
              onAdd={(text) =>
                data.createTodo({
                  text,
                  recurrenceType: "none",
                  interactionType: "checkbox",
                  durationGoal: 0,
                  projectId: project._id,
                  headingId: heading._id,
                })
              }
            />
          </section>
        );
      })}

      {tasks.length === 0 && project.headings.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Add the first task above. Headings (in the … menu) split a bigger project into parts.
        </p>
      )}

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this project?"
        description={`“${project.title || "New project"}” and its ${tasks.length} task${tasks.length === 1 ? "" : "s"} will be deleted for good.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          data.deleteProject(project._id);
          navigate("/todos/today");
        }}
      />
    </>
  );
}

function QuickHeadingAdd({ onAdd }: { onAdd: (text: string) => Promise<unknown> }) {
  const [value, setValue] = useState("");
  return (
    <input
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter" && value.trim()) {
          event.preventDefault();
          void onAdd(value.trim()).then(() => setValue(""));
        }
      }}
      placeholder="+ Add a task here"
      className="mt-1 w-full bg-transparent py-2 text-sm text-soft outline-none placeholder:text-muted-foreground/60"
    />
  );
}

export function AreaPage() {
  const { id = "" } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const data = useTodosData();
  const context = useRowContext(data, { showWhen: true });
  const area = data.areas.find((item) => item._id === id);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const renameRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!area) return data.loading ? null : <p className="py-10 text-center text-muted-foreground">This area is gone.</p>;

  const projects = data.projects.filter((project) => project.areaId === area._id);
  const tasks = data.index.inArea(area._id);

  return (
    <>
      <header className="mb-6 flex items-center gap-3 pt-1 sm:pt-4">
        <Box className="h-6 w-6 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <TitleInput
            key={area._id}
            value={area.title}
            placeholder="New area"
            autoFocus={params.get("new") === "1"}
            onChange={(title) => {
              if (renameRef.current) clearTimeout(renameRef.current);
              renameRef.current = setTimeout(() => data.renameArea(area._id, title), 500);
            }}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Area actions"
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <Ellipsis className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={async () => {
                const project = await data.createProject({ title: "", areaId: area._id });
                navigate(`/todos/projects/${project._id}?new=1`);
              }}
            >
              <Box className="h-4 w-4" /> New project here
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4" /> Delete area
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {projects.length > 0 && (
        <div className="mb-6 grid gap-2 sm:grid-cols-2">
          {projects.map((project) => {
            const progress = data.index.projectProgress(project._id);
            const open = data.index.inProject(project._id).filter((todo) => !todo.completed).length;
            return (
              <Link
                key={project._id}
                to={`/todos/projects/${project._id}`}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 transition-colors hover:border-rating/40"
              >
                <ProgressPie done={progress.done} total={progress.total} className="h-4 w-4 text-info" />
                <span className="min-w-0 flex-1 truncate text-[15px] text-foreground">{project.title || "New project"}</span>
                <span className="text-xs tabular-nums text-muted-foreground">{open || ""}</span>
              </Link>
            );
          })}
        </div>
      )}

      <NewTaskInput defaults={{ areaId: area._id }} projects={data.projects} areas={data.areas} onCreate={data.createTodo} />
      <TaskList todos={tasks} context={context} onReorder={data.reorderTodos} />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this area?"
        description="Its projects and tasks stay, without an area."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          data.deleteArea(area._id);
          navigate("/todos/today");
        }}
      />
    </>
  );
}
