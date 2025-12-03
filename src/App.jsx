import { useState } from "react";
import TodoItem from "./components/TodoItem";
import { useTodos } from "./hooks/useTodos";
import { SignInButton, SignOutButton, useUser } from "@clerk/clerk-react";

function App() {
  // Get data and handlers from our Hook
  const { todos, createTodo, toggleTodo, deleteTodo } = useTodos();

  // isLoaded: Checks if Clerk's script has finished loading.
  // isSignedIn: Checks if a user session exists.
  const { isLoaded, isSignedIn } = useUser();

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

  // Loading & Auth check
  if (!isLoaded) {
    // If Clerk is still loading the session, display a loading screen
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex justify-center items-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex justify-center py-20 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center relative">
          {/* Sign Out Button (Only shows when signed in) */}
          {isSignedIn && (
            <div className="absolute top-0 right-0">
              <SignOutButton>
                <button className="text-xs text-slate-500 hover:text-red-400 transition-colors">
                  Sign Out
                </button>
              </SignOutButton>
            </div>
          )}

          <h1 className="text-4xl font-bold text-emerald-400 tracking-wider">
            PROMETHEUS
          </h1>
          <p className="text-slate-400 mt-2">Bring forethought to your day.</p>
        </div>

        {/* Auth gate */}
        {!isSignedIn ? (
          // State A: User is NOT signed in
          <div className="bg-slate-800 p-8 rounded-lg shadow-xl text-center border border-slate-700">
            <h2 className="text-xl font-semibold mb-4 text-slate-200">
              Please Sign In
            </h2>
            <p className="text-slate-400 mb-6 text-sm">
              Access your personal task list securely.
            </p>
            <SignInButton mode="modal">
              <button className="bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold px-8 py-3 rounded-lg transition-colors cursor-pointer">
                Sign In / Sign Up
              </button>
            </SignInButton>
          </div>
        ) : (
          // State B: User IS signed in (Render the App)
          <>
            {/* Input form */}
            <div className="flex gap-2 mb-8">
              <input
                type="text"
                placeholder="What needs to be done?"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors text-slate-100"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
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
          </>
        )}
      </div>
    </div>
  );
}

export default App;
