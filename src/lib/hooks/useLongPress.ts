import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent, type SyntheticEvent } from "react";
import { haptic } from "@lib/haptics";

export const HOLD_MS = 420;
/** A finger that drifts further than this is scrolling or dragging, not holding. */
const SLOP_PX = 10;
/**
 * The press look (a slight sink) starts after this, so a finger that starts
 * a scroll on a row doesn't make it flicker.
 */
const PRESS_LOOK_MS = 90;

const fromHere = (event: SyntheticEvent) =>
  event.currentTarget instanceof Node && event.target instanceof Node && event.currentTarget.contains(event.target);

interface Options {
  /**
   * Fire when a long, still press is released rather than while it is held.
   * For rows that are also draggable: holding then moving drags, holding then
   * lifting opens the menu.
   */
  onRelease?: boolean;
  disabled?: boolean;
}

/**
 * Press and hold on touch screens. Mouse input is ignored, so desktop clicks
 * and right-clicks behave as before. The click that ends a long press is
 * swallowed, so the row's tap action doesn't also run.
 *
 * While the finger is down the element gets `data-pressing` (styled in
 * index.css: it sinks a little over the hold), and the hold ends with a
 * haptic tick, like a native context menu.
 */
export function useLongPress(onLongPress: () => void, { onRelease = false, disabled = false }: Options = {}) {
  const timer = useRef<number | null>(null);
  const lookTimer = useRef<number | null>(null);
  const target = useRef<HTMLElement | null>(null);
  const start = useRef<{ x: number; y: number; at: number } | null>(null);
  const swallowClick = useRef(false);
  const callback = useRef(onLongPress);
  useEffect(() => {
    callback.current = onLongPress;
  }, [onLongPress]);

  const unpress = useCallback(() => {
    if (lookTimer.current !== null) window.clearTimeout(lookTimer.current);
    lookTimer.current = null;
    target.current?.removeAttribute("data-pressing");
  }, []);

  const clear = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    unpress();
  }, [unpress]);
  useEffect(() => clear, [clear]);

  const fire = useCallback(() => {
    swallowClick.current = true;
    start.current = null;
    unpress();
    haptic("hold");
    callback.current();
  }, [unpress]);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent) => {
      swallowClick.current = false;
      if (disabled || event.pointerType === "mouse" || !event.isPrimary) return;
      // Events from a portal (the sheet this hold opened) bubble here through
      // React, not through the page: they aren't presses on this element.
      if (!fromHere(event)) return;
      start.current = { x: event.clientX, y: event.clientY, at: Date.now() };
      clear();
      target.current = event.currentTarget as HTMLElement;
      lookTimer.current = window.setTimeout(() => {
        lookTimer.current = null;
        target.current?.setAttribute("data-pressing", "");
      }, PRESS_LOOK_MS);
      if (!onRelease) timer.current = window.setTimeout(fire, HOLD_MS);
    },
    [clear, disabled, fire, onRelease],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent) => {
      if (!start.current) return;
      if (Math.hypot(event.clientX - start.current.x, event.clientY - start.current.y) > SLOP_PX) {
        start.current = null;
        clear();
      }
    },
    [clear],
  );

  const onPointerUp = useCallback(() => {
    clear();
    if (onRelease && start.current && Date.now() - start.current.at >= HOLD_MS) fire();
    start.current = null;
  }, [clear, fire, onRelease]);

  const cancel = useCallback(() => {
    start.current = null;
    clear();
  }, [clear]);

  const onClickCapture = useCallback((event: SyntheticEvent) => {
    if (!swallowClick.current) return;
    swallowClick.current = false;
    event.preventDefault();
    event.stopPropagation();
  }, []);

  // Android opens a context menu on long press; the hold is ours.
  const onContextMenu = useCallback(
    (event: SyntheticEvent) => {
      if (!disabled && (start.current || swallowClick.current)) event.preventDefault();
    },
    [disabled],
  );

  return {
    "data-press": "",
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: cancel,
    onPointerLeave: cancel,
    onClickCapture,
    onContextMenu,
  };
}
