import { useState, useEffect } from "react";
import { useTodosApi } from "../features/todos/api/todos-api";

// Helper: Determine the recurrence reset time
const getNextResetTime = (lastCompletedAt, type) => {
  // If the completion date is missing, the task is always active.
  if (!lastCompletedAt) return new Date(0);

  const date = new Date(lastCompletedAt);

  // 1. Daily: Reset at midnight of the NEXT day
  if (type === "daily") {
    date.setDate(date.getDate() + 1);
  }

  // 2. Weekly: Reset at midnight of the NEXT Monday
  else if (type === "weekly") {
    const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    let daysUntilNextMonday = dayOfWeek === 1 ? 7 : (8 - dayOfWeek) % 7;

    // If the task was completed today (Monday), the reset is next Monday (7 days later).
    if (daysUntilNextMonday === 0) {
      daysUntilNextMonday = 7;
    }

    date.setDate(date.getDate() + daysUntilNextMonday);
  }

  // 3. Monthly: Reset at midnight of the 1st day of the NEXT month
  else if (type === "monthly") {
    date.setMonth(date.getMonth() + 1);
    date.setDate(1); // Set to the 1st of the new month
  }

  // Normalize to Midnight (00:00:00)
  date.setHours(0, 0, 0, 0);
  return date;
};

export const useTodos = () => {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);

  const { fetchTodos: apiFetchTodos, createTodo: apiCreateTodo, updateTodo: apiUpdateTodo, deleteTodo: apiDeleteTodo } =
    useTodosApi();

  // Read: Fetch all user-scoped Todos
  const fetchTodos = async () => {
    try {
      const data = await apiFetchTodos();

      const now = new Date();
      const todosToDisplay = [];

      data.forEach((todo) => {
        // Case 1: Task is NOT completed. Always show it.
        if (!todo.completed) {
          todosToDisplay.push(todo);
          return;
        }

        // Case 2 (One-Time UX): Task is completed AND is NON-recurring.
        // Show it as completed until the user deletes it.
        if (todo.recurrenceType === "none") {
          todosToDisplay.push(todo);
          return;
        }

        // Case 3 (Recurrence UX): Task is completed AND is RECURRING. Perform the time check.
        if (todo.recurrenceType !== "none") {
          const resetTime = getNextResetTime(
            todo.lastCompletedAt,
            todo.recurrenceType
          );

          if (now < resetTime) {
            // Reset time hasn't passed. Show it as completed and checked.
            todosToDisplay.push(todo);
          } else {
            // Reset time HAS passed. This task is STALE and needs to be active.
            // We manually create a temporary 'new' instance for the UI list.
            const nextInstance = {
              ...todo,
              _id: todo._id + "-active", // Temporary ID to trigger a new UI key
              completed: false, // Reset status
              lastCompletedAt: undefined, // Clear timestamp for the new cycle
            };

            todosToDisplay.push(nextInstance);
          }
        }
      });

      setTodos(todosToDisplay);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch todos:", error);
      setLoading(false);
    }
  };

  // Create: Add a new Todo
  const createTodo = async (
    text,
    recurrenceType,
    interactionType,
    durationGoal
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

  // Update: Toggle completed state
  const toggleTodo = async (id) => {
    // Fix for Recurrence UX: Strip the temporary '-active' suffix before calling the API.
    let apiId = id.toString().replace("-active", "");

    try {
      const updatedTodo = await apiUpdateTodo(apiId, {});

      setTodos((prevTodos) => {
        // 1. Remove the task corresponding to the input ID (removes the original or the stale active one)
        const withoutOld = prevTodos.filter((todo) => todo._id !== id);

        // 2. Add the updated item returned by the server.
        return [...withoutOld, updatedTodo];
      });
    } catch (error) {
      console.error("Failed to toggle todo:", error);
    }
  };

  // Update task details (text, settings, etc.)
  const updateTask = async (id, updates) => {
    let apiId = id.toString().replace("-active", "");
    try {
      const updatedTodo = await apiUpdateTodo(apiId, updates);

      setTodos((prevTodos) => {
        return prevTodos.map((t) => (t._id === id ? updatedTodo : t));
      });
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  // Delete: Remove a Todo
  const deleteTodo = async (id) => {
    try {
      await apiDeleteTodo(id);

      setTodos((prevTodos) => prevTodos.filter((todo) => todo._id !== id));
    } catch (error) {
      console.error("Failed to delete todo:", error);
    }
  };

  // Lifecycle Hook: Fetch data when the component mounts
  useEffect(() => {
    fetchTodos();
  }, []); // Empty dependency array ensures it runs only once on mount

  return {
    todos,
    loading,
    createTodo,
    toggleTodo,
    updateTask,
    deleteTodo,
  };
};
