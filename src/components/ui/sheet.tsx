import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@lib/utils";
import { haptic } from "@lib/haptics";

/**
 * A dialog that slides up from the bottom edge — the phone-friendly picker
 * surface (shadcn "sheet", bottom side only). Centred and capped in width on
 * larger screens; padded for the iPhone home indicator.
 */
const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;
const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-overlay/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

/** Fields and the editor keep their own touch gestures (selecting text). */
const NO_SWIPE = "input, textarea, select, [contenteditable=true], [data-no-swipe]";
const CLOSE_DISTANCE_PX = 110;
const CLOSE_VELOCITY = 0.55; // px per ms

/** True when the touch starts inside something scrolled away from its top. */
function scrolledAboveTop(target: Element, root: HTMLElement): boolean {
  for (let node: Element | null = target; node; node = node.parentElement) {
    if (node instanceof HTMLElement && node.scrollTop > 0) {
      const { overflowY } = getComputedStyle(node);
      if (overflowY === "auto" || overflowY === "scroll") return true;
    }
    if (node === root) break;
  }
  return false;
}

/**
 * Swipe a sheet down to close it, like a native one. Only a downward swipe
 * that starts with the content scrolled to the top counts; anything else is
 * left to scrolling. The sheet follows the finger, then either slides away
 * or springs back.
 */
function useSwipeToClose(sheet: HTMLDivElement | null, close: () => void) {
  React.useEffect(() => {
    if (!sheet) return;
    let startX = 0;
    let startY = 0;
    let startAt = 0;
    let offset = 0;
    let state: "idle" | "deciding" | "dragging" = "idle";

    const reset = () => {
      sheet.style.transition = "transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)";
      sheet.style.transform = "";
      state = "idle";
    };

    const onStart = (event: TouchEvent) => {
      state = "idle";
      if (event.touches.length !== 1) return;
      const target = event.target as Element;
      if (target.closest(NO_SWIPE) || scrolledAboveTop(target, sheet)) return;
      const touch = event.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      startAt = performance.now();
      offset = 0;
      state = "deciding";
    };

    const onMove = (event: TouchEvent) => {
      if (state === "idle") return;
      const touch = event.touches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      if (state === "deciding") {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        if (dy <= 0 || Math.abs(dx) > Math.abs(dy)) {
          state = "idle";
          return;
        }
        state = "dragging";
        sheet.style.transition = "none";
      }
      event.preventDefault();
      offset = Math.max(0, dy);
      sheet.style.transform = `translateY(${offset}px)`;
    };

    const onEnd = () => {
      if (state !== "dragging") {
        state = "idle";
        return;
      }
      const velocity = offset / Math.max(1, performance.now() - startAt);
      if (offset > CLOSE_DISTANCE_PX || (offset > 32 && velocity > CLOSE_VELOCITY)) {
        state = "idle";
        haptic("selection");
        sheet.style.transition = "transform 200ms cubic-bezier(0.4, 0, 1, 1)";
        sheet.style.transform = "translateY(105%)";
        // Already off screen: skip the exit animation, or it would replay.
        window.setTimeout(() => {
          sheet.style.animation = "none";
          close();
        }, 190);
      } else {
        reset();
      }
    };

    sheet.addEventListener("touchstart", onStart, { passive: true });
    sheet.addEventListener("touchmove", onMove, { passive: false });
    sheet.addEventListener("touchend", onEnd);
    sheet.addEventListener("touchcancel", reset);
    return () => {
      sheet.removeEventListener("touchstart", onStart);
      sheet.removeEventListener("touchmove", onMove);
      sheet.removeEventListener("touchend", onEnd);
      sheet.removeEventListener("touchcancel", reset);
    };
  }, [sheet, close]);
}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>
>(({ className, children, ...props }, forwardedRef) => {
  // State, not a ref: the content mounts later than this component (only
  // once the sheet opens), and the swipe listeners must follow it.
  const [node, setNode] = React.useState<HTMLDivElement | null>(null);
  const closeRef = React.useRef<HTMLButtonElement | null>(null);
  const setRef = React.useCallback(
    (element: HTMLDivElement | null) => {
      setNode(element);
      if (typeof forwardedRef === "function") forwardedRef(element);
      else if (forwardedRef) forwardedRef.current = element;
    },
    [forwardedRef],
  );
  const close = React.useCallback(() => closeRef.current?.click(), []);
  useSwipeToClose(node, close);

  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        ref={setRef}
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[85dvh] w-full max-w-lg flex-col gap-4 overscroll-contain rounded-t-3xl border border-b-0 border-border bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-lg duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
          className,
        )}
        {...props}
      >
        {/* The grabber: a wider touch strip than it looks, for the swipe down. */}
        <div aria-hidden className="-mx-4 -mt-4 flex h-6 shrink-0 items-end justify-center pt-2">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>
        {children}
        <SheetPrimitive.Close
          ref={closeRef}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  );
});
SheetContent.displayName = SheetPrimitive.Content.displayName;

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1 pr-8 text-left", className)} {...props} />
);
SheetHeader.displayName = "SheetHeader";

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
};
