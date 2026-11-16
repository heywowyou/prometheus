import { useEffect, useMemo, useRef, useState } from "react";
import { Archive, Bell, Box, Circle, Flag, Hash, Moon, Plus, Repeat, Star, Timer, X } from "lucide-react";
import { cn } from "@lib/utils";
import type { CreateTodoPayload } from "../../api/todos-api";
import { parseTask, type TokenKind } from "../../task-parse";
import { useTasksUi, type NewTaskDefaults } from "../../tasks-ui";
import type { Todo, TodoArea, TodoProject } from "../../types/todo-types";

const TOKEN_ICONS: Record<TokenKind, typeof Star> = {
  when: Star,
  time: Bell,
  repeat: Repeat,
  deadline: Flag,
  list: Circle,
  tag: Hash,
  important: Flag,
  duration: Timer,
};

/**
 * Quick add for a list. Plain text makes a plain task; dates, times,
 * repeats, #lists, #tags and "!" are recognised as you type and shown as
 * chips (tap one to keep the words in the title instead).
 */
export default function NewTaskInput({
  defaults,
  projects,
  areas,
  onCreate,
  placeholder = "New task",
  className,
}: {
  defaults: NewTaskDefaults;
  projects: TodoProject[];
  areas: TodoArea[];
  onCreate: (payload: CreateTodoPayload) => Promise<Todo>;
  placeholder?: string;
  className?: string;
}) {
  const ui = useTasksUi();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [ignored, setIgnored] = useState<Set<string>>(() => new Set());
  const [saving, setSaving] = useState(false);

  const { registerNewTask } = ui;
  useEffect(() => {
    registerNewTask(() => inputRef.current?.focus());
    return () => registerNewTask(null);
  }, [registerNewTask]);

  const parsed = useMemo(
    () => parseTask(value, { projects, areas, ignored }),
    [value, projects, areas, ignored],
  );

  const submit = async () => {
    if (!parsed.text || saving) return;
    const listFromText = parsed.projectId || parsed.areaId;
    const payload: CreateTodoPayload = {
      text: parsed.text,
      recurrenceType: "none",
      interactionType: parsed.durationGoal ? "timer" : "checkbox",
      durationGoal: parsed.durationGoal ?? 0,
      ...defaults,
      ...(listFromText ? { projectId: parsed.projectId ?? null, areaId: parsed.areaId ?? null, headingId: null } : {}),
      ...(parsed.when ? { when: parsed.when, evening: Boolean(parsed.evening) } : {}),
      ...(parsed.time ? { time: parsed.time } : {}),
      ...(parsed.repeat ? { repeat: parsed.repeat } : {}),
      ...(parsed.dueDate ? { dueDate: parsed.dueDate } : {}),
      ...(parsed.tags.length ? { tags: parsed.tags } : {}),
      ...(parsed.important ? { important: true } : {}),
    };
    setSaving(true);
    try {
      await onCreate(payload);
      setValue("");
      setIgnored(new Set());
    } finally {
      setSaving(false);
      inputRef.current?.focus();
    }
  };

  const chipIcon = (kind: TokenKind, label: string) => {
    if (kind === "when" && label === "Someday") return Archive;
    if (kind === "when" && label === "This Evening") return Moon;
    if (kind === "list" && areas.some((area) => area.title === label)) return Box;
    return TOKEN_ICONS[kind];
  };

  return (
    <div className={cn("group", className)}>
      <div className="-mx-2.5 flex min-h-[2.75rem] items-center gap-3 rounded-xl px-2.5 transition-colors focus-within:bg-secondary/40">
        <Plus className="h-[18px] w-[18px] shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void submit();
            } else if (event.key === "Escape") {
              setValue("");
              setIgnored(new Set());
              event.currentTarget.blur();
            }
          }}
          disabled={saving}
          placeholder={placeholder}
          aria-label="New task"
          className="min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
        />
        {value && (
          <kbd className="hidden rounded-md border border-border px-1.5 text-[10px] text-muted-foreground sm:inline">Enter</kbd>
        )}
      </div>
      {parsed.tokens.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pb-2 pl-[30px] pt-1">
          {parsed.tokens.map((token) => {
            const Icon = chipIcon(token.kind, token.label);
            return (
              <button
                key={token.key}
                type="button"
                title="Keep these words in the title"
                onClick={() => {
                  setIgnored((previous) => new Set(previous).add(token.key));
                  inputRef.current?.focus();
                }}
                className="group/chip inline-flex h-6 items-center gap-1 rounded-full bg-rating/10 px-2 text-xs text-rating transition-colors hover:bg-secondary hover:text-muted-foreground"
              >
                <Icon className="h-3 w-3" />
                {token.label}
                <X className="h-3 w-3 opacity-50 group-hover/chip:opacity-100" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
