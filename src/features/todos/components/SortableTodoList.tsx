import type { ComponentProps } from "react";
import { GripVertical } from "lucide-react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@lib/utils";
import { dragHaptics } from "@lib/haptics";
import TodoItem from "./TodoItem";
import type { Todo } from "../types/todo-types";

type ItemHandlers = Omit<ComponentProps<typeof TodoItem>, "todo" | "handle">;

interface SortableTodoListProps extends ItemHandlers {
  todos: Todo[];
  /** Called with every id in the list, in the new order. */
  onReorder: (ids: string[]) => void;
}

function SortableRow({ todo, ...handlers }: ItemHandlers & { todo: Todo }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo._id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "relative border-t border-border py-0.5 transition-opacity",
        (todo.completed || todo.skipped) && !isDragging && "opacity-70",
        isDragging && "z-20 rounded-2xl border-transparent bg-card shadow-xl shadow-overlay/50",
      )}
    >
      <div className="-mx-3">
      <TodoItem
        todo={todo}
        {...handlers}
        handle={
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            aria-label={`Reorder ${todo.text}`}
            onClick={(event) => event.stopPropagation()}
            className="-ml-1.5 mr-0.5 flex h-8 w-5 shrink-0 cursor-grab touch-none items-center justify-center rounded text-muted-foreground/50 opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring active:cursor-grabbing group-hover:opacity-100 touch:opacity-100"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        }
      />
      </div>
    </div>
  );
}

/**
 * A section's tasks, reorderable by dragging the grip (mouse or touch),
 * or with the keyboard: focus the grip, Space to lift, arrows to move, Space
 * to drop, Escape to cancel.
 */
function SortableTodoList({ todos, onReorder, ...handlers }: SortableTodoListProps) {
  const sensors = useSensors(
    // A short distance keeps plain clicks on the grip from starting a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const ids = todos.map((todo) => todo._id);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    onReorder(arrayMove(ids, from, to));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      {...dragHaptics(handleDragEnd)}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div>
          {todos.map((todo) => (
            <SortableRow key={todo._id} todo={todo} {...handlers} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export default SortableTodoList;
