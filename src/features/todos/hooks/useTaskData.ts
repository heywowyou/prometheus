import { useMemo } from "react";
import { useTodos } from "./useTodos";
import { useTodoLists } from "./useTodoLists";
import { buildTaskIndex } from "../task-views";

/** Tasks, areas and projects, with every Things-style view derived from them. */
export const useTaskData = () => {
  const todosApi = useTodos();
  const listsApi = useTodoLists();
  const { todos } = todosApi;
  const { projects, areas } = listsApi;
  // The day boundary moves at midnight: recompute when the date string changes.
  const dayStamp = new Date().toDateString();
  const index = useMemo(
    () => buildTaskIndex(todos, projects, areas, new Date()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [todos, projects, areas, dayStamp],
  );
  return { ...todosApi, ...listsApi, index, loading: todosApi.loading || listsApi.loading };
};
