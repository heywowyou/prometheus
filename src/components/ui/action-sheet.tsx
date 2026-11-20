import { useRef, useState, type ComponentType, type SyntheticEvent } from "react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@components/ui/sheet";
import { haptic } from "@lib/haptics";
import { cn } from "@lib/utils";

export interface SheetAction {
  key: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  onSelect: () => void;
  destructive?: boolean;
  /**
   * Destructive actions ask for a second tap ("Tap again to delete") unless
   * they are easy to undo, like moving a note to the trash.
   */
  confirm?: boolean;
}

// React sends events from the sheet (a portal) up the component tree, to
// the row that opened it: a tap on an action would also tick the habit. Clicks
// inside the sheet stop here. (Not on the overlay: the sheet needs that click
// to reach the document to close on a tap outside; rows ignore it instead.)
const stop = (event: SyntheticEvent) => event.stopPropagation();

/**
 * The phone's press-and-hold menu: a bottom sheet with one big row per action,
 * destructive ones apart at the bottom. An action runs once the sheet has
 * closed, so one that opens a dialog or focuses an input isn't fighting the
 * sheet's focus trap. Swipe down or tap outside to dismiss.
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
  const [armed, setArmed] = useState<string | null>(null);
  // A half-confirmed delete doesn't survive closing the sheet.
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (!open) setArmed(null);
  }

  const safe = actions.filter((action) => !action.destructive);
  const destructive = actions.filter((action) => action.destructive);

  const choose = (action: SheetAction) => {
    if (action.destructive && action.confirm !== false && armed !== action.key) {
      haptic("warning");
      setArmed(action.key);
      return;
    }
    haptic(action.destructive ? "light" : "selection");
    pending.current = action.onSelect;
    onOpenChange(false);
  };

  const row = (action: SheetAction) => {
    const { key, label, icon: Icon, destructive: isDestructive } = action;
    const isArmed = armed === key;
    return (
      <li key={key}>
        <button
          type="button"
          onClick={() => choose(action)}
          className={cn(
            "flex min-h-[3.25rem] w-full items-center gap-3.5 rounded-2xl px-3.5 text-left text-[15px] transition-[background-color,transform] duration-150 active:scale-[0.98] active:bg-secondary",
            isDestructive ? "text-destructive" : "text-foreground",
            isArmed && "bg-destructive/15 font-medium",
          )}
        >
          <Icon className={cn("h-[19px] w-[19px] shrink-0", isDestructive ? "" : "text-soft")} />
          {isArmed ? `Tap again to ${label.charAt(0).toLowerCase()}${label.slice(1)}` : label}
        </button>
      </li>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="gap-2"
        onClick={stop}
        onDoubleClick={stop}
        onContextMenu={stop}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          const run = pending.current;
          pending.current = null;
          run?.();
        }}
      >
        <div className="px-1 pb-1 pr-10">
          <SheetTitle className="truncate font-serif text-[1.375rem] font-normal leading-snug">{title}</SheetTitle>
          <SheetDescription className={cn("mt-0.5 truncate", !description && "sr-only")}>
            {description ?? "Actions"}
          </SheetDescription>
        </div>
        <ul className="-mx-1 flex flex-col">{safe.map(row)}</ul>
        {destructive.length > 0 && (
          <>
            {safe.length > 0 && <div aria-hidden className="mx-2 h-px bg-border" />}
            <ul className="-mx-1 flex flex-col">{destructive.map(row)}</ul>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
