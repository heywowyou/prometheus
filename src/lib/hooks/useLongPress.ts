import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent, type SyntheticEvent } from "react";

const HOLD_MS = 450;
/** A finger that drifts further than this is scrolling or dragging, not holding. */
const SLOP_PX = 10;

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
 */
export function useLongPress(onLongPress: () => void, { onRelease = false, disabled = false }: Options = {}) {
  const timer = useRef<number | null>(null);
  const start = useRef<{ x: number; y: number; at: number } | null>(null);
  const swallowClick = useRef(false);
  const callback = useRef(onLongPress);
  useEffect(() => {
    callback.current = onLongPress;
  }, [onLongPress]);

  const clear = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  }, []);
  useEffect(() => clear, [clear]);

  const fire = useCallback(() => {
    swallowClick.current = true;
    start.current = null;
    navigator.vibrate?.(10);
    callback.current();
  }, []);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent) => {
      swallowClick.current = false;
      if (disabled || event.pointerType === "mouse" || !event.isPrimary) return;
      start.current = { x: event.clientX, y: event.clientY, at: Date.now() };
      clear();
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

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: cancel, onClickCapture, onContextMenu };
}
