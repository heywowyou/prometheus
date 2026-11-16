import { describe, expect, it } from "vitest";
import { recentCycles } from "./habit-dots";

// Wednesday 18 November 2026, local time.
const now = new Date(2026, 10, 18, 12, 0);

describe("recentCycles for daily habits", () => {
  it("shows this week, Monday to Sunday", () => {
    const cycles = recentCycles("daily", new Set(), [], now);
    expect(cycles.map((cycle) => cycle.key)).toEqual([
      "2026-11-16",
      "2026-11-17",
      "2026-11-18",
      "2026-11-19",
      "2026-11-20",
      "2026-11-21",
      "2026-11-22",
    ]);
  });

  it("marks done, rest, not done and days to come", () => {
    const cycles = recentCycles("daily", new Set(["2026-11-16"]), ["2026-11-17"], now);
    expect(cycles.map((cycle) => cycle.state)).toEqual(["done", "skipped", "open", "future", "future", "future", "future"]);
  });
});

describe("recentCycles for weekly habits", () => {
  it("counts a week as skipped by its Monday", () => {
    const cycles = recentCycles("weekly", new Set(), ["2026-11-09"], now);
    expect(cycles.at(-2)?.state).toBe("skipped");
    expect(cycles.at(-1)?.key).toBe("2026-11-16");
  });
});
