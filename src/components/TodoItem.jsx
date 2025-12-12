import { useState, useEffect, useRef } from "react";
import { Flame, Repeat2, Pencil, Shredder, CircleEllipsis } from "lucide-react";

// Helper to map recurrence type to the appropriate display number
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
  const showTally = todo.recurrenceType !== "none" && todo.completionCount > 0;
  const isRecurring = todo.recurrenceType !== "none";
  const isHoldTask = todo.interactionType === "hold";

  // State
  const [isHolding, setIsHolding] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Refs
  const holdTimeoutRef = useRef(null);
  const menuRef = useRef(null);

  // Constants
  const HOLD_DURATION = 2000;

  // --- HANDLERS ---
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

  // --- EFFECTS ---
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
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

  // --- RENDER ---
  return (
    <div
      className={`group relative flex items-center bg-powder p-4 rounded-lg transition-all select-none cursor-pointer ${
        isMenuOpen ? "z-20" : "z-auto"
      }`}
      onMouseDown={isHoldTask ? handleHoldStart : undefined}
      onMouseUp={isHoldTask ? handleHoldEnd : undefined}
      onMouseLeave={handleCardMouseLeave}
      onTouchStart={isHoldTask ? handleHoldStart : undefined}
      onTouchEnd={isHoldTask ? handleHoldEnd : undefined}
      onClick={handleCardClick}
    >
      {/* Progress fill bar */}
      {isHoldTask && !todo.completed && (
        <div
          className="absolute inset-0 bg-cyan-900/40 z-0 rounded-lg"
          style={{
            width: isHolding ? "100%" : "0%",
            transition: isHolding
              ? `width ${HOLD_DURATION}ms linear`
              : "width 0.2s ease-out",
          }}
        />
      )}

      {/* Content wrapper */}
      <div className="relative z-10 flex items-center flex-1">
        {/* Checkbox (Non-Hold Tasks) */}
        {!isHoldTask && (
          <div
            className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center transition-colors ${
              todo.completed
                ? "border-cyan-500 bg-cyan-500/20"
                : "border-ashe group-hover:border-cyan-400"
            }`}
          >
            {todo.completed && (
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
            )}
          </div>
        )}

        {/* Text Content */}
        <span
          className={`flex-1 transition-colors flex items-center justify-between ${
            todo.completed ? "text-gray-500" : "text-gray-100"
          }`}
        >
          <div className="flex flex-col">
            <span className={todo.completed ? "line-through" : ""}>
              {todo.text}
            </span>
            {isHoldTask && todo.durationGoal > 0 && (
              <span className="text-xs text-cyan-500/80 font-medium mt-0.5">
                Target: {todo.durationGoal} mins
              </span>
            )}
          </div>

          {/* Metadata Icons */}
          <div className="flex items-center gap-1">
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
            {showTally && (
              <div className="flex items-center text-xs font-semibold text-orange-400 bg-ashe px-2 py-1 rounded-full">
                <Flame className="w-3.5 h-3.5 mr-1" strokeWidth={2.5} />
                {todo.completionCount}
              </div>
            )}
          </div>
        </span>

        {/* --- MENU SECTION --- */}
        <div className="relative ml-2" ref={menuRef}>
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className={`text-gray-500 hover:text-gray-400 transition-all p-2 ${
              isMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
            title="More options"
          >
            <CircleEllipsis className="w-5 h-5" />
          </button>

          {isMenuOpen && (
            <div
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className="absolute right-0 top-full mt-1 w-32 bg-ashe border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(todo);
                  setIsMenuOpen(false);
                }}
                className="flex items-center w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors cursor-pointer"
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(todo);
                  setIsMenuOpen(false);
                }}
                className="flex items-center w-full px-3 py-2 text-sm text-red-400 hover:bg-red-900/40 transition-colors cursor-pointer"
              >
                <Shredder className="w-4 h-4 mr-2" />
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
