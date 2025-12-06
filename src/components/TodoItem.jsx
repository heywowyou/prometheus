import { Flame, Repeat2 } from "lucide-react";

function TodoItem({ todo, onToggle, onDelete }) {
  // Check if the tally should be displayed (if recurring AND the count is > 0)
  const showTally = todo.recurrenceType !== "none" && todo.completionCount > 0;

  // Check if the task is recurring at all (for the visual marker)
  const isRecurring = todo.recurrenceType !== "none";

  return (
    <div
      className={`group flex items-center p-4 rounded-lg border transition-all ${
        todo.completed
          ? "bg-gray-900/50 border-gray-800"
          : "bg-gray-800 border-gray-700 hover:border-gray-600"
      }`}
    >
      {/* Checkbox area */}
      <div
        onClick={() => onToggle(todo._id)}
        className={`cursor-pointer w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center transition-colors ${
          todo.completed
            ? "border-teal-500 bg-teal-500/20"
            : "border-gray-500 hover:border-teal-400"
        }`}
      >
        {todo.completed && (
          <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />
        )}
      </div>

      {/* Text and Icon/Tally Container (flex-1 and justify-between separate left and right content) */}
      <span
        onClick={() => onToggle(todo._id)}
        className={`flex-1 cursor-pointer transition-colors select-none flex items-center justify-between ${
          todo.completed ? "text-gray-500" : "text-gray-100"
        }`}
      >
        {/* LEFT SIDE: Task Text only */}
        <span className={todo.completed ? "line-through" : ""}>
          {todo.text}
        </span>

        {/* RIGHT SIDE: Metadata Icons */}
        <div className="flex items-center gap-3">
          {/* Recurrence Icon */}
          {isRecurring && (
            <Repeat2
              className={`w-4 h-4 transition-colors ${
                todo.completed ? "text-gray-500" : "text-teal-400"
              }`}
              strokeWidth={2}
            />
          )}

          {/* Tally Box */}
          {showTally && (
            <div className="flex items-center text-xs font-semibold text-orange-400 bg-gray-700/50 px-2 py-1 rounded-full">
              <Flame className="w-3.5 h-3.5 mr-1" strokeWidth={2.5} />
              {todo.completionCount}
            </div>
          )}
        </div>
      </span>

      {/* Delete button */}
      <button
        onClick={() => onDelete(todo)}
        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all p-2"
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
  );
}

export default TodoItem;
