import { useState } from "react";
import TodoItem from "./components/TodoItem";
import { useTodos } from "./hooks/useTodos";

function App() {
  // Get data and handlers from our Hook
  const { todos, createTodo, toggleTodo, deleteTodo } = useTodos();

  // Input handling
  const [input, setInput] = useState("");

  const handleAdd = () => {
    createTodo(input);
    setInput("");
  };

  // Allow adding by pressing "Enter"
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleAdd();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex justify-center py-20 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-emerald-400 tracking-tight">
            PROMETHEUS
          </h1>
          <p className="text-slate-400 mt-2">Bring forethought to your day.</p>
        </div>

        {/* Input form */}
        <div className="flex gap-2 mb-8">
          <input
            type="text"
            placeholder="What needs to be done?"
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors"
            // Show what's in React State
            value={input}
            // Update state when user types
            onChange={(e) => setInput(e.target.value)}
            // Add on Enter key
            onKeyDown={handleKeyDown}
          />
          <button
            // Run the function on click
            onClick={handleAdd}
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold px-6 py-3 rounded-lg transition-colors cursor-pointer"
          >
            Add
          </button>
        </div>

        {/* List */}
        <div className="space-y-3">
          {todos.length === 0 && (
            <p className="text-center text-slate-600 italic">
              No tasks yet. Start by adding one above.
            </p>
          )}

          {todos.map((todo) => (
            <TodoItem
              key={todo._id}
              todo={todo}
              onToggle={toggleTodo}
              onDelete={deleteTodo}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
