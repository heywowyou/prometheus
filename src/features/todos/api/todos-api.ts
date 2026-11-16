import { useCallback, useMemo } from "react";
import { useApiClient } from "@lib/api/api-client";
import type {
  ChecklistItem,
  InteractionType,
  LogbookPage,
  RecurrenceType,
  RepeatRule,
  TimerAction,
  Todo,
  TodoArea,
  TodoHistory,
  TodoLists,
  TodoProject,
} from "../types/todo-types";

const TODOS_PATH = "/todos";

/** Task-only fields; `null` clears. */
export interface TaskFieldsPayload {
  notes?: string;
  checklist?: ChecklistItem[];
  areaId?: string | null;
  projectId?: string | null;
  headingId?: string | null;
  tags?: string[];
  important?: boolean;
  when?: string | null;
  evening?: boolean;
  time?: string | null;
  repeat?: RepeatRule | null;
}

export interface CreateTodoPayload extends TaskFieldsPayload {
  text: string;
  recurrenceType: RecurrenceType;
  interactionType: InteractionType;
  durationGoal: number;
  /** Tasks only: the deadline, `YYYY-MM-DD`. */
  dueDate?: string;
  /** Daily habits: days a week to aim for (1-6), null for every day. */
  perWeek?: number | null;
  /** A Lucide icon name, "" for none. */
  icon?: string;
}

/** `dueDate: null` clears the deadline. */
export type UpdateTodoPayload = Partial<Omit<CreateTodoPayload, "dueDate">> & {
  dueDate?: string | null;
};

/** Narrows the completed list to one project or one area. */
export type LogbookScope = { projectId?: string; areaId?: string };

/** Completion days per habit, and all habits' completions per day. */
export interface HabitCompletions {
  habits: Array<{ todoId: string; days: string[] }>;
  totals: Array<{ date: string; count: number }>;
}

export interface ProjectPayload {
  title?: string;
  notes?: string;
  areaId?: string | null;
  headings?: Array<{ _id?: string; title: string }>;
  when?: string | null;
  dueDate?: string | null;
  completed?: boolean;
}

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

  /** Skips a habit's current cycle (a rest day), or takes the skip back. */
  const skipTodo = useCallback(
    async (id: string): Promise<Todo> => {
      const { data } = await client.patch<Todo>(`${TODOS_PATH}/${id}/skip`);
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

  const convertTodo = useCallback(
    async (id: string, to: "habit" | "task"): Promise<Todo> => {
      const { data } = await client.patch<Todo>(`${TODOS_PATH}/${id}/convert`, { to });
      return data;
    },
    [client],
  );

  /** Done tasks, newest first; optionally only one project's or area's. */
  const fetchLogbook = useCallback(
    async (before?: string, scope: LogbookScope = {}): Promise<LogbookPage> => {
      const { data } = await client.get<LogbookPage>(`${TODOS_PATH}/logbook`, {
        params: { limit: 60, ...(before ? { before } : {}), ...scope },
      });
      return data;
    },
    [client],
  );

  const fetchHabitCompletions = useCallback(
    async (days: number): Promise<HabitCompletions> => {
      const { data } = await client.get<HabitCompletions>(`${TODOS_PATH}/habits/completions`, { params: { days } });
      return data;
    },
    [client],
  );

  const fetchLists = useCallback(async (): Promise<TodoLists> => {
    const { data } = await client.get<TodoLists>(`${TODOS_PATH}/lists`);
    return data;
  }, [client]);

  const createArea = useCallback(
    async (title: string): Promise<TodoArea> => {
      const { data } = await client.post<TodoArea>(`${TODOS_PATH}/areas`, { title });
      return data;
    },
    [client],
  );

  const updateArea = useCallback(
    async (id: string, payload: { title: string }): Promise<TodoArea> => {
      const { data } = await client.patch<TodoArea>(`${TODOS_PATH}/areas/${id}`, payload);
      return data;
    },
    [client],
  );

  const deleteArea = useCallback(
    async (id: string): Promise<void> => {
      await client.delete(`${TODOS_PATH}/areas/${id}`);
    },
    [client],
  );

  const createProject = useCallback(
    async (payload: ProjectPayload): Promise<TodoProject> => {
      const { data } = await client.post<TodoProject>(`${TODOS_PATH}/projects`, payload);
      return data;
    },
    [client],
  );

  const updateProject = useCallback(
    async (id: string, payload: ProjectPayload): Promise<TodoProject> => {
      const { data } = await client.patch<TodoProject>(`${TODOS_PATH}/projects/${id}`, payload);
      return data;
    },
    [client],
  );

  const deleteProject = useCallback(
    async (id: string): Promise<void> => {
      await client.delete(`${TODOS_PATH}/projects/${id}`);
    },
    [client],
  );

  const reorderLists = useCallback(
    async (kind: "area" | "project", ids: string[]): Promise<void> => {
      await client.patch(`${TODOS_PATH}/lists/reorder`, { kind, ids });
    },
    [client],
  );

  return useMemo(
    () => ({
      fetchHabitCompletions,
      convertTodo,
      fetchLogbook,
      fetchLists,
      createArea,
      updateArea,
      deleteArea,
      createProject,
      updateProject,
      deleteProject,
      reorderLists,
      fetchTodos,
      createTodo,
      updateTodo,
      toggleTodo,
      skipTodo,
      reorderTodos,
      updateTimer,
      fetchHistory,
      pauseTodo,
      resumeTodo,
      deleteTodo,
    }),
    [
      fetchHabitCompletions,
      convertTodo,
      fetchLogbook,
      fetchLists,
      createArea,
      updateArea,
      deleteArea,
      createProject,
      updateProject,
      deleteProject,
      reorderLists,
      reorderTodos,
      fetchTodos,
      createTodo,
      updateTodo,
      toggleTodo,
      skipTodo,
      updateTimer,
      fetchHistory,
      pauseTodo,
      resumeTodo,
      deleteTodo,
    ],
  );
};
