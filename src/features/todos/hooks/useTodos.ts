import { useMemo, useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@lib/query/keys";
import { useTodosApi, type CreateTodoPayload, type UpdateTodoPayload } from "../api/todos-api";
import type { TimerAction, Todo } from "../types/todo-types";

/** Applies a timer action to a cached todo, so start/pause respond instantly. */
const applyTimer = (todo: Todo, action: TimerAction, now: number): Todo => {
  const timer = todo.timer ?? { elapsedMs: 0 };
  const running = timer.startedAt ? now - new Date(timer.startedAt).getTime() : 0;
  switch (action) {
    case "start":
      return timer.startedAt
        ? todo
        : { ...todo, timer: { ...timer, startedAt: new Date(now).toISOString() } };
    case "pause":
      return { ...todo, timer: { elapsedMs: timer.elapsedMs + Math.max(0, running) } };
    case "reset":
      return { ...todo, timer: { elapsedMs: 0 } };
  }
};

/**
 * Active (non-paused) todos plus the mutations the dashboard needs.
 *
 * Recurrence rollover, streaks and timer progress are resolved by the API, so
 * the client only mirrors them.
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

  /** Snapshot-and-patch for optimistic updates; the snapshot restores on error. */
  const patchOptimistically = async (id: string, patch: (todo: Todo) => Todo) => {
    await queryClient.cancelQueries({ queryKey: listKey });
    const snapshot = queryClient.getQueryData<Todo[]>(listKey);
    queryClient.setQueryData<Todo[]>(listKey, (previous) =>
      previous?.map((todo) => (todo._id === id ? patch(todo) : todo)),
    );
    return { snapshot };
  };

  const restore = (context: { snapshot?: Todo[] } | undefined) => {
    if (context?.snapshot) queryClient.setQueryData(listKey, context.snapshot);
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
    onSuccess: (updated) => {
      writeToCache(updated);
      // Changing recurrence can erase history.
      void queryClient.invalidateQueries({ queryKey: queryKeys.todos.historyOf(updated._id) });
    },
  });

  const toggleTodo = useMutation({
    mutationFn: (id: string) => api.toggleTodo(id),
    // Optimistic flip: ticking a checkbox should feel instant. The streak is
    // left alone — the server's answer carries the new one.
    onMutate: (id) =>
      patchOptimistically(id, (todo) => ({ ...todo, completed: !todo.completed })),
    onError: (_error, _id, context) => restore(context),
    onSuccess: (updated) => {
      writeToCache(updated);
      void queryClient.invalidateQueries({ queryKey: queryKeys.todos.historyOf(updated._id) });
    },
  });

  const updateTimer = useMutation({
    mutationFn: ({ id, action }: { id: string; action: TimerAction }) =>
      api.updateTimer(id, action),
    onMutate: ({ id, action }) =>
      patchOptimistically(id, (todo) => applyTimer(todo, action, Date.now())),
    onError: (_error, _vars, context) => restore(context),
    onSuccess: writeToCache,
  });

  const refreshBothLists = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.todos.list() });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.todos.list({ paused: true }),
    });
  };

  const resumeTodo = useMutation({
    mutationFn: (id: string) => api.resumeTodo(id),
    onSuccess: refreshBothLists,
  });

  const pauseTodo = useMutation({
    mutationFn: (id: string) => api.pauseTodo(id),
    onSuccess: (paused, id) => {
      removeFromCache(id);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.todos.list({ paused: true }),
      });
      toast(`Paused “${paused.text}”`, {
        action: { label: "Undo", onClick: () => resumeTodo.mutate(id) },
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
    timerAction: (id: string, action: TimerAction) =>
      updateTimer.mutate({ id, action }),
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

/** A recurring todo's completion calendar and streak, for the history dialog. */
export const useTodoHistory = (id: string | null, days: number) => {
  const api = useTodosApi();
  const query = useQuery({
    queryKey: queryKeys.todos.history(id ?? "", days),
    queryFn: () => api.fetchHistory(id as string, days),
    enabled: id !== null,
  });
  return { history: query.data ?? null, loading: query.isPending };
};

/** How long a finished one-time task stays in the History column. */
export const RECENT_COMPLETION_DAYS = 7;

/** Splits todos into the dashboard's recurrence columns and history panel. */
export const useGroupedTodos = (todos: Todo[]) => {
  // "Now" for the age cutoff, fixed at mount: reading the clock during render
  // is impure, and a page open across days is refreshed by refetches anyway.
  const [mountedAt] = useState(() => Date.now());

  return useMemo(() => {
    const byModeThenText = (a: Todo, b: Todo) =>
      a.interactionType === b.interactionType
        ? a.text.localeCompare(b.text)
        : a.interactionType.localeCompare(b.interactionType);

    const active = todos.filter((todo) => !todo.completed).sort(byModeThenText);

    const completed = todos
      .filter((todo) => todo.completed)
      .sort(
        (a, b) =>
          new Date(b.lastCompletedAt ?? 0).getTime() -
          new Date(a.lastCompletedAt ?? 0).getTime(),
      );

    // Finished one-time tasks pile up forever; only recent ones are shown
    // unless the user asks for the rest.
    const cutoff = mountedAt - RECENT_COMPLETION_DAYS * 86_400_000;
    const isOld = (todo: Todo) =>
      todo.recurrenceType === "none" &&
      new Date(todo.lastCompletedAt ?? 0).getTime() < cutoff;

    return {
      active,
      recentCompleted: completed.filter((todo) => !isOld(todo)),
      olderCompleted: completed.filter(isOld),
    };
  }, [todos, mountedAt]);
};
