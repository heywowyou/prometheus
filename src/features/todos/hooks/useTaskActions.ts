import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { TaskActions } from "../components/tasks/TaskDetail";
import type { RowContext } from "../components/tasks/TaskRow";
import type { useTaskData } from "./useTaskData";

type TaskData = ReturnType<typeof useTaskData>;

/** Row actions and context shared by every task list. */
export const useRowContext = (
  data: TaskData,
  options: { showWhen?: boolean; showList?: boolean } = {},
): RowContext => {
  const navigate = useNavigate();
  const { toggleTodo, updateTodo, deleteTodo, duplicateTodo, convertTodo, areas, projects, index } = data;

  const actions = useMemo<TaskActions>(
    () => ({
      toggle: toggleTodo,
      update: (id, payload) => updateTodo(id, payload),
      remove: (todo) => {
        deleteTodo(todo._id);
        toast(`Deleted “${todo.text}”`, {
          action: { label: "Undo", onClick: () => void duplicateTodo(todo) },
        });
      },
      duplicate: (todo) => void duplicateTodo(todo),
      convertToHabit: (todo) => {
        void convertTodo(todo._id, "habit").then(() =>
          toast(`“${todo.text}” is now a habit`, {
            action: { label: "Open Habits", onClick: () => navigate("/habits") },
          }),
        );
      },
    }),
    [toggleTodo, updateTodo, deleteTodo, duplicateTodo, convertTodo, navigate],
  );

  return {
    actions,
    areas,
    projects,
    tagSuggestions: index.tags,
    showWhen: options.showWhen ?? false,
    showList: options.showList ?? false,
  };
};
