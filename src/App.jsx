import { useState } from "react";
import TodoItem from "./components/TodoItem";
import { useTodos } from "./hooks/useTodos";
import { SignInButton, SignOutButton, useUser } from "@clerk/clerk-react";
import NewTaskModal from "./components/NewTaskModal";

function App() {
  // Get data and handlers from our Hook
  const { todos, createTodo, toggleTodo, deleteTodo } = useTodos();
  const { isLoaded, isSignedIn } = useUser();

  // Modal control
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Loading & Auth check
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex justify-center items-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex justify-center py-20 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center relative">
          {/* Sign Out Button */}
          {isSignedIn && (
            <div className="absolute top-0 right-0">
              <SignOutButton>
                <button className="text-xs text-gray-500 hover:text-red-400 transition-colors">
                  Sign Out
                </button>
              </SignOutButton>
            </div>
          )}

          <h1 className="text-4xl font-bold text-teal-400 tracking-wider">
            PROMETHEUS
          </h1>
          <p className="text-gray-400 mt-2">Bring forethought to your day.</p>
        </div>

        {/* Auth Gate and Modal Component */}
        {!isSignedIn ? (
          <div className="bg-gray-800 p-8 rounded-lg shadow-xl text-center border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-gray-200">
              Please Sign In
            </h2>
            <p className="text-gray-400 mb-6 text-sm">
              Access your personal task list securely.
            </p>
            <SignInButton mode="modal">
              <button className="bg-teal-500 hover:bg-teal-600 text-gray-900 font-bold px-8 py-3 rounded-lg transition-colors cursor-pointer">
                Sign In / Sign Up
              </button>
            </SignInButton>
          </div>
        ) : (
          <>
            {/* Modal Trigger Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full bg-teal-500 hover:bg-teal-600 text-gray-900 font-bold py-3 rounded-lg transition-colors cursor-pointer mb-8 flex items-center justify-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={3}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              New Task
            </button>

            {/* List */}
            <div className="space-y-3">
              {todos.length === 0 && (
                <p className="text-center text-gray-600 italic">
                  No tasks yet. Click 'New Task' to begin.
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

        {/* Modal Component */}
        <NewTaskModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCreate={createTodo} // Pass the handler function down
        />
      </div>
    </div>
  );
}

export default App;
