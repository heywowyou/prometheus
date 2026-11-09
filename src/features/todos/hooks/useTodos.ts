import { useMemo } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { queryKeys } from "@lib/query/keys";
import { useTodosApi, type CreateTodoPayload, type UpdateTodoPayload } from "../api/todos-api";
import type { Todo } from "../types/todo-types";

/**
 * Active (non-paused) todos plus the mutations the dashboard needs.
 *
 * Recurrence rollover is resolved by the API, so there is no client-side
 * reconstruction of "this task is due again" and no synthetic ids.
 */
export const useTodos = () => {
  const queryClient = useQueryClient();
  const api = useTodosApi();
  const listKey = queryKeys.todos.list();

  const query = useQuery({
    queryKey: listKey,
    queryFn: () => api.fetchTodos(),
  });

  /** Replaces one todo in the cached list without a round trip. */
  const writeToCache = (updated: Todo) => {
    queryClient.setQueryData<Todo[]>(listKey, (previous) =>
      previous?.map((todo) => (todo._id === updated._id ? updated : todo)),
    );
  };

  const removeFromCache = (id: string) => {
    queryClient.setQueryData<Todo[]>(listKey, (previous) =>
      previous?.filter((todo) => todo._id !== id),
    );
  };

  const createTodo = useMutation({
    mutationFn: (payload: CreateTodoPayload) => api.createTodo(payload),
    onSuccess: (created) => {
      queryClient.setQueryData<Todo[]>(listKey, (previous) =>
        previous ? [created, ...previous] : [created],
      );
    },
  });

  const updateTodo = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTodoPayload }) =>
      api.updateTodo(id, payload),
    onSuccess: writeToCache,
  });

  const toggleTodo = useMutation({
    mutationFn: (id: string) => api.toggleTodo(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const snapshot = queryClient.getQueryData<Todo[]>(listKey);

      // Optimistic flip: ticking a checkbox should feel instant. The tally is
      // left alone — only the server knows the authoritative streak.
      queryClient.setQueryData<Todo[]>(listKey, (previous) =>
        previous?.map((todo) =>
          todo._id === id ? { ...todo, completed: !todo.completed } : todo,
        ),
      );
      return { snapshot };
    },
    onError: (_error, _id, context) => {
      if (context?.snapshot) {
        queryClient.setQueryData(listKey, context.snapshot);
      }
    },
    onSuccess: writeToCache,
  });

  const pauseTodo = useMutation({
    mutationFn: (id: string) => api.pauseTodo(id),
    onSuccess: (_paused, id) => {
      removeFromCache(id);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.todos.list({ paused: true }),
      });
    },
  });

  const deleteTodo = useMutation({
    mutationFn: (id: string) => api.deleteTodo(id),
    onSuccess: (_result, id) => removeFromCache(id),
  });

  return {
    todos: query.data ?? [],
    loading: query.isPending,
    error: query.error,
    createTodo: (payload: CreateTodoPayload) => createTodo.mutateAsync(payload),
    updateTodo: (id: string, payload: UpdateTodoPayload) =>
      updateTodo.mutateAsync({ id, payload }),
    toggleTodo: (id: string) => toggleTodo.mutate(id),
    pauseTodo: (id: string) => pauseTodo.mutate(id),
    deleteTodo: (id: string) => deleteTodo.mutate(id),
    refetch: query.refetch,
  };
};

export const usePausedTodos = () => {
  const queryClient = useQueryClient();
  const api = useTodosApi();
  const listKey = queryKeys.todos.list({ paused: true });

  const query = useQuery({
    queryKey: listKey,
    queryFn: () => api.fetchTodos({ paused: true }),
  });

  const resumeTodo = useMutation({
    mutationFn: (id: string) => api.resumeTodo(id),
    onSuccess: (_resumed, id) => {
      queryClient.setQueryData<Todo[]>(listKey, (previous) =>
        previous?.filter((todo) => todo._id !== id),
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.todos.list() });
    },
  });

  return {
    pausedTodos: query.data ?? [],
    loading: query.isPending,
    resumeTodo: (id: string) => resumeTodo.mutate(id),
    refetch: query.refetch,
  };
};

/** Splits todos into the dashboard's recurrence columns and history panel. */
export const useGroupedTodos = (todos: Todo[]) =>
  useMemo(() => {
    const byInteractionThenText = (a: Todo, b: Todo) =>
      a.interactionType === b.interactionType
        ? a.text.localeCompare(b.text)
        : a.interactionType.localeCompare(b.interactionType);

    const active = todos.filter((todo) => !todo.completed).sort(byInteractionThenText);

    const completed = todos
      .filter((todo) => todo.completed)
      .sort((a, b) => {
        if (a.interactionType !== b.interactionType) {
          return a.interactionType.localeCompare(b.interactionType);
        }
        return (
          new Date(b.lastCompletedAt ?? 0).getTime() -
          new Date(a.lastCompletedAt ?? 0).getTime()
        );
      });

    return { active, completed };
  }, [todos]);
