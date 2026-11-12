import { Link } from "react-router-dom";
import { GripVertical, Pencil, Play } from "lucide-react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
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
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@lib/utils";
import type { Routine } from "../types/workout-types";

interface RoutineListProps {
  routines: Routine[];
  /** Exercise names by id, for the one-line summary. */
  names: Map<string, string>;
  onStart: (routine: Routine) => void;
  onReorder: (ids: string[]) => void;
  starting: boolean;
}

interface RowProps {
  routine: Routine;
  names: Map<string, string>;
  onStart: (routine: Routine) => void;
  starting: boolean;
}

function RoutineRow({ routine, names, onStart, starting }: RowProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: routine._id });

  const summary = routine.exercises
    .map((e) => names.get(e.exerciseId))
    .filter(Boolean)
    .join(" · ");

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "flex items-center gap-1 rounded-2xl border border-border bg-card p-2 pl-1",
        isDragging && "relative z-20 shadow-lg shadow-overlay/40",
      )}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${routine.name}`}
        className="flex h-11 w-7 shrink-0 cursor-grab touch-none items-center justify-center rounded text-muted-foreground/50 hover:text-foreground active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <Link to={`/workouts/routines/${routine._id}`} className="min-w-0 flex-1 py-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate font-semibold text-foreground">{routine.name}</span>
          <Pencil className="h-3 w-3 shrink-0 text-muted-foreground" />
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {routine.exercises.length} exercise{routine.exercises.length === 1 ? "" : "s"}
          {summary && ` · ${summary}`}
        </span>
      </Link>
      <button
        type="button"
        disabled={starting}
        onClick={() => onStart(routine)}
        aria-label={`Start ${routine.name}`}
        className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-rating px-4 text-sm font-semibold text-rating-foreground transition-colors hover:bg-rating-hover disabled:opacity-50"
      >
        <Play className="h-4 w-4 fill-current" /> Start
      </button>
    </li>
  );
}

/** Routines in Start-tab order; drag the grip (touch: press and hold) to reorder. */
function RoutineList({ routines, names, onStart, onReorder, starting }: RoutineListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    // A short hold, so a scroll that starts on the grip still scrolls.
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = routines.map((r) => r._id);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from >= 0 && to >= 0) onReorder(arrayMove(ids, from, to));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">
          {routines.map((routine) => (
            <RoutineRow
              key={routine._id}
              routine={routine}
              names={names}
              onStart={onStart}
              starting={starting}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

export default RoutineList;
