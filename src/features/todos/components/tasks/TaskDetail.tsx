import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  Archive,
  Bell,
  Box,
  Circle,
  Copy,
  Ellipsis,
  Flag,
  Inbox,
  Layers,
  ListChecks,
  Moon,
  Plus,
  Repeat,
  Star,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import { useDebouncedSave } from "@lib/hooks/useDebouncedSave";
import { cn } from "@lib/utils";
import type { UpdateTodoPayload } from "../../api/todos-api";
import { describeRepeat } from "../../task-parse";
import { dayLabel, isDay } from "../../task-views";
import { daysUntil } from "../../due";
import type { ChecklistItem, Todo, TodoArea, TodoProject } from "../../types/todo-types";
import TaskCheckbox from "./TaskCheckbox";
import { DeadlinePicker, MovePicker, RepeatPicker, TagPicker, WhenPicker } from "./TaskPickers";

const TaskNotes = lazy(() => import("./TaskNotes"));

export interface TaskActions {
  toggle: (id: string) => void;
  update: (id: string, payload: UpdateTodoPayload) => Promise<unknown>;
  remove: (todo: Todo) => void;
  duplicate: (todo: Todo) => void;
  convertToHabit: (todo: Todo) => void;
}

function IconAction({ label, onClick, children }: { label: string; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      {children}
    </button>
  );
}

function Chip({
  icon,
  label,
  tone,
  onClear,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: React.ReactNode;
  label: string;
  tone?: "warning" | "danger";
  onClear?: () => void;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-1 rounded-full border border-border bg-secondary/60 pl-2.5 text-xs",
        onClear ? "pr-1" : "pr-2.5",
        tone === "danger" ? "text-destructive" : tone === "warning" ? "text-warning" : "text-soft",
      )}
    >
      <button type="button" className="flex items-center gap-1.5" {...rest}>
        {icon}
        {label}
      </button>
      {onClear && (
        <button
          type="button"
          aria-label={`Clear ${label}`}
          onClick={onClear}
          className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:bg-raised hover:text-foreground"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}

/** The open task: title, notes, checklist, tags and the schedule, all optional. */
export default function TaskDetail({
  todo,
  actions,
  areas,
  projects,
  tagSuggestions,
  onClose,
  autoFocusTitle,
}: {
  todo: Todo;
  actions: TaskActions;
  areas: TodoArea[];
  projects: TodoProject[];
  tagSuggestions: string[];
  onClose: () => void;
  autoFocusTitle?: boolean;
}) {
  const [title, setTitle] = useState(todo.text);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(todo.checklist ?? []);
  const [showNotes, setShowNotes] = useState(Boolean(todo.notes));
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const newItemRef = useRef<HTMLInputElement>(null);
  const today = new Date();

  // Typing is debounced; the hook flushes on unmount, so closing the card keeps it.
  const { schedule } = useDebouncedSave<UpdateTodoPayload>({
    save: (payload) => actions.update(todo._id, payload),
  });

  useEffect(() => {
    const field = titleRef.current;
    if (!field) return;
    field.style.height = "0px";
    field.style.height = `${field.scrollHeight}px`;
  }, [title]);

  useEffect(() => {
    if (autoFocusTitle) titleRef.current?.focus();
  }, [autoFocusTitle]);

  const set = (payload: UpdateTodoPayload) => void actions.update(todo._id, payload).catch(() => undefined);

  const saveChecklist = (next: ChecklistItem[]) => {
    setChecklist(next);
    schedule({ checklist: next });
  };

  const project = todo.projectId ? projects.find((item) => item._id === todo.projectId) : undefined;
  const area = todo.areaId ? areas.find((item) => item._id === todo.areaId) : undefined;
  const deadlineDays = todo.dueDate ? daysUntil(todo.dueDate, today) : null;
  const whenLabel =
    todo.when === "someday"
      ? "Someday"
      : isDay(todo.when)
        ? todo.evening && daysUntil(todo.when, today) === 0
          ? "This Evening"
          : dayLabel(todo.when, today)
        : null;
  const whenValue = { when: todo.when ?? null, evening: Boolean(todo.evening), time: todo.time ?? null };
  const hasChecklist = checklist.length > 0;
  const tags = todo.tags ?? [];

  return (
    <div className="flex gap-3">
      <TaskCheckbox
        className="mt-[5px]"
        checked={todo.completed}
        label={todo.completed ? `Reopen ${todo.text}` : `Complete ${todo.text}`}
        onToggle={() => actions.toggle(todo._id)}
      />
      <div className="min-w-0 flex-1">
        <textarea
          ref={titleRef}
          rows={1}
          value={title}
          onChange={(event) => {
            const next = event.target.value.replace(/\n/g, " ");
            setTitle(next);
            if (next.trim()) schedule({ text: next.trim() });
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              setShowNotes(true);
            }
          }}
          aria-label="Task title"
          placeholder="New task"
          className="w-full resize-none overflow-hidden bg-transparent font-serif text-[1.1875rem] leading-snug text-foreground outline-none placeholder:text-muted-foreground"
        />

        {(showNotes || todo.notes) && (
          <Suspense fallback={<div className="h-6" />}>
            <TaskNotes
              value={todo.notes ?? ""}
              autoFocus={showNotes && !todo.notes}
              onChange={(html) => schedule({ notes: html })}
              className="mt-1"
            />
          </Suspense>
        )}
        {!showNotes && !todo.notes && (
          <button
            type="button"
            onClick={() => setShowNotes(true)}
            className="mt-0.5 text-sm text-muted-foreground/70 hover:text-muted-foreground"
          >
            Notes
          </button>
        )}

        {hasChecklist && (
          <ul className="mt-3 space-y-0.5 border-t border-border pt-2">
            {checklist.map((item, index) => (
              <li key={item._id ?? index} className="group flex items-center gap-2.5">
                <TaskCheckbox
                  className="h-4 w-4 rounded-full"
                  checked={item.done}
                  label={item.done ? `Untick ${item.text}` : `Tick ${item.text}`}
                  onToggle={() =>
                    saveChecklist(checklist.map((entry, i) => (i === index ? { ...entry, done: !entry.done } : entry)))
                  }
                />
                <input
                  value={item.text}
                  onChange={(event) =>
                    saveChecklist(checklist.map((entry, i) => (i === index ? { ...entry, text: event.target.value } : entry)))
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      const next = [...checklist];
                      next.splice(index + 1, 0, { text: "", done: false });
                      saveChecklist(next);
                      requestAnimationFrame(() => {
                        const inputs = event.currentTarget.closest("ul")?.querySelectorAll("input");
                        inputs?.[index + 1]?.focus();
                      });
                    } else if (event.key === "Backspace" && !item.text) {
                      event.preventDefault();
                      saveChecklist(checklist.filter((_, i) => i !== index));
                      requestAnimationFrame(() => {
                        const inputs = event.currentTarget.closest("ul")?.querySelectorAll("input");
                        inputs?.[Math.max(0, index - 1)]?.focus();
                      });
                    }
                  }}
                  placeholder="Item"
                  className={cn(
                    "min-w-0 flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground",
                    item.done ? "text-muted-foreground line-through" : "text-soft",
                  )}
                />
              </li>
            ))}
            <li>
              <input
                ref={newItemRef}
                placeholder="Add item"
                onKeyDown={(event) => {
                  const text = event.currentTarget.value.trim();
                  if (event.key === "Enter" && text) {
                    event.preventDefault();
                    saveChecklist([...checklist, { text, done: false }]);
                    event.currentTarget.value = "";
                  }
                }}
                className="w-full bg-transparent py-1 pl-[26px] text-sm text-soft outline-none placeholder:text-muted-foreground/60"
              />
            </li>
          </ul>
        )}

        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span key={tag} className="rounded-full bg-secondary px-2 py-0.5 text-xs text-soft">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Schedule chips (only what's set) and the icons that add the rest. */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {whenLabel && (
            <WhenPicker value={whenValue} onChange={(value) => set(value)}>
              <span>
                <Chip
                  icon={
                    todo.when === "someday" ? (
                      <Archive className="h-3.5 w-3.5" />
                    ) : todo.evening ? (
                      <Moon className="h-3.5 w-3.5 text-info" />
                    ) : daysUntil(todo.when as string, today) <= 0 ? (
                      <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                    ) : (
                      <Layers className="h-3.5 w-3.5" />
                    )
                  }
                  label={`${whenLabel}${todo.time ? ` · ${todo.time}` : ""}`}
                  onClear={() => set({ when: null, evening: false, time: null })}
                />
              </span>
            </WhenPicker>
          )}
          {todo.dueDate && (
            <DeadlinePicker value={todo.dueDate} onChange={(day) => set({ dueDate: day })}>
              <span>
                <Chip
                  icon={<Flag className="h-3.5 w-3.5" />}
                  label={`Deadline ${dayLabel(todo.dueDate, today, "short")}`}
                  tone={deadlineDays !== null && deadlineDays < 0 ? "danger" : deadlineDays === 0 ? "warning" : undefined}
                  onClear={() => set({ dueDate: null })}
                />
              </span>
            </DeadlinePicker>
          )}
          {todo.repeat && (
            <RepeatPicker value={todo.repeat} onChange={(repeat) => set({ repeat })}>
              <span>
                <Chip
                  icon={<Repeat className="h-3.5 w-3.5" />}
                  label={describeRepeat(todo.repeat)}
                  onClear={() => set({ repeat: null })}
                />
              </span>
            </RepeatPicker>
          )}
          {(project || area) && (
            <MovePicker
              value={{ projectId: todo.projectId ?? null, areaId: todo.areaId ?? null }}
              areas={areas}
              projects={projects}
              onChange={(target) => set(target)}
            >
              <span>
                <Chip
                  icon={project ? <Circle className="h-3.5 w-3.5" /> : <Box className="h-3.5 w-3.5" />}
                  label={(project?.title || area?.title) ?? "Untitled"}
                />
              </span>
            </MovePicker>
          )}

          <span className="ml-auto flex items-center">
            {!whenLabel && (
              <WhenPicker value={whenValue} onChange={(value) => set(value)} align="end">
                <span>
                  <IconAction label="When">
                    <Star className="h-4 w-4" />
                  </IconAction>
                </span>
              </WhenPicker>
            )}
            {isDay(todo.when) && !todo.time && (
              <WhenPicker value={whenValue} onChange={(value) => set(value)} align="end">
                <span>
                  <IconAction label="Reminder">
                    <Bell className="h-4 w-4" />
                  </IconAction>
                </span>
              </WhenPicker>
            )}
            <TagPicker value={tags} suggestions={tagSuggestions} onChange={(next) => set({ tags: next })}>
              <span>
                <IconAction label="Tags">
                  <Tag className="h-4 w-4" />
                </IconAction>
              </span>
            </TagPicker>
            {!hasChecklist && (
              <IconAction
                label="Checklist"
                onClick={() => {
                  saveChecklist([{ text: "", done: false }]);
                  requestAnimationFrame(() =>
                    titleRef.current?.closest("[data-task-detail]")?.querySelector<HTMLInputElement>("ul input")?.focus(),
                  );
                }}
              >
                <ListChecks className="h-4 w-4" />
              </IconAction>
            )}
            {!todo.dueDate && (
              <DeadlinePicker value={null} onChange={(day) => set({ dueDate: day })}>
                <span>
                  <IconAction label="Deadline">
                    <Flag className="h-4 w-4" />
                  </IconAction>
                </span>
              </DeadlinePicker>
            )}
            {!todo.repeat && (
              <RepeatPicker value={null} onChange={(repeat) => set({ repeat })}>
                <span>
                  <IconAction label="Repeat">
                    <Repeat className="h-4 w-4" />
                  </IconAction>
                </span>
              </RepeatPicker>
            )}
            {!project && !area && (
              <MovePicker
                value={{ projectId: null, areaId: null }}
                areas={areas}
                projects={projects}
                onChange={(target) => set(target)}
              >
                <span>
                  <IconAction label="Move">
                    <Inbox className="h-4 w-4" />
                  </IconAction>
                </span>
              </MovePicker>
            )}
            <IconAction
              label={todo.important ? "Not important" : "Important"}
              onClick={() => set({ important: !todo.important })}
            >
              <span className={cn("text-base leading-none", todo.important ? "text-warning" : "")}>!</span>
            </IconAction>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="More"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <Ellipsis className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!hasChecklist && (
                  <DropdownMenuItem onClick={() => saveChecklist([{ text: "", done: false }])}>
                    <Plus className="h-4 w-4" /> Add checklist
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => actions.duplicate(todo)}>
                  <Copy className="h-4 w-4" /> Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => actions.convertToHabit(todo)}>
                  <Repeat className="h-4 w-4" /> Turn into a habit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => {
                    onClose();
                    actions.remove(todo);
                  }}
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </span>
        </div>
      </div>
    </div>
  );
}
