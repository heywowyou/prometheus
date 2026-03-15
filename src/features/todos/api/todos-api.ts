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
  const { withAuth } = useApiClient();

  const fetchTodos = async (): Promise<Todo[]> => {
    const client = await withAuth();
    const response = await client.get<Todo[]>(TODOS_PATH);
    return response.data;
  };

  const createTodo = async (payload: CreateTodoPayload): Promise<Todo> => {
    const client = await withAuth();
    const response = await client.post<Todo>(TODOS_PATH, payload);
    return response.data;
  };

  const updateTodo = async (
    id: string,
    payload: UpdateTodoPayload
  ): Promise<Todo> => {
    const client = await withAuth();
    const response = await client.put<Todo>(`${TODOS_PATH}/${id}`, payload);
    return response.data;
  };

  const deleteTodo = async (id: string): Promise<void> => {
    const client = await withAuth();
    await client.delete(`${TODOS_PATH}/${id}`);
  };

  return {
    fetchTodos,
    createTodo,
    updateTodo,
    deleteTodo,
  };
};

