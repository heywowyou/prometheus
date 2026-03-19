import { useState, useMemo } from "react";
import { Plus, CheckSquare, ChevronDown, PlayCircle } from "lucide-react";
import { useTodos, usePausedTodos } from "../hooks/useTodos";
import AuthGuard from "../../../components/AuthGuard";
import TodoItem from "../components/TodoItem";
import NewTaskModal from "../components/NewTaskModal";
import EditTaskModal from "../components/EditTaskModal";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import type { Todo } from "../types/todo-types";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../../components/ui/collapsible";

type ActiveModal = "new" | "edit" | "delete" | null;

interface ModalState {
  type: ActiveModal;
  data: Todo | null;
}

function TodosDashboardPage() {
  const { todos, createTodo, toggleTodo, deleteTodo, updateTask, pauseTodo, refetch: refetchActive } = useTodos();
  const { pausedTodos, resumeTodo, refetch: refetchPaused } = usePausedTodos();
  const [pausedOpen, setPausedOpen] = useState(false);

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

  const handlePause = (id: string) => {
    void pauseTodo(id);
    void refetchPaused();
  };

  const handleResume = (id: string) => {
    void resumeTodo(id);
    void refetchActive();
  };

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

  return (
    <AuthGuard description="Sign in to access your synchronized task list.">
      <>
        <div className="flex items-center justify-between mb-8">
          <h2 className="page-title">Dashboard</h2>
          <Button onClick={() => openModal("new")}>
            <Plus className="w-4 h-4" />
            New Task
          </Button>
        </div>

        {todos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 border border-dashed border-border rounded-xl text-center gap-4">
            <CheckSquare className="w-10 h-10 text-muted-foreground opacity-40" />
            <p className="text-muted-foreground text-sm">Your workspace is empty.</p>
            <Button variant="outline" size="sm" onClick={() => openModal("new")}>
              Create your first task
            </Button>
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
                  <div key={key} className="flex flex-col">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                        {titleMap[key]}
                      </h3>
                      <Badge variant="outline" className="text-muted-foreground">
                        {list.length}
                      </Badge>
                    </div>

                    <div className="flex flex-col space-y-2 min-h-[200px]">
                      {list.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                          <p className="text-muted-foreground text-sm italic">
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
                            onPause={handlePause}
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
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                  History
                </h3>
                <Badge variant="outline" className="text-muted-foreground">
                  {completedTodos.length}
                </Badge>
              </div>

              <div className="flex flex-col space-y-2 min-h-[500px] opacity-60 hover:opacity-100 transition-opacity duration-300">
                {completedTodos.length === 0 ? (
                  <p className="text-muted-foreground text-sm italic">
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

        {pausedTodos.length > 0 && (
          <Collapsible
            open={pausedOpen}
            onOpenChange={setPausedOpen}
            className="mt-10"
          >
            <CollapsibleTrigger className="flex items-center gap-2 w-full px-1 group">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Paused
              </h3>
              <Badge variant="outline" className="text-muted-foreground">
                {pausedTodos.length}
              </Badge>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground ml-auto transition-transform duration-200 ${
                  pausedOpen ? "rotate-180" : ""
                }`}
              />
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-3">
              <div className="flex flex-col space-y-2">
                {pausedTodos.map((todo) => (
                  <div
                    key={todo._id}
                    className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3 opacity-60"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-sm text-foreground truncate">
                        {todo.text}
                      </span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {todo.recurrenceType}
                        {todo.pausedAt && (
                          <>
                            {" · paused "}
                            {new Date(todo.pausedAt).toLocaleDateString()}
                          </>
                        )}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleResume(todo._id)}
                      className="flex items-center gap-1.5 ml-4 flex-shrink-0 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      Resume
                    </button>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

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
    </AuthGuard>
  );
}

export default TodosDashboardPage;
