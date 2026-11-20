/**
 * Haptic feedback for the phone.
 *
 * - Android (Chrome, Firefox, Samsung): the Vibration API, with short patterns.
 * - iPhone: Safari has no vibration API, but toggling an
 *   `<input type="checkbox" switch>` plays the system's Taptic "tick". We keep
 *   one hidden switch with a label and click the label. iOS only allows it
 *   during a user gesture (a tap, a key press, within a few seconds of one),
 *   so a haptic asked for outside one (a hold that fires while the finger is
 *   still down, before any tap) waits for the finger to lift.
 *   iOS has a single strength; patterns are played as repeated ticks.
 * - Desktop and everything else: nothing.
 *
 * Call `haptic()` synchronously from the event handler of the gesture it
 * answers, before any `await`, so iOS still counts it as part of the gesture.
 */

export type HapticKind =
  /** A light tick: tab change, chip, a selection moving one step. */
  | "selection"
  /** A plain tap on a control: start a timer, open a sheet. */
  | "light"
  /** Something done: a task or habit ticked. */
  | "success"
  /** A hold reached its threshold, or a drag lifted a row. */
  | "hold"
  /** A dragged row dropped in its new place. */
  | "drop"
  /** About to do something that can't easily be undone. */
  | "warning"
  /** Something failed. */
  | "error";

/** Android patterns in ms (on, off, on…). */
const VIBRATION: Record<HapticKind, number | number[]> = {
  selection: 6,
  light: 10,
  success: [12, 60, 18],
  hold: 18,
  drop: 12,
  warning: [20, 80, 20],
  error: [25, 50, 25, 50, 25],
};

/** iPhone: how many ticks, and the gap between them. */
const TICKS: Record<HapticKind, number> = {
  selection: 1,
  light: 1,
  success: 2,
  hold: 1,
  drop: 1,
  warning: 2,
  error: 3,
};
const TICK_GAP_MS = 70;

const STORAGE_KEY = "haptics";

let enabledCache: boolean | null = null;

export function hapticsEnabled(): boolean {
  if (enabledCache !== null) return enabledCache;
  try {
    enabledCache = localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    enabledCache = true;
  }
  return enabledCache;
}

export function setHapticsEnabled(on: boolean) {
  enabledCache = on;
  try {
    localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  } catch {
    // Private mode: the choice lasts for this visit.
  }
  if (on) haptic("success");
}

const isBrowser = typeof window !== "undefined" && typeof navigator !== "undefined";

const isIOS = (): boolean =>
  isBrowser &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

const canVibrate = (): boolean => isBrowser && typeof navigator.vibrate === "function";

/** Phones and tablets: a touch screen without a mouse as the main pointer. */
const isTouchDevice = (): boolean =>
  isBrowser && typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;

/** Whether this device can play haptics at all (shown in Profile). */
export function hapticsSupported(): boolean {
  return isTouchDevice() && (canVibrate() || isIOS());
}

let switchLabel: HTMLLabelElement | null = null;

function iosSwitch(): HTMLLabelElement | null {
  if (switchLabel?.isConnected) return switchLabel;
  if (!document.body) return null;
  const label = document.createElement("label");
  label.setAttribute("aria-hidden", "true");
  label.dataset.haptics = "";
  Object.assign(label.style, {
    position: "fixed",
    width: "1px",
    height: "1px",
    overflow: "hidden",
    opacity: "0",
    pointerEvents: "none",
    left: "-100px",
    top: "0",
  });
  const input = document.createElement("input");
  input.type = "checkbox";
  input.setAttribute("switch", "");
  input.tabIndex = -1;
  // Keep the synthetic click to ourselves: no app handler should see it.
  input.addEventListener("click", (event) => event.stopPropagation());
  label.addEventListener("click", (event) => event.stopPropagation());
  label.append(input);
  document.body.append(label);
  switchLabel = label;
  return label;
}

function tick() {
  iosSwitch()?.click();
}

/** iOS needs a live user gesture; `navigator.userActivation` says if there is one. */
function hasGesture(): boolean {
  const activation = (navigator as Navigator & { userActivation?: { isActive: boolean } }).userActivation;
  return activation ? activation.isActive : true;
}

let pending: { kind: HapticKind; at: number } | null = null;
/** A deferred haptic only plays if the finger lifts soon after (a hold ending). */
const PENDING_MS = 1_500;

function playOnNextGesture(kind: HapticKind) {
  const first = pending === null;
  pending = { kind, at: Date.now() };
  if (!first) return;
  const fire = () => {
    window.removeEventListener("touchend", fire, true);
    window.removeEventListener("pointerup", fire, true);
    const queued = pending;
    pending = null;
    if (queued && Date.now() - queued.at < PENDING_MS) playIOS(queued.kind);
  };
  window.addEventListener("touchend", fire, true);
  window.addEventListener("pointerup", fire, true);
}

function playIOS(kind: HapticKind) {
  tick();
  for (let index = 1; index < TICKS[kind]; index += 1) {
    window.setTimeout(tick, TICK_GAP_MS * index);
  }
}

/** Play a haptic. Safe to call anywhere: it does nothing where unsupported. */
export function haptic(kind: HapticKind = "light") {
  if (!isBrowser || !hapticsEnabled() || !isTouchDevice()) return;
  try {
    if (canVibrate()) {
      navigator.vibrate(VIBRATION[kind]);
      return;
    }
    if (!isIOS()) return;
    if (hasGesture()) playIOS(kind);
    else playOnNextGesture(kind);
  } catch {
    // Feedback is a nicety; never let it break the action it decorates.
  }
}

type DragIds = { active: { id: unknown }; over: { id: unknown } | null };

/**
 * Drag and drop feel (spread on a dnd-kit `DndContext`): a tick when the row
 * lifts, a lighter one each time it passes another, and one on the drop.
 * Pass the list's own `onDragEnd`; it still runs.
 */
export function dragHaptics<E extends DragIds>(onDragEnd?: (event: E) => void) {
  return {
    onDragStart: () => haptic("hold"),
    onDragOver: ({ active, over }: DragIds) => {
      if (over && over.id !== active.id) haptic("selection");
    },
    onDragEnd: (event: E) => {
      if (event.over && event.over.id !== event.active.id) haptic("drop");
      onDragEnd?.(event);
    },
  };
}
