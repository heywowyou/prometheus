function TodoItem({ todo, onToggle, onDelete }) {
  return (
    <div
      className={`group flex items-center p-4 rounded-lg border transition-all ${
        todo.completed
          ? "bg-slate-900/50 border-slate-800"
          : "bg-slate-800 border-slate-700 hover:border-slate-600"
      }`}
    >
      {/* Checkbox area */}
      <div
        onClick={() => onToggle(todo._id)}
        className={`cursor-pointer w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center transition-colors ${
          todo.completed
            ? "border-emerald-500 bg-emerald-500/20"
            : "border-slate-500 hover:border-emerald-400"
        }`}
      >
        {todo.completed && (
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
        )}
      </div>

      {/* Text */}
      <span
        onClick={() => onToggle(todo._id)}
        className={`flex-1 cursor-pointer transition-colors select-none ${
          todo.completed ? "line-through text-slate-500" : "text-slate-100"
        }`}
      >
        {todo.text}
      </span>

      {/* Delete button */}
      <button
        onClick={() => onDelete(todo._id)}
        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all p-2"
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
