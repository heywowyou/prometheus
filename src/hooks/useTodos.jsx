import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";

// API Endpoint Definition
const API_URL = "http://localhost:3000/api/todos/";

// Helper: Determine the recurrence reset time
// This calculates the exact time when a completed recurring task should become active again.
const getNextResetTime = (lastCompletedAt, type) => {
  // If the completion date is missing, the task is always active (returns a very old date).
  if (!lastCompletedAt) return new Date(0);

  const date = new Date(lastCompletedAt);

  // Logic for supported recurrence types
  if (type === "daily") {
    // Daily reset occurs at midnight of the NEXT day.
    date.setDate(date.getDate() + 1);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  // Default: For unsupported types (e.g., weekly, monthly, until implemented),
  // set the reset time far in the future to keep the task visually completed.
  return new Date(Date.now() + 3153600000000);
};

export const useTodos = () => {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get the function required to fetch the user's authentication token
  const { getToken } = useAuth();

  // Helper: Create Axios configuration with Auth Headers
  // This attaches the JWT token to every request for backend validation.
  const createConfig = async () => {
    const token = await getToken();
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  // Read: Fetch all user-scoped Todos
  const fetchTodos = async () => {
    try {
      const config = await createConfig();
      const response = await axios.get(API_URL, config);

      const now = new Date();
      const todosToDisplay = [];

      response.data.forEach((todo) => {
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
  const createTodo = async (text, recurrenceType = "none") => {
    try {
      const config = await createConfig();
      const response = await axios.post(
        API_URL,
        { text, recurrenceType },
        config
      );

      // Update local state by appending the new todo returned from the API
      setTodos((prevTodos) => [...prevTodos, response.data]);
    } catch (error) {
      console.error("Failed to create todo:", error);
    }
  };

  // Update: Toggle completed state
  const toggleTodo = async (id) => {
    // Fix for Recurrence UX: Strip the temporary '-active' suffix before calling the API.
    let apiId = id.toString().replace("-active", "");

    try {
      const config = await createConfig();
      // The backend records the completion date and returns the updated task.
      const response = await axios.put(API_URL + apiId, {}, config);
      const updatedTodo = response.data;

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

  // Delete: Remove a Todo
  const deleteTodo = async (id) => {
    try {
      const config = await createConfig();
      // Send the request to delete the item from the database
      await axios.delete(API_URL + id, config);

      // Update local state by filtering out the deleted item
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
    deleteTodo,
  };
};
