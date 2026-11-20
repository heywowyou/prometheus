import { useRef } from "react";
import {
  DndContext,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@lib/utils";
import { haptic } from "@lib/haptics";
import { MouseSensor } from "@lib/dnd/sensors";
import { useTasksUi } from "../../tasks-ui";
import type { Todo } from "../../types/todo-types";
import TaskRow, { type RowContext } from "./TaskRow";

function SortableTask({
  todo,
  context,
  sortable,
  justDragged,
}: {
  todo: Todo;
  context: RowContext;
  sortable: boolean;
  justDragged: () => boolean;
}) {
  const ui = useTasksUi();
  const open = ui.openId === todo._id;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: todo._id,
    disabled: open || !sortable,
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(isDragging && "relative z-20")}
    >
      <div
        className={cn(
          "rounded-xl transition-[transform,box-shadow,background-color] duration-200",
          isDragging && "scale-[1.02] bg-card shadow-xl shadow-overlay/50",
        )}
      >
        <TaskRow
          todo={todo}
          context={context}
          open={open}
          onOpenChange={(next) => {
            if (next && justDragged()) return;
            ui.setOpenId(next ? todo._id : null);
          }}
          sortable={sortable}
          ignoreClick={justDragged}
          dragHandleProps={open || !sortable ? undefined : { ...attributes, ...listeners }}
        />
      </div>
    </div>
  );
}

/**
 * A list of tasks, reorderable by dragging (a short press on touch screens:
 * the row lifts; move to reorder, or lift the finger to open the task).
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
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 6 } }),
  );
  const ui = useTasksUi();
  const sortable = Boolean(onReorder);
  const draggedAt = useRef(0);
  const justDragged = () => Date.now() - draggedAt.current < 400;

  const onDragStart = () => {
    draggedAt.current = Date.now();
    // On phones the row lifts after a short hold: say so under the finger.
    haptic("hold");
  };

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (over && over.id !== active.id) haptic("selection");
  };

  const onDragEnd = ({ active, over, delta, activatorEvent }: DragEndEvent) => {
    draggedAt.current = Date.now();
    const id = String(active.id);
    const moved = Boolean(over) && over?.id !== active.id;
    // Phones: hold, then lift the finger without moving = open the task.
    // (Holding then moving reorders.)
    const touch = typeof TouchEvent !== "undefined" && activatorEvent instanceof TouchEvent;
    if (touch && !moved && Math.hypot(delta.x, delta.y) < 8) {
      ui.setOpenId(id);
      return;
    }
    if (!moved || !over || !onReorder) return;
    haptic("drop");
    const ids = todos.map((todo) => todo._id);
    onReorder(arrayMove(ids, ids.indexOf(id), ids.indexOf(String(over.id))));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={todos.map((todo) => todo._id)} strategy={verticalListSortingStrategy}>
        <div className={cn("-mx-2.5", className)}>
          {todos.map((todo) => (
            <SortableTask key={todo._id} todo={todo} context={context} sortable={sortable} justDragged={justDragged} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
