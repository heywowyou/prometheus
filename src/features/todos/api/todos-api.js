import { useApiClient } from "../../../lib/api/api-client";

const TODOS_PATH = "/todos";

export const useTodosApi = () => {
  const { withAuth } = useApiClient();

  const fetchTodos = async () => {
    const client = await withAuth();
    const response = await client.get(TODOS_PATH);
    return response.data;
  };

  const createTodo = async (payload) => {
    const client = await withAuth();
    const response = await client.post(TODOS_PATH, payload);
    return response.data;
  };

  const updateTodo = async (id, payload) => {
    const client = await withAuth();
    const response = await client.put(`${TODOS_PATH}/${id}`, payload);
    return response.data;
  };

  const deleteTodo = async (id) => {
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

