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

  // Toggle completed state)
  const toggleTodo = async (id) => {
    try {
      // API call to update the status in the database
      const response = await axios.put(API_URL + id);
      const updatedTodo = response.data;

      // Update local state by mapping through the array and replacing the matching item
      setTodos((prevTodos) =>
        prevTodos.map((todo) => (todo._id === id ? updatedTodo : todo))
      );
    } catch (error) {
      console.error("Failed to toggle todo:", error);
    }
  };

  // Remove a Todo)
  const deleteTodo = async (id) => {
    try {
      // API call to delete the item from the database
      await axios.delete(API_URL + id);

      // Update local state by filtering out the deleted item
      setTodos((prevTodos) => prevTodos.filter((todo) => todo._id !== id));
    } catch (error) {
      console.error("Failed to delete todo:", error);
    }
  };

  return {
    todos,
    loading,
    createTodo,
    toggleTodo,
    deleteTodo,
  };
};
