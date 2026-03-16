import { useState } from "react";
import { Flame } from "lucide-react";
import type { Todo } from "../types/todo-types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";

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

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setIsReadyToConfirm(false);
      onClose();
    }
  };

  if (!task) return null;

  const isHighValue =
    task.recurrenceType !== "none" && task.completionCount > 0;

  const handleFinalConfirm = () => {
    onConfirm(task._id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-400">
            {isHighValue ? <Flame className="w-4 h-4" /> : null}
            {isReadyToConfirm ? "Confirm Permanently" : "Confirm Deletion"}
          </DialogTitle>
        </DialogHeader>

        {!isReadyToConfirm && (
          <>
            <div className="py-2 text-sm text-foreground">
              {isHighValue ? (
                <p>
                  You are about to delete your recurring task{" "}
                  <strong>&quot;{task.text}&quot;</strong>. This will delete
                  your{" "}
                  <strong className="text-red-400">{task.completionCount}</strong>{" "}
                  streak.
                  <br />
                  <br />
                  <span className="font-semibold">
                    Click &apos;Proceed&apos; to confirm.
                  </span>
                </p>
              ) : (
                <p>
                  Are you sure you want to delete your task{" "}
                  <strong>&quot;{task.text}&quot;</strong>?
                  <br />
                  <br />
                  Click &apos;Proceed&apos; to continue.
                </p>
              )}
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => setIsReadyToConfirm(true)}
              >
                Proceed
              </Button>
            </DialogFooter>
          </>
        )}

        {isReadyToConfirm && (
          <>
            <div className="py-2 text-sm text-foreground">
              <p>
                <strong className="text-red-400">WARNING:</strong> This action
                cannot be undone. Your task and all history will be permanently
                erased.
              </p>
            </div>

            <DialogFooter className="sm:justify-between">
              <Button
                variant="outline"
                onClick={() => setIsReadyToConfirm(false)}
              >
                Go Back
              </Button>
              <Button variant="destructive" onClick={handleFinalConfirm}>
                Yes, Delete Forever
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default DeleteConfirmModal;
