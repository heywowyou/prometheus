import { useState } from "react";
import TodoItem from "./components/TodoItem";
import { useTodos } from "./hooks/useTodos";
import { useUser, SignInButton } from "@clerk/clerk-react";
import NewTaskModal from "./components/NewTaskModal";
import DeleteConfirmModal from "./components/DeleteConfirmModal";
import EditTaskModal from "./components/EditTaskModal";
import Header from "./components/Header";

function App() {
  const { todos, createTodo, toggleTodo, deleteTodo, updateTask } = useTodos();
  const { isLoaded, isSignedIn } = useUser();

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Edit state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  const handleSmartDelete = (todo) => {
    setTaskToDelete(todo);
    setIsDeleteConfirmOpen(true);
  };

  const handleFinalDelete = (id) => {
    deleteTodo(id);
    setIsDeleteConfirmOpen(false);
    setTaskToDelete(null);
  };

  // Handler for opening the edit modal
  const handleEditClick = (todo) => {
    setTaskToEdit(todo);
    setIsEditModalOpen(true);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex justify-center items-center">
        Loading...
      </div>
    );
  }

  // Filtering Logic
  const activeTodos = todos.filter((todo) => !todo.completed);
  const completedTodos = todos
    .filter((todo) => todo.completed)
    .slice()
    .sort(
      (a, b) =>
        new Date(b.lastCompletedAt || 0) - new Date(a.lastCompletedAt || 0)
    );

  // Group active todos
  const groupedActive = {
    oneTime: activeTodos.filter((t) => t.recurrenceType === "none"),
    daily: activeTodos.filter((t) => t.recurrenceType === "daily"),
    weekly: activeTodos.filter((t) => t.recurrenceType === "weekly"),
    monthly: activeTodos.filter((t) => t.recurrenceType === "monthly"),
  };

  return (
    <div className="min-h-screen bg-powder-900 text-gray-100 font-sans">
      {/* 1. Permanent Header */}
      <Header />

      {/* 2. Main Content Container */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {!isSignedIn ? (
          // --- GUEST VIEW ---
          <div className="flex flex-col items-center justify-center mt-20 text-center space-y-6">
            <div className="bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-800 max-w-md w-full">
              <h2 className="text-2xl font-bold text-gray-100 mb-3">
                Welcome Back
              </h2>
              <p className="text-gray-400 mb-8">
                Sign in to access your synchronized task list.
              </p>
              <SignInButton mode="modal">
                <button className="w-full py-3 px-4 bg-cyan-500 hover:bg-cyan-400 text-gray-900 font-bold rounded-lg transition-all transform hover:scale-[1.02] shadow-lg shadow-cyan-500/20">
                  Sign In to Continue
                </button>
              </SignInButton>
            </div>
          </div>
        ) : (
          // User Dashboard
          <>
            {/* Action Bar (Top of Dashboard) */}
            <div className="flex items-center justify-between mb-8 bg-ashe rounded-xl p-6">
              <h2 className="text-2xl font-semibold text-gray-100">My Tasks</h2>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-gray-900 font-bold px-5 py-2.5 rounded-lg transition-colors shadow-lg shadow-cyan-500/10"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
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
            </div>

            {/* Empty State */}
            {todos.length === 0 && (
              <div className="text-center py-20 bg-gray-900/50 rounded-2xl border border-gray-800 border-dashed">
                <p className="text-gray-500 mb-4">Your workspace is empty.</p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="text-cyan-400 hover:underline"
                >
                  Create your first habit
                </button>
              </div>
            )}

            {/* Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Left column: Active Tasks (Takes 2/3 width) */}
              <div className="xl:col-span-2 space-y-6">
                {/* 2x2 Grid for the Task Categories */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.keys(groupedActive).map((key) => {
                    const list = groupedActive[key];
                    const titleMap = {
                      oneTime: "Temporary",
                      daily: "Daily",
                      weekly: "Weekly",
                      monthly: "Monthly",
                    };

                    // Even if the list is empty, we render the box so the grid stays stable
                    return (
                      <div
                        key={key}
                        className="bg-ashe rounded-xl p-6 min-h-[200px] flex flex-col"
                      >
                        <h3 className="text-sm font-bold text-cloud-400 capitalize tracking-wider mb-4 border-b border-cloud-400 pb-2 flex justify-between">
                          {titleMap[key]}
                          <span className="text-cloud-400 ml-1 font-normal">
                            ({list.length})
                          </span>
                        </h3>

                        <div className="space-y-3 flex-1">
                          {list.length === 0 ? (
                            <p className="text-gray-600 text-sm italic mt-4">
                              No active tasks
                            </p>
                          ) : (
                            list.map((todo) => (
                              <TodoItem
                                key={todo._id}
                                todo={todo}
                                onToggle={toggleTodo}
                                onDelete={handleSmartDelete}
                                onEdit={handleEditClick}
                              />
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right column: Completed (Takes 1/3 width) */}
              <div className="xl:col-span-1">
                <div className="bg-ashe rounded-xl p-6 sticky top-24">
                  <h3 className="text-sm font-bold text-cloud-500 capitalize tracking-wider mb-4 border-b border-cloud-500 pb-2">
                    History
                    <span className="text-cloud-500 ml-1 font-normal">
                      ({completedTodos.length})
                    </span>
                  </h3>
                  <div className="space-y-3 opacity-60 hover:opacity-100 transition-opacity duration-300">
                    {completedTodos.length === 0 ? (
                      <p className="text-gray-600 text-sm italic">
                        No completed tasks yet.
                      </p>
                    ) : (
                      completedTodos.map((todo) => (
                        <TodoItem
                          key={todo._id}
                          todo={todo}
                          onToggle={toggleTodo}
                          onDelete={handleSmartDelete}
                          onEdit={handleEditClick}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Modals */}
        <NewTaskModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCreate={createTodo}
        />
        <EditTaskModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          task={taskToEdit}
          onUpdate={updateTask}
        />
        <DeleteConfirmModal
          isOpen={isDeleteConfirmOpen}
          onClose={() => setIsDeleteConfirmOpen(false)}
          task={taskToDelete}
          onConfirm={handleFinalDelete}
        />
      </main>
    </div>
  );
}

export default App;
