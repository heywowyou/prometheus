import { useState } from "react";

function App() {
  // Load from LocalStorage if available, otherwise use defaults
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem("prometheus-todos");
    if (saved) {
      return JSON.parse(saved);
    } else {
      return [
        { id: 1, text: "Initialize Prometheus Project", completed: true },
        { id: 2, text: "Design the UI Skeleton", completed: true },
        { id: 3, text: "Wire up the Add button", completed: true },
        { id: 4, text: "Implement LocalStorage Persistence", completed: false },
      ];
    }
  });

  // Text currently being typed
  const [input, setInput] = useState("");

  // Add a new task
  const addTodo = () => {
    if (!input.trim()) return;

    const newTodo = {
      id: Date.now(),
      text: input,
      completed: false,
    };

    // Create a brand new array with the old items + the new one
    setTodos([...todos, newTodo]);

    // Clear the input field
    setInput("");
  };

  // Toggle the completed state
  const toggleTodo = (id) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  // Delete a task
  const deleteTodo = (id) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  // Allow adding by pressing "Enter"
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      addTodo();
    }
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
            onClick={addTodo}
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold px-6 py-3 rounded-lg transition-colors cursor-pointer"
          >
            Add
          </button>
        </div>

        {/* LIST */}
        <div className="space-y-3">
          {todos.map((todo) => (
            <div
              key={todo.id}
              className={`group flex items-center p-4 rounded-lg border transition-all ${
                todo.completed
                  ? "bg-slate-900/50 border-slate-800"
                  : "bg-slate-800 border-slate-700 hover:border-slate-600"
              }`}
            >
              {/* Checkbox area */}
              <div
                onClick={() => toggleTodo(todo.id)} // Trigger Toggle
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
                onClick={() => toggleTodo(todo.id)} // Trigger Toggle
                className={`flex-1 cursor-pointer transition-colors ${
                  todo.completed
                    ? "line-through text-slate-500"
                    : "text-slate-100"
                }`}
              >
                {todo.text}
              </span>

              {/* Delete button */}
              <button
                onClick={() => deleteTodo(todo.id)} // Trigger Delete
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
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
