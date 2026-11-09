import { useState } from "react";
import { Plus, CheckSquare, ChevronDown, PlayCircle } from "lucide-react";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@components/ui/collapsible";
import EmptyState from "@components/feedback/EmptyState";
import { cn } from "@lib/utils";
import { useTodos, usePausedTodos, useGroupedTodos } from "../hooks/useTodos";
import TodoItem from "../components/TodoItem";
import TaskModal from "../components/TaskModal";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import { RECURRENCE_GROUPS, type Todo } from "../types/todo-types";

type ModalState =
  | { type: "none" }
  | { type: "new" }
  | { type: "edit"; task: Todo }
  | { type: "delete"; task: Todo };

function SectionHeading({ label, count }: { label: string; count: number }) {
  return (
    <div className="mb-3 flex items-center justify-between px-1">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
        {label}
      </h3>
      <Badge variant="outline" className="text-muted-foreground">
        {count}
      </Badge>
    </div>
  );
}

function TodosDashboardPage() {
  const {
    todos,
    loading,
    createTodo,
    updateTodo,
    toggleTodo,
    pauseTodo,
    deleteTodo,
  } = useTodos();
  const { pausedTodos, resumeTodo } = usePausedTodos();
  const { active, completed } = useGroupedTodos(todos);

  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const [pausedOpen, setPausedOpen] = useState(false);

  const closeModal = () => setModal({ type: "none" });
  const openEdit = (task: Todo) => setModal({ type: "edit", task });
  const openDelete = (task: Todo) => setModal({ type: "delete", task });

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="page-title">Dashboard</h2>
          {!loading && todos.length > 0 && (
            <p className="mt-1 text-sm text-muted-foreground">
              {active.length} open · {completed.length} done
            </p>
          )}
        </div>
        <Button onClick={() => setModal({ type: "new" })}>
          <Plus className="h-4 w-4" />
          New task
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
          <div className="space-y-10 xl:col-span-2">
            <div className="grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2">
              {RECURRENCE_GROUPS.map((group) => (
                <div key={group.key} className="flex flex-col gap-3">
                  <div className="h-5 w-24 animate-pulse rounded-md bg-card" />
                  <div className="h-14 animate-pulse rounded-xl bg-card" />
                  <div className="h-14 animate-pulse rounded-xl bg-card opacity-70" />
                  <div className="h-14 animate-pulse rounded-xl bg-card opacity-40" />
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3 xl:col-span-1">
            <div className="h-5 w-20 animate-pulse rounded-md bg-card" />
            <div className="h-14 animate-pulse rounded-xl bg-card" />
            <div className="h-14 animate-pulse rounded-xl bg-card opacity-70" />
            <div className="h-14 animate-pulse rounded-xl bg-card opacity-40" />
          </div>
        </div>
      ) : todos.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          message="Your workspace is empty."
          action={{
            label: "Create your first task",
            onClick: () => setModal({ type: "new" }),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
          <div className="space-y-10 xl:col-span-2">
            <div className="grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2">
              {RECURRENCE_GROUPS.map((group) => {
                const items = active.filter(
                  (todo) => todo.recurrenceType === group.key,
                );

                return (
                  <div key={group.key} className="flex flex-col">
                    <SectionHeading label={group.label} count={items.length} />
                    <div className="flex min-h-[200px] flex-col space-y-2">
                      {items.length === 0 ? (
                        <div className="flex h-full items-center justify-center">
                          <p className="text-sm italic text-muted-foreground">
                            No active tasks
                          </p>
                        </div>
                      ) : (
                        items.map((todo) => (
                          <TodoItem
                            key={todo._id}
                            todo={todo}
                            onToggle={toggleTodo}
                            onEdit={openEdit}
                            onDelete={openDelete}
                            onPause={pauseTodo}
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
              <SectionHeading label="History" count={completed.length} />
              <div className="flex min-h-[500px] flex-col space-y-2 opacity-60 transition-opacity duration-300 hover:opacity-100">
                {completed.length === 0 ? (
                  <p className="text-sm italic text-muted-foreground">
                    No completed tasks yet.
                  </p>
                ) : (
                  completed.map((todo) => (
                    <TodoItem
                      key={todo._id}
                      todo={todo}
                      onToggle={toggleTodo}
                      onEdit={openEdit}
                      onDelete={openDelete}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {pausedTodos.length > 0 && (
        <Collapsible
          open={pausedOpen}
          onOpenChange={setPausedOpen}
          className="mt-10"
        >
          <CollapsibleTrigger className="group flex w-full items-center gap-2 px-1">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Paused
            </h3>
            <Badge variant="outline" className="text-muted-foreground">
              {pausedTodos.length}
            </Badge>
            <ChevronDown
              className={cn(
                "ml-auto h-4 w-4 text-muted-foreground transition-transform duration-200",
                pausedOpen && "rotate-180",
              )}
            />
          </CollapsibleTrigger>

          <CollapsibleContent className="mt-3 overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
            <div className="flex flex-col space-y-2">
              {pausedTodos.map((todo) => (
                <div
                  key={todo._id}
                  className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 opacity-60"
                >
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-sm text-foreground">
                      {todo.text}
                    </span>
                    <span className="text-xs capitalize text-muted-foreground">
                      {todo.recurrenceType}
                      {todo.pausedAt &&
                        ` · paused ${new Date(todo.pausedAt).toLocaleDateString()}`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => resumeTodo(todo._id)}
                    className="ml-4 flex flex-shrink-0 items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <PlayCircle className="h-3.5 w-3.5" />
                    Resume
                  </button>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      <TaskModal
        isOpen={modal.type === "new"}
        onClose={closeModal}
        onSubmit={createTodo}
      />
      <TaskModal
        isOpen={modal.type === "edit"}
        onClose={closeModal}
        task={modal.type === "edit" ? modal.task : null}
        onSubmit={(values) =>
          modal.type === "edit"
            ? updateTodo(modal.task._id, values)
            : Promise.resolve()
        }
      />
      <DeleteConfirmModal
        isOpen={modal.type === "delete"}
        onClose={closeModal}
        task={modal.type === "delete" ? modal.task : null}
        onConfirm={(id) => {
          deleteTodo(id);
          closeModal();
        }}
      />
    </>
  );
}

export default TodosDashboardPage;
