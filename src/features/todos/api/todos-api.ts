import { useCallback, useMemo } from "react";
import { useApiClient } from "@lib/api/api-client";
import type {
  InteractionType,
  RecurrenceType,
  TimerAction,
  Todo,
  TodoHistory,
} from "../types/todo-types";

const TODOS_PATH = "/todos";

export interface CreateTodoPayload {
  text: string;
  recurrenceType: RecurrenceType;
  interactionType: InteractionType;
  durationGoal: number;
  /** One-time tasks only, `YYYY-MM-DD`. */
  dueDate?: string;
}

/** `dueDate: null` clears the due date. */
export type UpdateTodoPayload = Partial<Omit<CreateTodoPayload, "dueDate">> & {
  dueDate?: string | null;
};

export const useTodosApi = () => {
  const client = useApiClient();

  const fetchTodos = useCallback(
    async (params: { paused?: boolean } = {}): Promise<Todo[]> => {
      const { data } = await client.get<Todo[]>(TODOS_PATH, {
        params: params.paused ? { paused: "true" } : undefined,
      });
      return data;
    },
    [client],
  );

  const createTodo = useCallback(
    async (payload: CreateTodoPayload): Promise<Todo> => {
      const { data } = await client.post<Todo>(TODOS_PATH, payload);
      return data;
    },
    [client],
  );

  const updateTodo = useCallback(
    async (id: string, payload: UpdateTodoPayload): Promise<Todo> => {
      const { data } = await client.patch<Todo>(`${TODOS_PATH}/${id}`, payload);
      return data;
    },
    [client],
  );

  /** Flips completion. Completion is a dedicated endpoint, not a field update. */
  const toggleTodo = useCallback(
    async (id: string): Promise<Todo> => {
      const { data } = await client.patch<Todo>(`${TODOS_PATH}/${id}/toggle`);
      return data;
    },
    [client],
  );

  /** Saves a section's manual order: `ids[i]` takes position `i`. */
  const reorderTodos = useCallback(
    async (ids: string[]): Promise<void> => {
      await client.patch(`${TODOS_PATH}/reorder`, { ids });
    },
    [client],
  );

  const updateTimer = useCallback(
    async (id: string, action: TimerAction): Promise<Todo> => {
      const { data } = await client.patch<Todo>(`${TODOS_PATH}/${id}/timer`, {
        action,
      });
      return data;
    },
    [client],
  );

  const fetchHistory = useCallback(
    async (id: string, days: number): Promise<TodoHistory> => {
      const { data } = await client.get<TodoHistory>(`${TODOS_PATH}/${id}/history`, {
        params: { days },
      });
      return data;
    },
    [client],
  );

  const pauseTodo = useCallback(
    async (id: string): Promise<Todo> => {
      const { data } = await client.patch<Todo>(`${TODOS_PATH}/${id}/pause`);
      return data;
    },
    [client],
  );

  const resumeTodo = useCallback(
    async (id: string): Promise<Todo> => {
      const { data } = await client.patch<Todo>(`${TODOS_PATH}/${id}/resume`);
      return data;
    },
    [client],
  );

  const deleteTodo = useCallback(
    async (id: string): Promise<void> => {
      await client.delete(`${TODOS_PATH}/${id}`);
    },
    [client],
  );

  return useMemo(
    () => ({
      fetchTodos,
      createTodo,
      updateTodo,
      toggleTodo,
      reorderTodos,
      updateTimer,
      fetchHistory,
      pauseTodo,
      resumeTodo,
      deleteTodo,
    }),
    [
      reorderTodos,
      fetchTodos,
      createTodo,
      updateTodo,
      toggleTodo,
      updateTimer,
      fetchHistory,
      pauseTodo,
      resumeTodo,
      deleteTodo,
    ],
  );
};
