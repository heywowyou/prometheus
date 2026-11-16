import { describe, expect, it } from "vitest";
import { describeRepeat, parseTask } from "./task-parse";

const now = new Date(2026, 10, 16, 9, 0);

describe("monthly on a set day", () => {
  it.each([
    ["Pay rent every month on the 1st", 1],
    ["Pay rent monthly on the 15th", 15],
    ["Pay rent every 1st", 1],
    ["Pay rent every month on the last day", -1],
    ["Déclaration Urssaf le 1er de chaque mois", 1],
    ["Payer le loyer tous les 5 du mois", 5],
  ])("reads %s", (input, monthDay) => {
    const parsed = parseTask(input, { now });
    expect(parsed.repeat).toMatchObject({ unit: "month", every: 1, monthDay });
    expect(parsed.text).not.toMatch(/every|monthly|mois|1st|15th/);
  });

  it("keeps plain monthly repeats on the task's own day", () => {
    expect(parseTask("Water plants every month", { now }).repeat).toMatchObject({ unit: "month" });
    expect(parseTask("Water plants every month", { now }).repeat?.monthDay).toBeUndefined();
  });

  it("names the day in the label", () => {
    expect(describeRepeat({ every: 1, unit: "month", weekdays: [], mode: "fixed", monthDay: 1 })).toBe("Every month on the 1st");
    expect(describeRepeat({ every: 2, unit: "month", weekdays: [], mode: "fixed", monthDay: 22 })).toBe("Every 2 months on the 22nd");
    expect(describeRepeat({ every: 1, unit: "month", weekdays: [], mode: "fixed", monthDay: -1 })).toBe("Every month on the last day");
  });
});
