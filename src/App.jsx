import { useState } from "react";
import TodoItem from "./components/TodoItem";
import { useTodos } from "./hooks/useTodos";
import { SignInButton, SignOutButton, useUser } from "@clerk/clerk-react";
import NewTaskModal from "./components/NewTaskModal";
import DeleteConfirmModal from "./components/DeleteConfirmModal";

function App() {
  // Get data and handlers from our Hook
  const { todos, createTodo, toggleTodo, deleteTodo } = useTodos();
  const { isLoaded, isSignedIn } = useUser();

  // Modal control
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Delete Confirmation State
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  // Holds the task object being considered for deletion
  const [taskToDelete, setTaskToDelete] = useState(null);

  const handleSmartDelete = (todo) => {
    setTaskToDelete(todo);
    setIsDeleteConfirmOpen(true);
  };

  // Final deletion handler, called from the confirmation modal
  const handleFinalDelete = (id) => {
    deleteTodo(id);
    setIsDeleteConfirmOpen(false);
    setTaskToDelete(null); // Clear the reference
  };

  // Loading & Auth check
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex justify-center items-center">
        Loading...
      </div>
    );
  }

  // Task Filtering and Sorting
  // Separate the tasks into two groups for the side-by-side display
  const activeTodos = todos
    .filter((todo) => !todo.completed)
    .slice()
    .sort((a, b) => a._id.localeCompare(b._id)); // Sort by creation time (oldest first)

  const completedTodos = todos
    .filter((todo) => todo.completed)
    .slice()
    // Sort by most recent completion first (descending completion date)
    .sort((a, b) => {
      const dateA = new Date(a.lastCompletedAt || 0);
      const dateB = new Date(b.lastCompletedAt || 0);
      return dateB - dateA; // Newest first
    });

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex justify-center py-12 px-6">
      <div className="w-full max-w-4xl">
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

            {/* TWO COLUMN GRID LAYOUT */}
            {todos.length === 0 && (
              <p className="text-center text-gray-600 italic">
                No tasks yet. Click 'New Task' to begin.
              </p>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
              {/* COLUMN 1: ACTIVE TASKS */}
              <div>
                <h2 className="text-2xl font-semibold text-teal-400 mb-4 border-b border-teal-800 pb-2">
                  Active ({activeTodos.length})
                </h2>
                <div className="space-y-3">
                  {activeTodos.map((todo) => (
                    <TodoItem
                      key={todo._id}
                      todo={todo}
                      onToggle={toggleTodo}
                      onDelete={handleSmartDelete}
                    />
                  ))}
                </div>
              </div>

              {/* COLUMN 2: COMPLETED TASKS */}
              <div>
                <h2 className="text-2xl font-semibold text-gray-500 mb-4 border-b border-gray-700 pb-2">
                  Completed ({completedTodos.length})
                </h2>
                <div className="space-y-3">
                  {completedTodos.map((todo) => (
                    <TodoItem
                      key={todo._id}
                      todo={todo}
                      onToggle={toggleTodo}
                      onDelete={handleSmartDelete}
                    />
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Task Creation Modal */}
        <NewTaskModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCreate={createTodo} // Pass the handler function down
        />
        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal
          isOpen={isDeleteConfirmOpen}
          onClose={() => setIsDeleteConfirmOpen(false)}
          task={taskToDelete}
          onConfirm={handleFinalDelete}
        />
      </div>
    </div>
  );
}

export default App;
