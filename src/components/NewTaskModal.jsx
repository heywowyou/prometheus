import React, { useState } from "react";

function NewTaskModal({ isOpen, onClose, onCreate }) {
  // Input and recurrence state
  const [input, setInput] = useState("");
  const [recurrence, setRecurrence] = useState("none");

  if (!isOpen) {
    return null;
  }

  const handleCreateAndClose = () => {
    if (!input.trim()) return;

    // Call the handler function passed from App.jsx
    onCreate(input, recurrence);

    // Reset local state
    setInput("");
    setRecurrence("none");

    // Close the modal
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleCreateAndClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-lg z-50 flex items-center justify-center">
      {/* Modal Content */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-sm border border-gray-700">
        <h2 className="text-2xl font-bold text-teal-400 mb-4">
          Create New Task
        </h2>

        <div className="space-y-4">
          {/* Text Input */}
          <input
            type="text"
            placeholder="What needs to be done?"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-teal-500 transition-colors text-gray-100"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />

          {/* Recurrence Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Recurrence:
            </label>
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-gray-400 focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="none">One-Time Task</option>
              <option value="daily">Daily Recurrence</option>
              <option value="weekly">Weekly Recurrence</option>
              <option value="monthly">Monthly Recurrence</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateAndClose}
              className="bg-teal-500 hover:bg-teal-600 text-gray-900 font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              disabled={!input.trim()}
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewTaskModal;
