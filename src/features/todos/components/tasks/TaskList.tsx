import { useRef } from "react";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@lib/utils";
import { useTasksUi } from "../../tasks-ui";
import type { Todo } from "../../types/todo-types";
import TaskRow, { type RowContext } from "./TaskRow";

function SortableTask({
  todo,
  context,
  justDragged,
}: {
  todo: Todo;
  context: RowContext;
  justDragged: () => boolean;
}) {
  const ui = useTasksUi();
  const open = ui.openId === todo._id;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: todo._id,
    disabled: open,
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(isDragging && "relative z-20 rounded-xl bg-card shadow-xl shadow-overlay/50")}
    >
      <TaskRow
        todo={todo}
        context={context}
        open={open}
        onOpenChange={(next) => {
          if (next && justDragged()) return;
          ui.setOpenId(next ? todo._id : null);
        }}
        dragHandleProps={open ? undefined : { ...attributes, ...listeners }}
      />
    </div>
  );
}

/**
 * A list of tasks, reorderable by dragging (a short press on touch screens).
 * `onReorder` gets every id of the list in the new order.
 */
export default function TaskList({
  todos,
  context,
  onReorder,
  className,
}: {
  todos: Todo[];
  context: RowContext;
  onReorder?: (ids: string[]) => void;
  className?: string;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 6 } }),
  );
  const draggedAt = useRef(0);
  const justDragged = () => Date.now() - draggedAt.current < 250;

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    draggedAt.current = Date.now();
    if (!over || active.id === over.id || !onReorder) return;
    const ids = todos.map((todo) => todo._id);
    onReorder(arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragStart={() => {
        draggedAt.current = Date.now();
      }}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={todos.map((todo) => todo._id)} strategy={verticalListSortingStrategy}>
        <div className={cn("-mx-2.5", className)}>
          {todos.map((todo) => (
            <SortableTask key={todo._id} todo={todo} context={context} justDragged={justDragged} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
