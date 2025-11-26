import { useState } from "react";

function App() {
  // List of tasks
  const [todos, setTodos] = useState([
    { id: 1, text: "Initialize Prometheus Project", completed: true },
    { id: 2, text: "Design the UI Skeleton", completed: false },
    { id: 3, text: "Wire up the Add button", completed: false },
  ]);

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

        {/* List */}
        <div className="space-y-3">
          {todos.map((todo) => (
            <div
              key={todo.id}
              className={`flex items-center p-4 rounded-lg border ${
                todo.completed
                  ? "bg-slate-900 border-slate-800 opacity-50"
                  : "bg-slate-800 border-slate-700"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center ${
                  todo.completed
                    ? "border-emerald-500 bg-emerald-500/20"
                    : "border-slate-500"
                }`}
              >
                {todo.completed && (
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                )}
              </div>
              <span
                className={todo.completed ? "line-through text-slate-500" : ""}
              >
                {todo.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
