import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";

const API_URL = "http://localhost:3000/api/todos/";

export const useTodos = () => {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get the token fetcher from Clerk
  const { getToken } = useAuth();

  // Helper: Create Auth Headers
  // This ensures we get a fresh token for every request
  const createConfig = async () => {
    const token = await getToken();
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  // Read: Fetching all Todos
  const fetchTodos = async () => {
    try {
      // Get config with token
      const config = await createConfig();
      // Pass config as the second argument
      const response = await axios.get(API_URL, config);

      setTodos(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch todos:", error);
      setLoading(false);
    }
  };

  // Create: Adding a new Todo
  const createTodo = async (text) => {
    try {
      const config = await createConfig();
      // Pass config as the third argument for POST requests (url, data, config)
      const response = await axios.post(API_URL, { text }, config);

      setTodos((prevTodos) => [...prevTodos, response.data]);
    } catch (error) {
      console.error("Failed to create todo:", error);
    }
  };

  // Update: Toggle completed state
  const toggleTodo = async (id) => {
    try {
      const config = await createConfig();
      // PUT requests: (url, data, config). Since we have no data to update, we pass {} or null.
      // But wait, axios.put(url, data, config)
      const response = await axios.put(API_URL + id, {}, config);

      const updatedTodo = response.data;
      setTodos((prevTodos) =>
        prevTodos.map((todo) => (todo._id === id ? updatedTodo : todo))
      );
    } catch (error) {
      console.error("Failed to toggle todo:", error);
    }
  };

  // Delete: Remove a Todo
  const deleteTodo = async (id) => {
    try {
      const config = await createConfig();
      // DELETE requests: (url, config) - No data argument
      await axios.delete(API_URL + id, config);

      setTodos((prevTodos) => prevTodos.filter((todo) => todo._id !== id));
    } catch (error) {
      console.error("Failed to delete todo:", error);
    }
  };

  // Use useEffect to fetch data when the component mounts
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
