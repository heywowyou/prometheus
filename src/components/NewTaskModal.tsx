import { useState, KeyboardEvent } from "react";
import type { RecurrenceType, Todo } from "../features/todos/types/todo-types";

type InteractionType = Todo["interactionType"];

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (
    text: string,
    recurrenceType: RecurrenceType,
    interactionType: InteractionType,
    durationGoal: number
  ) => void;
}

function NewTaskModal({ isOpen, onClose, onCreate }: NewTaskModalProps) {
  const [text, setText] = useState("");
  const [recurrence, setRecurrence] = useState<RecurrenceType>("none");
  const [interactionType, setInteractionType] =
    useState<InteractionType>("checkbox");
  const [durationGoal, setDurationGoal] = useState<number>(0);

  if (!isOpen) {
    return null;
  }

  const handleCreateAndClose = () => {
    if (!text.trim()) return;

    onCreate(text, recurrence, interactionType, Number(durationGoal));

    setText("");
    setRecurrence("none");
    setInteractionType("checkbox");
    setDurationGoal(0);

    onClose();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleCreateAndClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-lg z-50 flex items-center justify-center">
      <div className="bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-sm border border-gray-700">
        <h2 className="text-2xl font-bold text-cyan-400 mb-4">
          Create New Task
        </h2>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="What needs to be done?"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-500 transition-colors text-gray-100"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Recurrence:
            </label>
            <select
              value={recurrence}
              onChange={(e) =>
                setRecurrence(e.target.value as RecurrenceType)
              }
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-gray-400 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="none">One-Time Task</option>
              <option value="daily">Daily Recurrence</option>
              <option value="weekly">Weekly Recurrence</option>
              <option value="monthly">Monthly Recurrence</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Mode
              </label>
              <select
                value={interactionType}
                onChange={(e) =>
                  setInteractionType(e.target.value as InteractionType)
                }
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-3 text-gray-400 focus:outline-none focus:border-cyan-500 cursor-pointer"
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
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Target (Mins)
              </label>
              <input
                type="number"
                min={1}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-3 text-gray-300 focus:outline-none focus:border-cyan-500"
                value={durationGoal}
                onChange={(e) => setDurationGoal(Number(e.target.value))}
                disabled={interactionType !== "hold"}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateAndClose}
              className="bg-cyan-500 hover:bg-cyan-600 text-gray-900 font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              disabled={!text.trim()}
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

