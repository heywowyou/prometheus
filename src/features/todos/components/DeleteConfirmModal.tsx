import { useState } from "react";
import { Flame } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@components/ui/dialog";
import { Button } from "@components/ui/button";
import type { Todo } from "../types/todo-types";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Todo | null;
  onConfirm: (id: string) => void;
}

/** Mounted only while open, so it always starts at step one. */
function DeleteConfirmModalBody({
  onClose,
  task,
  onConfirm,
}: {
  onClose: () => void;
  task: Todo;
  onConfirm: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const hasHistory = task.recurrenceType !== "none" && task.completionCount > 0;
  const streak = task.streak?.current ?? 0;

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-destructive">
          {hasHistory && <Flame className="h-4 w-4" />}
          {confirming ? "Confirm permanently" : "Confirm deletion"}
        </DialogTitle>
      </DialogHeader>

      {confirming ? (
        <>
          <p className="py-2 text-sm text-foreground">
            <strong className="text-destructive">Warning:</strong> this cannot be
            undone. The task and all of its history will be permanently erased.
          </p>
          <DialogFooter className="sm:justify-between">
            <Button variant="outline" onClick={() => setConfirming(false)}>
              Go back
            </Button>
            <Button variant="destructive" onClick={() => onConfirm(task._id)}>
              Yes, delete forever
            </Button>
          </DialogFooter>
        </>
      ) : (
        <>
          <p className="py-2 text-sm text-foreground">
            {hasHistory ? (
              <>
                You are about to delete the recurring task{" "}
                <strong>&ldquo;{task.text}&rdquo;</strong>, along with its{" "}
                <strong className="text-destructive">{task.completionCount}</strong>{" "}
                recorded completions
                {streak > 0 && (
                  <>
                    {" "}
                    and its current streak of{" "}
                    <strong className="text-destructive">{streak}</strong>
                  </>
                )}
                . Pausing it keeps all of that.
              </>
            ) : (
              <>
                Delete the task <strong>&ldquo;{task.text}&rdquo;</strong>?
              </>
            )}
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => (hasHistory ? setConfirming(true) : onConfirm(task._id))}
            >
              {hasHistory ? "Proceed" : "Delete"}
            </Button>
          </DialogFooter>
        </>
      )}
    </>
  );
}

/**
 * Delete for tasks. Recurring tasks with history take two steps, because their
 * completions and streak can't be rebuilt; plain tasks take one.
 */
function DeleteConfirmModal({
  isOpen,
  onClose,
  task,
  onConfirm,
}: DeleteConfirmModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        {isOpen && task && (
          <DeleteConfirmModalBody
            key={task._id}
            task={task}
            onClose={onClose}
            onConfirm={onConfirm}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

export default DeleteConfirmModal;
