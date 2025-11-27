import { useState, useEffect } from "react";

export function useTodos() {
  // Load from LocalStorage
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem("prometheus-todos");
    // If we found data, parse it. If not, return an empty array.
    return saved ? JSON.parse(saved) : [];
  });

  // Saving for persistence
  useEffect(() => {
    localStorage.setItem("prometheus-todos", JSON.stringify(todos));
  }, [todos]);

  // Add a new task
  const addTodo = (text) => {
    if (!text.trim()) return;

    const newTodo = {
      id: Date.now(),
      text: text,
      completed: false,
    };

    // Create a brand new array with the old items + the new one
    setTodos([...todos, newTodo]);
  };

  // Toggle the completed state
  const toggleTodo = (id) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  // Delete a task
  const deleteTodo = (id) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  // Return only what the UI needs
  return {
    todos,
    addTodo,
    toggleTodo,
    deleteTodo,
  };
}
