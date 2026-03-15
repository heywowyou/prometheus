import { useState } from "react";
import { Flame } from "lucide-react";
import type { Todo } from "../features/todos/types/todo-types";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Todo | null;
  onConfirm: (id: string) => void;
}

function DeleteConfirmModal({
  isOpen,
  onClose,
  task,
  onConfirm,
}: DeleteConfirmModalProps) {
  const [isReadyToConfirm, setIsReadyToConfirm] = useState(false);

  if (!isOpen) {
    if (isReadyToConfirm) setIsReadyToConfirm(false);
    return null;
  }

  if (!task) {
    return null;
  }

  const isHighValue =
    task.recurrenceType !== "none" && task.completionCount > 0;

  const handleFinalConfirm = () => {
    onConfirm(task._id);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-lg z-50 flex items-center justify-center">
      <div className="bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-lg border border-slate-700">
        <h2 className="text-xl font-bold text-red-500 mb-4 flex items-center gap-2">
          {isHighValue ? <Flame className="w-5 h-5" /> : null}
          {isReadyToConfirm ? "Confirm Permanently" : "Confirm Deletion"}
        </h2>

        {!isReadyToConfirm && (
          <>
            {isHighValue ? (
              <p className="text-slate-300 mb-4">
                You are about to delete your recurring task{" "}
                <strong className="text-white">"{task.text}"</strong>. This will
                delete your{" "}
                <strong className="text-red-400">
                  {task.completionCount}
                </strong>{" "}
                streak.
                <br />
                <br />
                <span className="font-semibold">
                  Click &apos;Proceed&apos; to confirm.
                </span>
              </p>
            ) : (
              <p className="text-slate-300 mb-4">
                Are you sure you want to delete your task{" "}
                <strong className="text-white">"{task.text}"</strong>?
                <br />
                <br />
                Click &apos;Proceed&apos; to continue.
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setIsReadyToConfirm(true)}
                className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer"
              >
                Proceed
              </button>
            </div>
          </>
        )}

        {isReadyToConfirm && (
          <>
            <p className="text-slate-300 mb-4">
              <strong className="text-red-400">WARNING:</strong> This action
              cannot be undone. Your task and all history will be permanently
              erased.
            </p>

            <div className="flex justify-between gap-3 pt-2">
              <button
                onClick={() => setIsReadyToConfirm(false)}
                className="px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors border border-slate-700 rounded-lg"
              >
                Go Back
              </button>
              <button
                onClick={handleFinalConfirm}
                className="bg-red-700 hover:bg-red-800 text-white font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer"
              >
                Yes, Delete Forever
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default DeleteConfirmModal;

