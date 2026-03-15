import { useState, useMemo } from "react";
import { useUser, SignInButton } from "@clerk/clerk-react";
import { useTodos } from "../hooks/useTodos";
import TodoItem from "../components/TodoItem";
import NewTaskModal from "../components/NewTaskModal";
import EditTaskModal from "../components/EditTaskModal";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import type { Todo } from "../types/todo-types";

type ActiveModal = "new" | "edit" | "delete" | null;

interface ModalState {
  type: ActiveModal;
  data: Todo | null;
}

function TodosDashboardPage() {
  const { todos, createTodo, toggleTodo, deleteTodo, updateTask } = useTodos();
  const { isLoaded, isSignedIn } = useUser();

  const [modalState, setModalState] = useState<ModalState>({
    type: null,
    data: null,
  });

  const openModal = (type: ActiveModal, data: Todo | null = null) => {
    setModalState({ type, data });
  };

  const closeModal = () => {
    setModalState({ type: null, data: null });
  };

  const activeTodos = useMemo(() => {
    return todos
      .filter((todo) => !todo.completed)
      .sort((a, b) => {
        const typeA = a.interactionType || "checkbox";
        const typeB = b.interactionType || "checkbox";

        if (typeA !== typeB) {
          return typeA.localeCompare(typeB);
        }
        return a.text.localeCompare(b.text);
      });
  }, [todos]);

  const completedTodos = useMemo(() => {
    return todos
      .filter((todo) => todo.completed)
      .sort((a, b) => {
        const typeA = a.interactionType || "checkbox";
        const typeB = b.interactionType || "checkbox";
        if (typeA !== typeB) return typeA.localeCompare(typeB);

        const dateA = new Date(a.lastCompletedAt || 0);
        const dateB = new Date(b.lastCompletedAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
  }, [todos]);

  const groupedActive = useMemo(() => {
    return {
      oneTime: activeTodos.filter((t) => t.recurrenceType === "none"),
      daily: activeTodos.filter((t) => t.recurrenceType === "daily"),
      weekly: activeTodos.filter((t) => t.recurrenceType === "weekly"),
      monthly: activeTodos.filter((t) => t.recurrenceType === "monthly"),
    };
  }, [activeTodos]);

  const handleSmartDelete = (todo: Todo) => {
    openModal("delete", todo);
  };

  const handleFinalDelete = (id: string) => {
    void deleteTodo(id);
    closeModal();
  };

  const handleEditClick = (todo: Todo) => {
    openModal("edit", todo);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-[400px] bg-gray-950 text-gray-100 flex justify-center items-center rounded-2xl">
        Loading...
      </div>
    );
  }

  if (!isSignedIn) {
    return (
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
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-cloud-400 tracking-tight">
          Dashboard
        </h2>
        <button onClick={() => openModal("new")} className="btn-primary">
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

      {todos.length === 0 && (
        <div className="text-center py-20 bg-gray-900/50 rounded-2xl border border-gray-800 border-dashed">
          <p className="text-cloud-400 mb-4">Your workspace is empty.</p>
          <button
            onClick={() => openModal("new")}
            className="text-electric hover:underline"
          >
            Create your first habit
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-10">
            {Object.keys(groupedActive).map((key) => {
              const list =
                groupedActive[key as keyof typeof groupedActive] ?? [];
              const titleMap: Record<string, string> = {
                oneTime: "Temporary",
                daily: "Daily",
                weekly: "Weekly",
                monthly: "Monthly",
              };

              return (
                <div key={key} className="task-column">
                  <div className="column-header">
                    <h3 className="text-lg font-medium text-cloud-400 capitalize tracking-wider">
                      {titleMap[key]}
                    </h3>
                    <span className="badge-count">{list.length}</span>
                  </div>

                  <div className="task-list-container flex-1">
                    {list.length === 0 ? (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-cloud-400 text-sm italic">
                          No active tasks
                        </p>
                      </div>
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

        <div className="xl:col-span-1">
          <div className="sticky top-24">
            <div className="column-header">
              <h3 className="text-lg font-medium text-cloud-400 tracking-wide">
                History
              </h3>
              <span className="badge-count">{completedTodos.length}</span>
            </div>

            <div className="task-list-container min-h-[500px] opacity-60 hover:opacity-100 transition-opacity duration-300">
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

      <NewTaskModal
        isOpen={modalState.type === "new"}
        onClose={closeModal}
        onCreate={createTodo}
      />
      <EditTaskModal
        isOpen={modalState.type === "edit"}
        onClose={closeModal}
        task={modalState.data}
        onUpdate={updateTask}
      />
      <DeleteConfirmModal
        isOpen={modalState.type === "delete"}
        onClose={closeModal}
        task={modalState.data}
        onConfirm={handleFinalDelete}
      />
    </>
  );
}

export default TodosDashboardPage;

