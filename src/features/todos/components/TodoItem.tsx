import { useState, useEffect, useRef } from "react";
import { Flame, Repeat2, Pencil, Shredder, Ellipsis } from "lucide-react";
import type { Todo, RecurrenceType } from "../types/todo-types";

const getRecurrenceNumber = (type: RecurrenceType): number | null => {
  switch (type) {
    case "daily":
      return 1;
    case "weekly":
      return 7;
    case "monthly":
      return 30;
    default:
      return null;
  }
};

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (todo: Todo) => void;
  onEdit: (todo: Todo) => void;
}

function TodoItem({ todo, onToggle, onDelete, onEdit }: TodoItemProps) {
  const showTally = todo.recurrenceType !== "none" && todo.completionCount > 0;
  const isRecurring = todo.recurrenceType !== "none";
  const isHoldTask = todo.interactionType === "hold";

  const [isHolding, setIsHolding] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const HOLD_DURATION = 1000;

  const handleHoldStart = () => {
    if (!todo.completed) setIsHolding(true);
  };

  const handleHoldEnd = () => {
    setIsHolding(false);
  };

  const handleCardMouseLeave = () => {
    if (isHoldTask) setIsHolding(false);
    if (isMenuOpen) setIsMenuOpen(false);
  };

  const handleCardClick = () => {
    if (isHoldTask) {
      if (todo.completed) {
        onToggle(todo._id);
      }
    } else {
      onToggle(todo._id);
    }
  };

  useEffect(() => {
    if (isHolding) {
      holdTimeoutRef.current = setTimeout(() => {
        onToggle(todo._id);
        setIsHolding(false);
      }, HOLD_DURATION);
    } else if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }

    return () => {
      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current);
      }
    };
  }, [isHolding, onToggle, todo._id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        menuRef.current &&
        event.target instanceof Node &&
        !menuRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <div
      className={`group relative flex items-center bg-card border border-border p-4 rounded-xl transition-all select-none cursor-pointer hover:border-border/80 ${
        isMenuOpen ? "z-20" : "z-auto"
      }`}
      onMouseDown={isHoldTask ? handleHoldStart : undefined}
      onMouseUp={isHoldTask ? handleHoldEnd : undefined}
      onMouseLeave={handleCardMouseLeave}
      onTouchStart={isHoldTask ? handleHoldStart : undefined}
      onTouchEnd={isHoldTask ? handleHoldEnd : undefined}
      onClick={handleCardClick}
    >
      {isHoldTask && !todo.completed && (
        <div
          className="absolute inset-0 bg-secondary z-0 rounded-xl"
          style={{
            width: isHolding ? "100%" : "0%",
            transition: isHolding
              ? `width ${HOLD_DURATION}ms linear`
              : "width 0.3s ease-out",
          }}
        />
      )}

      <div className="relative z-10 flex items-center flex-1">
        {!isHoldTask && (
          <div
            className={`w-4 h-4 rounded-xl border mr-3 flex items-center justify-center transition-all duration-200 ease-in-out flex-shrink-0 ${
              todo.completed
                ? "border-primary bg-primary"
                : "border-border group-hover:border-muted-foreground"
            }`}
          >
            {todo.completed && (
              <div className="w-2 h-2 rounded-[1px] bg-primary-foreground" />
            )}
          </div>
        )}

        <span
          className={`flex-1 transition-colors flex items-center justify-between gap-3 ${
            todo.completed ? "text-muted-foreground" : "text-foreground"
          }`}
        >
          <div className="flex flex-col text-sm">
            <span className={todo.completed ? "line-through opacity-60" : ""}>
              {todo.text}
            </span>
            {isHoldTask && todo.durationGoal > 0 && (
              <span className="text-xs text-muted-foreground mt-0.5">
                {todo.durationGoal} mins
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isRecurring && (
              <div
                className="flex items-center text-muted-foreground"
                title={`Resets every ${getRecurrenceNumber(todo.recurrenceType)} days`}
              >
                <Repeat2 className="w-4 h-4" strokeWidth={2} />
              </div>
            )}
            {showTally && (
              <div className="flex items-center text-xs font-normal text-orange-400">
                <Flame className="w-3.5 h-3.5 mr-1" strokeWidth={2.5} />
                {todo.completionCount}
              </div>
            )}
          </div>
        </span>

        <div className="relative" ref={menuRef}>
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className={`text-muted-foreground hover:text-foreground transition duration-200 ease-in-out p-1.5 rounded-xl hover:bg-secondary ${
              isMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
            title="More options"
          >
            <Ellipsis className="w-4 h-4" strokeWidth={1.5} />
          </button>

          {isMenuOpen && (
            <div
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className="absolute right-0 top-full mt-1 w-32 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(todo);
                  setIsMenuOpen(false);
                }}
                className="flex items-center w-full px-3 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5 mr-2" />
                Edit
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(todo);
                  setIsMenuOpen(false);
                }}
                className="flex items-center w-full px-3 py-2.5 text-sm text-red-400 hover:bg-destructive/20 transition-colors cursor-pointer"
              >
                <Shredder className="w-3.5 h-3.5 mr-2" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TodoItem;
