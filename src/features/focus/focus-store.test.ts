import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The store keeps module state; load a fresh copy for each test.
const loadStore = async () => {
  vi.resetModules();
  return import("./focus-store");
};

describe("focus timer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 16, 9, 0));
  });
  afterEach(() => vi.useRealTimers());

  it("counts down and moves to a short break when a focus block ends", async () => {
    const store = await loadStore();
    const finished = vi.fn();
    store.onFocusFinish(finished);
    store.focusActions.start();
    vi.advanceTimersByTime(25 * 60_000 + 1_000);
    expect(finished).toHaveBeenCalledWith("focus", "short");
  });

  it("pauses and resumes with the time left", async () => {
    const store = await loadStore();
    store.focusActions.start();
    vi.advanceTimersByTime(10 * 60_000);
    store.focusActions.pause();
    vi.advanceTimersByTime(60 * 60_000);
    const saved = JSON.parse(localStorage.getItem("focus-timer") ?? "{}");
    expect(store.remainingAt(saved, Date.now())).toBe(15 * 60_000);
  });

  it("does not count a skipped focus block", async () => {
    const store = await loadStore();
    store.focusActions.start();
    store.focusActions.skip();
    const saved = JSON.parse(localStorage.getItem("focus-timer") ?? "{}");
    expect(saved).toMatchObject({ phase: "short", round: 0, doneToday: 0 });
  });
});
