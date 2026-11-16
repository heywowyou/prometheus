import { useRef, type ComponentType } from "react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@components/ui/sheet";
import { cn } from "@lib/utils";

export interface SheetAction {
  key: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  onSelect: () => void;
  destructive?: boolean;
}

/**
 * The phone's press-and-hold menu: a bottom sheet with one big row per action.
 * An action runs once the sheet has closed, so one that opens a dialog or
 * focuses an input isn't fighting the sheet's focus trap.
 */
export function ActionSheet({
  open,
  onOpenChange,
  title,
  description,
  actions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  actions: SheetAction[];
}) {
  const pending = useRef<(() => void) | null>(null);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="gap-3"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          const run = pending.current;
          pending.current = null;
          run?.();
        }}
      >
        <div className="pr-8">
          <SheetTitle className="truncate font-serif text-xl font-normal">{title}</SheetTitle>
          <SheetDescription className={cn(!description && "sr-only")}>{description ?? "Actions"}</SheetDescription>
        </div>
        <ul className="-mx-1 flex flex-col">
          {actions.map(({ key, label, icon: Icon, onSelect, destructive }) => (
            <li key={key}>
              <button
                type="button"
                onClick={() => {
                  pending.current = onSelect;
                  onOpenChange(false);
                }}
                className={cn(
                  "flex w-full items-center gap-3.5 rounded-xl px-3 py-3 text-left text-[15px] transition-colors active:bg-secondary",
                  destructive ? "text-destructive" : "text-foreground",
                )}
              >
                <Icon className={cn("h-[18px] w-[18px] shrink-0", destructive ? "" : "text-soft")} />
                {label}
              </button>
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
