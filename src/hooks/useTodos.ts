import { useState, useEffect } from "react";
import { useTodosApi } from "../features/todos/api/todos-api";
import { getNextResetTime } from "../lib/date/recurrence";
import type { Todo, RecurrenceType } from "../features/todos/types/todo-types";

export const useTodos = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    fetchTodos: apiFetchTodos,
    createTodo: apiCreateTodo,
    updateTodo: apiUpdateTodo,
    deleteTodo: apiDeleteTodo,
  } = useTodosApi();

  const fetchTodos = async () => {
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
  };

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
  }, []);

  return {
    todos,
    loading,
    createTodo,
    toggleTodo,
    updateTask,
    deleteTodo,
  };
};

