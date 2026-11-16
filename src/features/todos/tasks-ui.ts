import { createContext, useContext } from "react";
import type { CreateTodoPayload } from "./api/todos-api";

export interface TasksUi {
  /** The task open for editing (one at a time, across every list on screen). */
  openId: string | null;
  setOpenId: (id: string | null) => void;
  /** Ids just created from quick add, opened straight away for details. */
  openSidebar: () => void;
  /** Focuses the new-task field of the current view ("n"). */
  focusNewTask: () => void;
  registerNewTask: (focus: (() => void) | null) => void;
}

export const TasksUiContext = createContext<TasksUi | null>(null);

export const useTasksUi = (): TasksUi => {
  const ui = useContext(TasksUiContext);
  if (!ui) throw new Error("useTasksUi must be used inside the todos layout");
  return ui;
};

/** Defaults a new task inherits from the list it's typed in. */
export type NewTaskDefaults = Partial<
  Pick<CreateTodoPayload, "when" | "evening" | "projectId" | "areaId" | "headingId" | "important">
>;
