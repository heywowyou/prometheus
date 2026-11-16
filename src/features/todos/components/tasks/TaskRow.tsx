import { useEffect, useRef } from "react";
import { Bell, Box, Circle, FileText, Flag, ListChecks, Moon, Repeat, Star } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@components/ui/sheet";
import { useMediaQuery } from "@lib/hooks/useMediaQuery";
import { cn } from "@lib/utils";
import { daysUntil } from "../../due";
import { dayLabel, isDay } from "../../task-views";
import type { Todo, TodoArea, TodoProject } from "../../types/todo-types";
import TaskCheckbox from "./TaskCheckbox";
import TaskDetail, { type TaskActions } from "./TaskDetail";

export interface RowContext {
  actions: TaskActions;
  areas: TodoArea[];
  projects: TodoProject[];
  tagSuggestions: string[];
  /** Show the start day (hidden in Today and Upcoming, where the list says it). */
  showWhen?: boolean;
  /** Show the project or area (hidden inside that project or area). */
  showList?: boolean;
}

/** Popovers and menus portal out of the card; clicks in them aren't "outside". */
const isInPortal = (target: EventTarget | null) =>
  target instanceof Element &&
  Boolean(target.closest("[data-radix-popper-content-wrapper], [role=dialog], [role=menu], .tippy-box, [data-suggestion]"));

/** One task: a line of text and quiet hints; opens in place (a sheet on phones). */
export default function TaskRow({
  todo,
  context,
  open,
  onOpenChange,
  dragHandleProps,
  autoFocusTitle,
}: {
  todo: Todo;
  context: RowContext;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dragHandleProps?: Record<string, unknown>;
  autoFocusTitle?: boolean;
}) {
  const phone = useMediaQuery("(max-width: 767px)");
  const cardRef = useRef<HTMLDivElement>(null);
  const today = new Date();

  // Desktop card: click outside or Escape closes it.
  useEffect(() => {
    if (!open || phone) return;
    const onPointerDown = (event: PointerEvent) => {
      if (cardRef.current?.contains(event.target as Node) || isInPortal(event.target)) return;
      onOpenChange(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || document.querySelector("[data-radix-popper-content-wrapper]")) return;
      onOpenChange(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, phone, onOpenChange]);

  const detail = (
    <TaskDetail
      todo={todo}
      actions={context.actions}
      areas={context.areas}
      projects={context.projects}
      tagSuggestions={context.tagSuggestions}
      onClose={() => onOpenChange(false)}
      autoFocusTitle={autoFocusTitle}
    />
  );

  if (open && !phone) {
    return (
      <div
        ref={cardRef}
        data-task-detail
        className="relative z-10 my-2 rounded-2xl border border-border bg-card px-4 py-3.5 shadow-xl shadow-overlay/40"
      >
        {detail}
      </div>
    );
  }

  const project = todo.projectId ? context.projects.find((item) => item._id === todo.projectId) : undefined;
  const area = !project && todo.areaId ? context.areas.find((item) => item._id === todo.areaId) : undefined;
  const deadline = todo.dueDate ? daysUntil(todo.dueDate, today) : null;
  const checklist = todo.checklist ?? [];
  const checklistDone = checklist.filter((item) => item.done).length;
  const startsToday = isDay(todo.when) && daysUntil(todo.when, today) <= 0;

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        data-task-row
        onClick={() => onOpenChange(true)}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpenChange(true);
          }
        }}
        {...dragHandleProps}
        className={cn(
          "group flex min-h-[2.75rem] cursor-default items-center gap-3 rounded-xl px-2.5 py-2 outline-none transition-colors hover:bg-secondary/50 focus-visible:bg-secondary/60",
          todo.completed && "opacity-55",
        )}
      >
        <TaskCheckbox
          checked={todo.completed}
          tone={deadline !== null && !todo.completed ? (deadline < 0 ? "overdue" : deadline === 0 ? "due" : "default") : "default"}
          label={todo.completed ? `Reopen ${todo.text}` : `Complete ${todo.text}`}
          onToggle={() => context.actions.toggle(todo._id)}
        />
        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5">
          {context.showWhen && todo.when === "someday" ? null : context.showWhen && startsToday ? (
            todo.evening ? (
              <Moon className="h-3.5 w-3.5 shrink-0 text-info" aria-label="This Evening" />
            ) : (
              <Star className="h-3.5 w-3.5 shrink-0 fill-warning text-warning" aria-label="Today" />
            )
          ) : null}
          {context.showWhen && isDay(todo.when) && !startsToday && (
            <span className="shrink-0 rounded-md bg-secondary px-1.5 py-px text-[11px] text-soft">
              {dayLabel(todo.when, today, "short")}
            </span>
          )}
          <span
            className={cn(
              "min-w-0 truncate text-[15px] text-foreground",
              todo.completed && "text-muted-foreground line-through decoration-muted-foreground/60",
              !todo.text.trim() && "italic text-muted-foreground",
            )}
          >
            {todo.important && !todo.completed && <span className="mr-1 font-semibold text-warning">!</span>}
            {todo.text.trim() || "New task"}
          </span>
          <span className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
            {todo.notes && <FileText className="h-3.5 w-3.5" aria-label="Has notes" />}
            {checklist.length > 0 && (
              <span className="flex items-center gap-0.5 text-[11px] tabular-nums">
                <ListChecks className="h-3.5 w-3.5" />
                {checklistDone}/{checklist.length}
              </span>
            )}
            {todo.repeat && <Repeat className="h-3.5 w-3.5" aria-label="Repeats" />}
            {todo.time && (
              <span className="flex items-center gap-0.5 text-[11px] tabular-nums">
                <Bell className="h-3 w-3" />
                {todo.time}
              </span>
            )}
          </span>
          {(todo.tags ?? []).map((tag) => (
            <span key={tag} className="shrink-0 rounded-full bg-secondary px-1.5 py-px text-[11px] text-muted-foreground">
              {tag}
            </span>
          ))}
          {context.showList && (project || area) && (
            <span className="flex w-full items-center gap-1 text-xs text-muted-foreground sm:w-auto">
              {project ? <Circle className="h-3 w-3" /> : <Box className="h-3 w-3" />}
              <span className="truncate">{project?.title || area?.title || "Untitled"}</span>
            </span>
          )}
        </span>
        {todo.dueDate && !todo.completed && (
          <span
            className={cn(
              "flex shrink-0 items-center gap-1 text-xs tabular-nums",
              deadline !== null && deadline < 0
                ? "text-destructive"
                : deadline === 0
                  ? "text-warning"
                  : "text-muted-foreground",
            )}
          >
            <Flag className="h-3 w-3" />
            {deadline !== null && deadline < 0
              ? `${-deadline}d late`
              : deadline === 0
                ? "Today"
                : deadline !== null && deadline < 7
                  ? `${deadline}d left`
                  : dayLabel(todo.dueDate, today, "short")}
          </span>
        )}
      </div>

      {phone && (
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent className="max-h-[88dvh] overflow-y-auto">
            <SheetTitle className="sr-only">{todo.text || "Task"}</SheetTitle>
            <SheetDescription className="sr-only">Edit the task</SheetDescription>
            <div data-task-detail className="px-1 pb-2">
              {detail}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
