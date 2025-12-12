import { useState, useEffect, useRef } from "react";
import { Flame, Repeat2, Pencil } from "lucide-react";

// Helper to map recurrence type to the appropriate display number (1, 7, or 30)
const getRecurrenceNumber = (type) => {
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

function TodoItem({ todo, onToggle, onDelete, onEdit }) {
  // Check if the tally should be displayed (if recurring AND the count is > 0)
  const showTally = todo.recurrenceType !== "none" && todo.completionCount > 0;

  // Check if the task is recurring at all (for the visual marker)
  const isRecurring = todo.recurrenceType !== "none";
  const isHoldTask = todo.interactionType === "hold";

  // Hold interaction state
  const [isHolding, setIsHolding] = useState(false);
  const holdTimeoutRef = useRef(null);
  const HOLD_DURATION = 3000; // 3 seconds

  // Handle start hold (mouse down / touch start)
  const handleHoldStart = () => {
    if (!todo.completed) {
      setIsHolding(true);
    }
  };

  // Handle stop hold (mouse up / leave / touch end)
  const handleHoldEnd = () => {
    setIsHolding(false);
  };

  // Handle undo (click on completed task)
  const handleUndo = () => {
    if (todo.completed) {
      onToggle(todo._id);
    }
  };

  // Timer logic: Check for completion
  useEffect(() => {
    if (isHolding) {
      holdTimeoutRef.current = setTimeout(() => {
        onToggle(todo._id);
        setIsHolding(false);
      }, HOLD_DURATION);
    } else {
      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
    }
    return () => clearTimeout(holdTimeoutRef.current);
  }, [isHolding, onToggle, todo._id]);

  return (
    <div
      className={`group relative flex items-center bg-powder p-4 rounded-lg transition-all overflow-hidden select-none ${
        isHoldTask ? "cursor-grab active:cursor-grabbing" : ""
      }`}
      // Attach handlers to the container for hold tasks
      onMouseDown={isHoldTask ? handleHoldStart : undefined}
      onMouseUp={isHoldTask ? handleHoldEnd : undefined}
      onMouseLeave={isHoldTask ? handleHoldEnd : undefined}
      onTouchStart={isHoldTask ? handleHoldStart : undefined}
      onTouchEnd={isHoldTask ? handleHoldEnd : undefined}
      // Allow click-to-undo for completed hold tasks
      onClick={isHoldTask && todo.completed ? handleUndo : undefined}
    >
      {/* Progress fill bar (hold tasks only) */}
      {isHoldTask && !todo.completed && (
        <div
          className="absolute inset-0 bg-cyan-900/40 z-0"
          style={{
            width: isHolding ? "100%" : "0%",
            transition: isHolding
              ? `width ${HOLD_DURATION}ms linear`
              : "width 0.2s ease-out",
          }}
        />
      )}

      {/* Content wrapper (z-10 to sit on top of the fill bar) */}
      <div className="relative z-10 flex items-center flex-1">
        {/* Checkbox area (only show if not a hold task) */}
        {!isHoldTask && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onToggle(todo._id);
            }}
            className={`cursor-pointer w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center transition-colors ${
              todo.completed
                ? "border-cyan-500 bg-cyan-500/20"
                : "border-ashe hover:border-cyan-400"
            }`}
          >
            {todo.completed && (
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
            )}
          </div>
        )}

        {/* Text and Icon/Tally Container */}
        <span
          onClick={(e) => {
            if (!isHoldTask) {
              e.stopPropagation();
              onToggle(todo._id);
            }
          }}
          className={`flex-1 cursor-pointer transition-colors select-none flex items-center justify-between ${
            todo.completed ? "text-gray-500" : "text-gray-100"
          }`}
        >
          <div className="flex flex-col">
            <span className={todo.completed ? "line-through" : ""}>
              {todo.text}
            </span>
            {/* Show duration label for hold tasks */}
            {isHoldTask && todo.durationGoal > 0 && (
              <span className="text-xs text-cyan-500/80 font-medium mt-0.5">
                Target: {todo.durationGoal} mins
              </span>
            )}
          </div>

          {/* RIGHT SIDE: Metadata Icons */}
          <div className="flex items-center gap-1">
            {/* Recurrence Icon + Number */}
            {isRecurring && (
              <div
                className={`flex items-center transition-colors ${
                  todo.completed ? "text-gray-500" : "text-cyan-300"
                }`}
                title={`Resets every ${getRecurrenceNumber(
                  todo.recurrenceType
                )} days`}
              >
                <Repeat2 className="w-5 h-5 mr-1" strokeWidth={2} />
              </div>
            )}

            {/* Tally Box */}
            {showTally && (
              <div className="flex items-center text-xs font-semibold text-orange-400 bg-ashe px-2 py-1 rounded-full">
                <Flame className="w-3.5 h-3.5 mr-1" strokeWidth={2.5} />
                {todo.completionCount}
              </div>
            )}
          </div>
        </span>

        {/* Action buttons */}
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-2">
          {/* Edit button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(todo);
            }}
            className="text-gray-500 hover:text-cyan-400 transition-all p-2"
            title="Edit task"
          >
            <Pencil className="w-4 h-4" />
          </button>

          {/* Delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(todo);
            }}
            className="text-gray-500 hover:text-red-400 transition-all p-2 pl-1"
            title="Delete task"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default TodoItem;
