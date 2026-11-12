import { useCallback, useEffect, useRef, useState } from "react";
import { useNow } from "@lib/hooks/useNow";

const STORAGE_KEY = "prometheus.rest-timer";

interface RestState {
  /** Epoch ms when the rest is over. */
  endsAt: number;
  /** Length of the whole rest, for the progress ring. */
  totalMs: number;
}

const load = (): RestState | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as Partial<RestState>;
    if (typeof state.endsAt !== "number" || typeof state.totalMs !== "number") return null;
    return state.endsAt > Date.now() ? (state as RestState) : null;
  } catch {
    return null;
  }
};

const persist = (state: RestState | null) => {
  try {
    if (state) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // The timer still runs for this page view.
  }
};

type AudioContextCtor = typeof AudioContext;

/**
 * Short double beep, scheduled on the audio clock rather than a JS timer so
 * it still fires on time when iOS throttles timers. The context is created
 * on a tap (set tick), which is what lets iOS play it at all.
 */
class Beeper {
  private context: AudioContext | null = null;
  private scheduled: OscillatorNode[] = [];

  private ensureContext(): AudioContext | null {
    if (this.context) return this.context;
    const Ctor: AudioContextCtor | undefined =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
    if (!Ctor) return null;
    this.context = new Ctor();
    return this.context;
  }

  schedule(inMs: number) {
    this.cancel();
    const ctx = this.ensureContext();
    if (!ctx) return;
    void ctx.resume();
    const at = ctx.currentTime + Math.max(0, inMs) / 1000;
    for (const offset of [0, 0.25]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, at + offset);
      gain.gain.exponentialRampToValueAtTime(0.25, at + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + offset + 0.18);
      osc.connect(gain).connect(ctx.destination);
      osc.start(at + offset);
      osc.stop(at + offset + 0.2);
      this.scheduled.push(osc);
    }
  }

  cancel() {
    for (const osc of this.scheduled) {
      try {
        osc.stop();
      } catch {
        // Already stopped.
      }
    }
    this.scheduled = [];
  }
}

/**
 * Rest countdown between sets. Stored as an end timestamp, so it survives the
 * phone locking, the app being backgrounded and page reloads.
 */
export const useRestTimer = () => {
  const [state, setState] = useState<RestState | null>(load);
  const beeper = useRef<Beeper | null>(null);
  const now = useNow(state !== null, 250);

  const remainingMs = state ? Math.max(0, state.endsAt - now) : 0;
  const finished = state !== null && remainingMs === 0;

  const update = useCallback((next: RestState | null) => {
    setState(next);
    persist(next);
    beeper.current ??= new Beeper();
    if (next) beeper.current.schedule(next.endsAt - Date.now());
    else beeper.current.cancel();
  }, []);

  /** Must be called from a tap (it unlocks audio on iOS). */
  const start = useCallback(
    (seconds: number) => {
      if (seconds <= 0) return;
      update({ endsAt: Date.now() + seconds * 1000, totalMs: seconds * 1000 });
    },
    [update],
  );

  const adjust = useCallback(
    (deltaSec: number) => {
      if (!state) return;
      const endsAt = Math.max(Date.now(), state.endsAt + deltaSec * 1000);
      update({ endsAt, totalMs: Math.max(1000, state.totalMs + deltaSec * 1000) });
    },
    [state, update],
  );

  const skip = useCallback(() => update(null), [update]);

  // Rest over: buzz where supported (not iOS), then clear after a moment.
  useEffect(() => {
    if (!finished) return;
    navigator.vibrate?.([200, 100, 200]);
    const timeout = setTimeout(() => {
      setState(null);
      persist(null);
    }, 3_000);
    return () => clearTimeout(timeout);
  }, [finished]);

  useEffect(() => () => beeper.current?.cancel(), []);

  return {
    active: state !== null,
    finished,
    remainingMs,
    fraction: state ? remainingMs / state.totalMs : 0,
    start,
    adjust,
    skip,
  };
};
