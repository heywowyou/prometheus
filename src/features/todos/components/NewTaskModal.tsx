import { useState, KeyboardEvent } from "react";
import type { RecurrenceType, Todo } from "../types/todo-types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";

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
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Input
              type="text"
              placeholder="What needs to be done?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label>Recurrence</Label>
            <Select
              value={recurrence}
              onValueChange={(value) => setRecurrence(value as RecurrenceType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">One-Time Task</SelectItem>
                <SelectItem value="daily">Daily Recurrence</SelectItem>
                <SelectItem value="weekly">Weekly Recurrence</SelectItem>
                <SelectItem value="monthly">Monthly Recurrence</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Mode</Label>
              <Select
                value={interactionType}
                onValueChange={(value) =>
                  setInteractionType(value as InteractionType)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checkbox">Checkbox</SelectItem>
                  <SelectItem value="hold">Hold to Fill</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div
              className={
                interactionType === "hold"
                  ? "space-y-1.5 opacity-100"
                  : "space-y-1.5 opacity-30 pointer-events-none"
              }
            >
              <Label>Target (Mins)</Label>
              <Input
                type="number"
                min={1}
                value={durationGoal}
                onChange={(e) => setDurationGoal(Number(e.target.value))}
                disabled={interactionType !== "hold"}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCreateAndClose} disabled={!text.trim()}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default NewTaskModal;
