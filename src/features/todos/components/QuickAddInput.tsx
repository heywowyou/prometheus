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
    <div className="border-t border-border py-0.5">
    <div className="-mx-3 flex min-h-[3.5rem] items-center rounded-2xl px-3 transition-colors focus-within:bg-secondary/60 hover:bg-secondary/40">
      <span aria-hidden className="-ml-1.5 mr-0.5 w-5 shrink-0" />
      <Plus className="ml-1.5 mr-[1.125rem] h-5 w-5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
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
        placeholder={
          recurrenceType === "none"
            ? `Add a task: "Pay rent @fri", "Study 45m @tomorrow"`
            : `Add a ${label.toLowerCase()} habit ("Read 30m" makes a timer)`
        }
        aria-label={`Add a ${label.toLowerCase()} task`}
        className="min-w-0 flex-1 bg-transparent font-serif text-[1.1875rem] text-foreground outline-none placeholder:font-sans placeholder:text-sm placeholder:text-muted-foreground disabled:opacity-50"
      />
    </div>
    </div>
  );
}

export default QuickAddInput;
