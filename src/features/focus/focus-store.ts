import { useSyncExternalStore } from "react";

/**
 * A Pomodoro timer: focus blocks with short breaks, and a long break after
 * every few blocks. One timer for the whole app, kept in localStorage so it
 * survives reloads and keeps counting while another page is open.
 */

export type FocusPhase = "focus" | "short" | "long";

export interface FocusSettings {
  focus: number;
  short: number;
  long: number;
  /** Focus blocks before a long break. */
  rounds: number;
}

export interface FocusState {
  phase: FocusPhase;
  /** Set while running: when the phase ends (epoch ms). */
  endsAt: number | null;
  /** Set while paused: ms left. */
  remainingMs: number | null;
  /** Focus blocks finished in the current set (resets after a long break). */
  round: number;
  /** Focus blocks finished today, and which day that count is for. */
  doneToday: number;
  day: string;
  settings: FocusSettings;
}

export const DEFAULT_SETTINGS: FocusSettings = { focus: 25, short: 5, long: 15, rounds: 4 };

export const PHASE_LABELS: Record<FocusPhase, string> = {
  focus: "Focus",
  short: "Short break",
  long: "Long break",
};

const STORAGE_KEY = "focus-timer";

const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

const initial = (): FocusState => ({
  phase: "focus",
  endsAt: null,
  remainingMs: null,
  round: 0,
  doneToday: 0,
  day: today(),
  settings: DEFAULT_SETTINGS,
});

const isState = (value: unknown): value is FocusState => {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<FocusState>;
  return (
    (v.phase === "focus" || v.phase === "short" || v.phase === "long") &&
    typeof v.round === "number" &&
    typeof v.settings === "object" &&
    v.settings !== null &&
    typeof v.settings.focus === "number"
  );
};

const load = (): FocusState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (!isState(parsed)) return initial();
    return parsed.day === today() ? parsed : { ...parsed, doneToday: 0, day: today() };
  } catch {
    return initial();
  }
};

let state: FocusState = typeof window === "undefined" ? initial() : load();
const listeners = new Set<() => void>();
type FinishHandler = (finished: FocusPhase, next: FocusPhase) => void;
const finishHandlers = new Set<FinishHandler>();

const emit = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Persistence is a convenience.
  }
  for (const listener of listeners) listener();
};

const set = (next: FocusState) => {
  state = next;
  emit();
  syncTicker();
};

export const phaseMs = (phase: FocusPhase, settings: FocusSettings = state.settings) =>
  settings[phase] * 60_000;

/** Ms left in the current phase at `now`. */
export const remainingAt = (s: FocusState, now: number): number => {
  if (s.endsAt !== null) return Math.max(0, s.endsAt - now);
  return s.remainingMs ?? phaseMs(s.phase, s.settings);
};

export const isRunning = (s: FocusState) => s.endsAt !== null;
/** Started at some point in this phase (running or paused). */
export const isStarted = (s: FocusState) => s.endsAt !== null || s.remainingMs !== null;

/** Ends the current phase and sets up the next one (not started). */
const advance = (s: FocusState, counted: boolean): FocusState => {
  const day = today();
  const base = s.day === day ? s : { ...s, doneToday: 0, day };
  if (s.phase === "focus") {
    const round = counted ? base.round + 1 : base.round;
    const next: FocusPhase = round >= base.settings.rounds ? "long" : "short";
    return {
      ...base,
      phase: next,
      round,
      doneToday: counted ? base.doneToday + 1 : base.doneToday,
      endsAt: null,
      remainingMs: null,
    };
  }
  return { ...base, phase: "focus", round: s.phase === "long" ? 0 : base.round, endsAt: null, remainingMs: null };
};

let ticker: ReturnType<typeof setInterval> | null = null;

const checkFinished = () => {
  if (state.endsAt === null || Date.now() < state.endsAt) return;
  const finished = state.phase;
  set(advance(state, true));
  for (const handler of finishHandlers) handler(finished, state.phase);
};

function syncTicker() {
  if (state.endsAt !== null && !ticker) {
    ticker = setInterval(checkFinished, 1_000);
  } else if (state.endsAt === null && ticker) {
    clearInterval(ticker);
    ticker = null;
  }
}

if (typeof window !== "undefined") {
  syncTicker();
  // A phase that ended while the app was closed is settled on the next tick.
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    state = load();
    for (const listener of listeners) listener();
    syncTicker();
  });
  document.addEventListener("visibilitychange", checkFinished);
}

export const focusActions = {
  start: () => {
    const ms = remainingAt(state, Date.now());
    set({ ...state, endsAt: Date.now() + ms, remainingMs: null });
  },
  pause: () => {
    if (state.endsAt === null) return;
    set({ ...state, remainingMs: remainingAt(state, Date.now()), endsAt: null });
  },
  /** Back to the full length of the current phase, stopped. */
  reset: () => set({ ...state, endsAt: null, remainingMs: null }),
  /** Ends the phase early. A focus block cut short doesn't count. */
  skip: () => set(advance(state, false)),
  /** Picks a phase by hand, stopped. */
  choose: (phase: FocusPhase) => set({ ...state, phase, endsAt: null, remainingMs: null }),
  updateSettings: (patch: Partial<FocusSettings>) => {
    const settings = { ...state.settings, ...patch };
    // A stopped timer shows the new length straight away.
    set({ ...state, settings, ...(isStarted(state) ? {} : { remainingMs: null }) });
  },
};

export const onFocusFinish = (handler: FinishHandler) => {
  finishHandlers.add(handler);
  return () => {
    finishHandlers.delete(handler);
  };
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useFocusState = (): FocusState => useSyncExternalStore(subscribe, () => state);

export const formatRemaining = (ms: number) => {
  const total = Math.ceil(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};
