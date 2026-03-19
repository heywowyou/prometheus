import type { MediaLog } from "../types/media-types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";

interface DeleteMediaLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: MediaLog | null;
  onConfirm: (id: string) => void;
}

function DeleteMediaLogModal({
  isOpen,
  onClose,
  log,
  onConfirm,
}: DeleteMediaLogModalProps) {
  if (!log) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-red-400">
            Delete &ldquo;{log.title}&rdquo;?
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground py-1">
          This action cannot be undone.
        </p>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={() => onConfirm(log._id)}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DeleteMediaLogModal;
