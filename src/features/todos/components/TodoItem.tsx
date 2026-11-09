import { useState, useEffect, useRef } from "react";
import {
  Flame,
  Repeat2,
  Pencil,
  Shredder,
  Ellipsis,
  PauseCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import { cn } from "@lib/utils";
import type { RecurrenceType, Todo } from "../types/todo-types";

/** How long a "hold to fill" task must be held before it completes. */
const HOLD_DURATION_MS = 1000;

const RESET_LABELS: Record<RecurrenceType, string | null> = {
  none: null,
  daily: "Resets daily",
  weekly: "Resets every Monday",
  monthly: "Resets on the 1st",
};

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (todo: Todo) => void;
  onEdit: (todo: Todo) => void;
  onPause?: (id: string) => void;
}

function TodoItem({ todo, onToggle, onDelete, onEdit, onPause }: TodoItemProps) {
  const isRecurring = todo.recurrenceType !== "none";
  const isHoldTask = todo.interactionType === "hold";
  const showTally = isRecurring && todo.completionCount > 0;

  const [isHolding, setIsHolding] = useState(false);
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // A hold task completes when the press survives HOLD_DURATION_MS; releasing
  // early cancels it.
  useEffect(() => {
    if (!isHolding) return;

    holdTimeoutRef.current = setTimeout(() => {
      onToggle(todo._id);
      setIsHolding(false);
    }, HOLD_DURATION_MS);

    return () => {
      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    };
  }, [isHolding, onToggle, todo._id]);

  const startHold = () => {
    if (!todo.completed) setIsHolding(true);
  };

  const activate = () => {
    // A completed hold task is un-completed with a plain click; an incomplete
    // one needs the hold gesture.
    if (!isHoldTask || todo.completed) onToggle(todo._id);
  };

  const holdHandlers = isHoldTask
    ? {
        onMouseDown: startHold,
        onMouseUp: () => setIsHolding(false),
        onTouchStart: startHold,
        onTouchEnd: () => setIsHolding(false),
      }
    : {};

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={todo.completed}
      className="group relative flex cursor-pointer select-none items-center rounded-xl border border-border bg-card p-4 transition-all hover:border-border/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      {...holdHandlers}
      onMouseLeave={() => setIsHolding(false)}
      onClick={activate}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          // Keyboard users complete in one action rather than holding.
          onToggle(todo._id);
        }
      }}
    >
      {isHoldTask && !todo.completed && (
        <div
          aria-hidden
          className="absolute inset-0 z-0 rounded-xl bg-secondary"
          style={{
            width: isHolding ? "100%" : "0%",
            transition: isHolding
              ? `width ${HOLD_DURATION_MS}ms linear`
              : "width 0.3s ease-out",
          }}
        />
      )}

      <div className="relative z-10 flex flex-1 items-center">
        {!isHoldTask && (
          <div
            aria-hidden
            className={cn(
              "mr-3 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-xl border transition-all duration-200 ease-in-out",
              todo.completed
                ? "border-primary bg-primary"
                : "border-border group-hover:border-muted-foreground",
            )}
          >
            {todo.completed && (
              <div className="h-2 w-2 rounded-[1px] bg-primary-foreground" />
            )}
          </div>
        )}

        <span
          className={cn(
            "flex flex-1 items-center justify-between gap-3 transition-colors",
            todo.completed ? "text-muted-foreground" : "text-foreground",
          )}
        >
          <span className="flex flex-col text-sm">
            <span className={cn(todo.completed && "line-through opacity-60")}>
              {todo.text}
            </span>
            {isHoldTask && todo.durationGoal > 0 && (
              <span className="mt-0.5 text-xs text-muted-foreground">
                {todo.durationGoal} mins
              </span>
            )}
          </span>

          <span className="flex items-center gap-2">
            {isRecurring && (
              <span
                className="flex items-center text-muted-foreground"
                title={RESET_LABELS[todo.recurrenceType] ?? undefined}
              >
                <Repeat2 className="h-4 w-4" strokeWidth={2} />
              </span>
            )}
            {showTally && (
              <span className="flex items-center text-xs font-normal text-orange-400">
                <Flame className="mr-1 h-3.5 w-3.5" strokeWidth={2.5} />
                {todo.completionCount}
              </span>
            )}
          </span>
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Actions for ${todo.text}`}
              onClick={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.stopPropagation()}
              onTouchStart={(event) => event.stopPropagation()}
              className="rounded-xl p-1.5 text-muted-foreground opacity-0 transition duration-200 ease-in-out hover:bg-secondary hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100"
            >
              <Ellipsis className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            onClick={(event) => event.stopPropagation()}
          >
            <DropdownMenuItem onClick={() => onEdit(todo)}>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Edit
            </DropdownMenuItem>
            {isRecurring && onPause && (
              <DropdownMenuItem onClick={() => onPause(todo._id)}>
                <PauseCircle className="mr-2 h-3.5 w-3.5" />
                Pause
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(todo)}
            >
              <Shredder className="mr-2 h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default TodoItem;
