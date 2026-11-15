import type { LucideIcon } from "lucide-react";
import { Button } from "@components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
  action?: { label: string; onClick: () => void };
}

/** The dashed-border empty panel used by every subapp listing. */
function EmptyState({ icon: Icon, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border px-6 py-20 text-center">
      <Icon className="h-9 w-9 text-muted-foreground opacity-50" strokeWidth={1.5} />
      <p className="max-w-sm font-serif text-xl text-soft">{message}</p>
      {action && (
        <Button variant="outline" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
