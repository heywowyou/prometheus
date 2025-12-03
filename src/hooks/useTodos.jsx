import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:3000/api/todos/";

export const useTodos = () => {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetching all Todos
  const fetchTodos = async () => {
    try {
      const response = await axios.get(API_URL);
      setTodos(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch todos:", error);
      setLoading(false);
    }
  };

  // Adding a new Todo
  const createTodo = async (text) => {
    try {
      const response = await axios.post(API_URL, { text });

      // Update local state by appending the new todo returned from the API
      setTodos((prevTodos) => [...prevTodos, response.data]);
    } catch (error) {
      console.error("Failed to create todo:", error);
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
    toggleTodo: (id) => console.log(`[STUB] Toggling todo ${id}`),
    deleteTodo: (id) => console.log(`[STUB] Deleting todo ${id}`),
  };
};

export default useTodos;
