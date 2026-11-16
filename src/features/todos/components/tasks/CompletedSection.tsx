import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCheck, ChevronDown } from "lucide-react";
import { cn } from "@lib/utils";
import type { LogbookScope } from "../../api/todos-api";
import { useLogbook } from "../../hooks/useTodoLists";
import { useRowContext } from "../../hooks/useTaskActions";
import { useTasksUi } from "../../tasks-ui";
import type { useTaskData } from "../../hooks/useTaskData";

type TaskData = ReturnType<typeof useTaskData>;
import TaskRow from "./TaskRow";

const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
};

/**
 * The foot of a list: its finished tasks, folded away until asked for. Tasks
 * done today already sit in the list itself, so this shows the earlier ones.
 * Without a scope it links to the full Completed list.
 */
export default function CompletedSection({ data, scope }: { data: TaskData; scope?: LogbookScope }) {
  const [open, setOpen] = useState(false);
  const context = useRowContext(data, { showWhen: false });
  const ui = useTasksUi();
  const logbook = useLogbook(scope ?? {}, Boolean(scope) && open);

  if (!scope) {
    return (
      <Link
        to="/todos/completed"
        className="mt-8 flex items-center gap-2 border-t border-border pt-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <CheckCheck className="h-4 w-4" /> Completed tasks
      </Link>
    );
  }

  const cutoff = startOfToday();
  const earlier = logbook.tasks.filter((todo) => todo.completedAt && new Date(todo.completedAt).getTime() < cutoff);

  return (
    <section className="mt-8 border-t border-border pt-2">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <CheckCheck className="h-4 w-4" />
        {open ? "Hide completed" : "Show completed"}
        <ChevronDown className={cn("h-4 w-4 transition-transform", !open && "-rotate-90")} />
      </button>
      {open &&
        (logbook.loading ? (
          <div className="mt-2 h-10 animate-pulse rounded-xl bg-card" />
        ) : earlier.length === 0 ? (
          <p className="py-3 text-sm text-muted-foreground">Nothing finished here before today.</p>
        ) : (
          <div className="-mx-2.5 mt-1">
            {earlier.map((todo) => (
              <TaskRow
                key={todo._id}
                todo={todo}
                context={context}
                open={ui.openId === todo._id}
                onOpenChange={(value) => ui.setOpenId(value ? todo._id : null)}
              />
            ))}
            {logbook.hasMore && (
              <button
                type="button"
                disabled={logbook.loadingMore}
                onClick={logbook.loadMore}
                className="ml-2.5 mt-2 text-sm text-muted-foreground hover:text-foreground"
              >
                {logbook.loadingMore ? "Loading…" : "Show more"}
              </button>
            )}
          </div>
        ))}
    </section>
  );
}
