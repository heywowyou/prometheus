import { useState, useEffect, useCallback } from "react";
import { useTodosApi } from "../api/todos-api";
import { getNextResetTime } from "../../../lib/date/recurrence";
import type {
  Todo,
  RecurrenceType,
} from "../types/todo-types";

export const useTodos = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    fetchTodos: apiFetchTodos,
    createTodo: apiCreateTodo,
    updateTodo: apiUpdateTodo,
    pauseTodo: apiPauseTodo,
    deleteTodo: apiDeleteTodo,
  } = useTodosApi();

  const fetchTodos = useCallback(async () => {
    try {
      const data = await apiFetchTodos();

      const now = new Date();
      const todosToDisplay: Todo[] = [];

      data.forEach((todo) => {
        if (!todo.completed) {
          todosToDisplay.push(todo);
          return;
        }

        if (todo.recurrenceType === "none") {
          todosToDisplay.push(todo);
          return;
        }

        const resetTime = getNextResetTime(
          todo.lastCompletedAt ?? null,
          todo.recurrenceType as RecurrenceType
        );

        if (now < resetTime) {
          todosToDisplay.push(todo);
        } else {
          const nextInstance: Todo = {
            ...todo,
            _id: `${todo._id}-active`,
            completed: false,
            lastCompletedAt: null,
          };

          todosToDisplay.push(nextInstance);
        }
      });

      setTodos(todosToDisplay);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch todos:", error);
      setLoading(false);
    }
  }, [apiFetchTodos]);

  const createTodo = async (
    text: string,
    recurrenceType: RecurrenceType,
    interactionType: Todo["interactionType"],
    durationGoal: number
  ) => {
    try {
      const created = await apiCreateTodo({
        text,
        recurrenceType,
        interactionType,
        durationGoal,
      });

      setTodos((prevTodos) => [...prevTodos, created]);
    } catch (error) {
      console.error("Failed to create todo:", error);
    }
  };

  const toggleTodo = async (id: string) => {
    const apiId = id.toString().replace("-active", "");

    try {
      const updatedTodo = await apiUpdateTodo(apiId, {});

      setTodos((prevTodos) => {
        const withoutOld = prevTodos.filter((todo) => todo._id !== id);
        return [...withoutOld, updatedTodo];
      });
    } catch (error) {
      console.error("Failed to toggle todo:", error);
    }
  };

  const updateTask = async (
    id: string,
    updates: Partial<
      Pick<Todo, "text" | "recurrenceType" | "interactionType" | "durationGoal">
    >
  ) => {
    const apiId = id.toString().replace("-active", "");
    try {
      const updatedTodo = await apiUpdateTodo(apiId, updates);

      setTodos((prevTodos) =>
        prevTodos.map((t) => (t._id === id ? updatedTodo : t))
      );
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const pauseTodo = async (id: string) => {
    const apiId = id.replace("-active", "");
    try {
      await apiPauseTodo(apiId);
      setTodos((prev) => prev.filter((t) => t._id !== id));
    } catch (error) {
      console.error("Failed to pause todo:", error);
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      await apiDeleteTodo(id);

      setTodos((prevTodos) => prevTodos.filter((todo) => todo._id !== id));
    } catch (error) {
      console.error("Failed to delete todo:", error);
    }
  };

  useEffect(() => {
    void fetchTodos();
  }, [fetchTodos]);

  return {
    todos,
    loading,
    createTodo,
    toggleTodo,
    updateTask,
    pauseTodo,
    deleteTodo,
    refetch: fetchTodos,
  };
};

export const usePausedTodos = () => {
  const [pausedTodos, setPausedTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);

  const { fetchTodos: apiFetchTodos, resumeTodo: apiResumeTodo } = useTodosApi();

  const fetchPaused = useCallback(async () => {
    try {
      const data = await apiFetchTodos({ paused: true });
      setPausedTodos(data);
    } catch (error) {
      console.error("Failed to fetch paused todos:", error);
    } finally {
      setLoading(false);
    }
  }, [apiFetchTodos]);

  const resumeTodo = async (id: string) => {
    try {
      await apiResumeTodo(id);
      setPausedTodos((prev) => prev.filter((t) => t._id !== id));
    } catch (error) {
      console.error("Failed to resume todo:", error);
    }
  };

  useEffect(() => {
    void fetchPaused();
  }, [fetchPaused]);

  return {
    pausedTodos,
    loading,
    resumeTodo,
    refetch: fetchPaused,
  };
};
