import { useEffect, useRef } from "react";
import { Draggable } from "@fullcalendar/interaction";
import { GripVertical, Inbox } from "lucide-react";
import type { Todo } from "@features/todos/types/todo-types";

/** Tasks without a day, to drag onto the calendar (a day, or a time in week and day views). */
export default function TaskTray({ tasks, onOpenTask }: { tasks: Todo[]; onOpenTask: (todo: Todo) => void }) {
  const listRef = useRef<HTMLUListElement>(null);

  // FullCalendar's own dragging (works with touch too); the drop is handled by the calendar.
  useEffect(() => {
    if (!listRef.current) return;
    const draggable = new Draggable(listRef.current, {
      itemSelector: "[data-task-id]",
      eventData: (el) => ({ title: el.dataset.title ?? "", duration: "00:30", create: false }),
    });
    return () => draggable.destroy();
  }, []);

  return (
    <aside className="rounded-2xl border border-border bg-card/60 p-3">
      <h2 className="mb-1 flex items-center gap-2 px-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        <Inbox className="h-3.5 w-3.5" /> To schedule
      </h2>
      <p className="mb-2 px-1 text-xs text-muted-foreground">Drag a task onto a day or a time.</p>
      {tasks.length === 0 && <p className="px-1 py-3 text-sm text-muted-foreground">Everything has a day.</p>}
      <ul ref={listRef} className="max-h-[calc(100dvh-20rem)] space-y-0.5 overflow-y-auto">
        {tasks.map((todo) => (
          <li key={todo._id}>
            <div
              data-task-id={todo._id}
              data-title={todo.text}
              onClick={() => onOpenTask(todo)}
              className="group flex cursor-grab items-center gap-1.5 rounded-lg px-1.5 py-1.5 text-sm text-soft hover:bg-secondary active:cursor-grabbing"
            >
              <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50 group-hover:text-muted-foreground" />
              <span className="truncate">{todo.text}</span>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
