import { useState, useEffect } from "react";
import type { Todo, RecurrenceType } from "../types/todo-types";

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Todo | null;
  onUpdate: (
    id: string,
    updates: {
      text: string;
      recurrenceType: RecurrenceType;
      interactionType: Todo["interactionType"];
      durationGoal: number;
    }
  ) => void;
}

function EditTaskModal({
  isOpen,
  onClose,
  task,
  onUpdate,
}: EditTaskModalProps) {
  const [text, setText] = useState("");
  const [recurrence, setRecurrence] = useState<RecurrenceType>("none");
  const [interactionType, setInteractionType] =
    useState<Todo["interactionType"]>("checkbox");
  const [durationGoal, setDurationGoal] = useState<number>(0);

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

  const inputClass =
    "w-full bg-background border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:border-accent transition-colors text-text";
  const labelClass =
    "block text-xs font-medium text-text-muted mb-1 uppercase tracking-wide";

  return (
    <div className="fixed inset-0 bg-background/60 backdrop-blur-lg z-50 flex items-center justify-center">
      <div className="bg-surface p-6 rounded-xl shadow-2xl w-full max-w-sm border border-border">
        <h2 className="font-sans text-2xl font-bold text-text mb-4">
          Edit Task
        </h2>

        <div className="space-y-4">
          <div>
            <label className={labelClass}>Description</label>
            <input
              type="text"
              className={inputClass}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Recurrence</label>
            <select
              value={recurrence}
              onChange={(e) =>
                setRecurrence(e.target.value as RecurrenceType)
              }
              className={`${inputClass} cursor-pointer`}
            >
              <option value="none">One-Time</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Mode</label>
              <select
                value={interactionType}
                onChange={(e) =>
                  setInteractionType(e.target.value as Todo["interactionType"])
                }
                className={`${inputClass} px-3 cursor-pointer`}
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
              <label className={labelClass}>Target (Mins)</label>
              <input
                type="number"
                min={1}
                className={`${inputClass} px-3`}
                value={durationGoal}
                onChange={(e) => setDurationGoal(Number(e.target.value))}
                disabled={interactionType !== "hold"}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-text-muted hover:text-text transition-colors"
            >
              Cancel
            </button>
            <button onClick={handleSave} className="btn-primary px-6 py-2">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditTaskModal;
