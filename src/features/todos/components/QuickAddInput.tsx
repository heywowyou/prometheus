import { useState } from "react";
import { Plus } from "lucide-react";
import type { CreateTodoPayload } from "../api/todos-api";
import type { RecurrenceType } from "../types/todo-types";
import { parseQuickAdd } from "../quick-add";

interface QuickAddInputProps {
  recurrenceType: RecurrenceType;
  /** Shown in the placeholder, e.g. "daily". */
  label: string;
  onCreate: (payload: CreateTodoPayload) => Promise<unknown>;
}

/** Inline "add a task" field at the bottom of a recurrence column. */
function QuickAddInput({ recurrenceType, label, onCreate }: QuickAddInputProps) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const payload = parseQuickAdd(value, recurrenceType);
    if (!payload || busy) return;
    setBusy(true);
    try {
      await onCreate(payload);
      setValue("");
    } catch {
      // Toasted by the query client; keep the text so it can be retried.
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2 rounded-xl border border-dashed border-border px-3 py-2 text-sm transition-colors focus-within:border-muted-foreground">
      <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
      <input
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            void submit();
          } else if (event.key === "Escape") {
            setValue("");
            event.currentTarget.blur();
          }
        }}
        disabled={busy}
        placeholder={`Add ${label.toLowerCase()} task — "Read 30m" for a timer`}
        aria-label={`Add a ${label.toLowerCase()} task`}
        className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-50"
      />
    </div>
  );
}

export default QuickAddInput;
