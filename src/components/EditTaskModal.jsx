import React, { useState, useEffect } from "react";

function EditTaskModal({ isOpen, onClose, task, onUpdate }) {
  const [text, setText] = useState("");
  const [recurrence, setRecurrence] = useState("none");
  const [interactionType, setInteractionType] = useState("checkbox");
  const [durationGoal, setDurationGoal] = useState(0);

  // Load task data when modal opens
  useEffect(() => {
    if (task) {
      setText(task.text);
      setRecurrence(task.recurrenceType || "none");
      setInteractionType(task.interactionType || "checkbox");
      setDurationGoal(task.durationGoal || 0);
    }
  }, [task, isOpen]);

  if (!isOpen || !task) return null;

  const handleSave = () => {
    if (!text.trim()) return;

    onUpdate(task._id, {
      text,
      recurrenceType: recurrence,
      interactionType,
      durationGoal: Number(durationGoal),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-lg z-50 flex items-center justify-center">
      <div className="bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-sm border border-gray-700">
        <h2 className="text-2xl font-bold text-cyan-400 mb-4">Edit Task</h2>

        <div className="space-y-4">
          {/* Text input */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
              Description
            </label>
            <input
              type="text"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500 text-gray-100 placeholder-gray-600 transition-colors"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          {/* Recurrence selector */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
              Recurrence
            </label>
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-400 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="none">One-Time</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {/* Interaction type and duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
                Mode
              </label>
              <select
                value={interactionType}
                onChange={(e) => setInteractionType(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-gray-400 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="checkbox">Checkbox</option>
                <option value="hold">Hold to Fill</option>
              </select>
            </div>

            <div
              className={
                interactionType === "hold"
                  ? "opacity-100"
                  : "opacity-30 pointer-events-none"
              }
            >
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
                Target (Mins)
              </label>
              <input
                type="number"
                min="1"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-gray-300 focus:outline-none focus:border-cyan-500"
                value={durationGoal}
                onChange={(e) => setDurationGoal(e.target.value)}
                disabled={interactionType !== "hold"}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="bg-cyan-500 hover:bg-cyan-600 text-gray-900 font-bold px-6 py-2 rounded-lg transition-colors cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditTaskModal;
