import { useState, useEffect } from "react";
import TodoItem from "./components/TodoItem";

function App() {
  // Load from LocalStorage
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem("prometheus-todos");
    // If we found data, parse it. If not, return an empty array.
    return saved ? JSON.parse(saved) : [];
  });

  // Text currently being typed
  const [input, setInput] = useState("");

  // Saving for persistence
  useEffect(() => {
    localStorage.setItem("prometheus-todos", JSON.stringify(todos));
  }, [todos]);

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
          {todos.length === 0 && (
            <p className="text-center text-slate-600 italic">
              No tasks yet. Start by adding one above.
            </p>
          )}

          {todos.map((todo) => (
            <TodoItem
              key={todo.id}
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
