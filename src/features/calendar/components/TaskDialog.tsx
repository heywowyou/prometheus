import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@components/ui/dialog";
import TaskDetail from "@features/todos/components/tasks/TaskDetail";
import type { RowContext } from "@features/todos/components/tasks/TaskRow";
import type { Todo } from "@features/todos/types/todo-types";

/** A task opened from the calendar, with the same editor as the to-do lists. */
export default function TaskDialog({
  todo,
  context,
  onClose,
}: {
  todo: Todo | null;
  context: RowContext;
  onClose: () => void;
}) {
  return (
    <Dialog open={Boolean(todo)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl" data-task-detail>
        <DialogTitle className="sr-only">{todo?.text ?? "Task"}</DialogTitle>
        <DialogDescription className="sr-only">Edit the task</DialogDescription>
        {todo && (
          <TaskDetail
            key={todo._id}
            todo={todo}
            actions={context.actions}
            areas={context.areas}
            projects={context.projects}
            tagSuggestions={context.tagSuggestions}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
