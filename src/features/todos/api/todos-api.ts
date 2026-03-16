import { useCallback } from "react";
import { useApiClient } from "../../../lib/api/api-client";
import type { Todo } from "../types/todo-types";

const TODOS_PATH = "/todos";

export interface CreateTodoPayload {
  text: string;
  recurrenceType: Todo["recurrenceType"];
  interactionType: Todo["interactionType"];
  durationGoal: number;
}

export type UpdateTodoPayload = Partial<CreateTodoPayload> & {
  completed?: boolean;
};

export const useTodosApi = () => {
  const client = useApiClient();

  const fetchTodos = useCallback(async (): Promise<Todo[]> => {
    const response = await client.get<Todo[]>(TODOS_PATH);
    return response.data;
  }, [client]);

  const createTodo = useCallback(
    async (payload: CreateTodoPayload): Promise<Todo> => {
      const response = await client.post<Todo>(TODOS_PATH, payload);
      return response.data;
    },
    [client]
  );

  const updateTodo = useCallback(
    async (id: string, payload: UpdateTodoPayload): Promise<Todo> => {
      const response = await client.put<Todo>(`${TODOS_PATH}/${id}`, payload);
      return response.data;
    },
    [client]
  );

  const deleteTodo = useCallback(
    async (id: string): Promise<void> => {
      await client.delete(`${TODOS_PATH}/${id}`);
    },
    [client]
  );

  return { fetchTodos, createTodo, updateTodo, deleteTodo };
};
