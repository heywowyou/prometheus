import { Check } from "lucide-react";
import { cn } from "@lib/utils";

/** Things' rounded square: amber ring when due today, red when overdue. */
export default function TaskCheckbox({
  checked,
  tone = "default",
  label,
  onToggle,
  className,
}: {
  checked: boolean;
  tone?: "default" | "due" | "overdue";
  label: string;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      className={cn(
        "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border-[1.5px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        checked
          ? "border-rating bg-rating text-rating-foreground"
          : tone === "overdue"
            ? "border-destructive/80 hover:bg-destructive/10"
            : tone === "due"
              ? "border-warning/80 hover:bg-warning/10"
              : "border-muted-foreground/70 hover:border-foreground",
        className,
      )}
    >
      {checked && <Check className="h-3 w-3" strokeWidth={3} />}
    </button>
  );
}
