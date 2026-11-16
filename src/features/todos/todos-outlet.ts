import { useOutletContext } from "react-router-dom";
import type { useTaskData } from "./hooks/useTaskData";

export type TaskData = ReturnType<typeof useTaskData>;

/** The task data loaded once by the todos layout. */
export const useTodosData = () => useOutletContext<TaskData>();
