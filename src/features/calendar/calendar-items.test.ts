import { describe, expect, it } from "vitest";
import { isSpanning, spanBars } from "./calendar-items";
import type { CalendarOccurrence } from "./types/calendar-types";

const week = ["2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20", "2026-11-21", "2026-11-22"];

const event = (id: string, extra: Partial<CalendarOccurrence>): CalendarOccurrence => ({
  _id: id,
  eventId: id,
  occurrenceDay: "2026-11-16",
  title: id,
  notes: "",
  location: "",
  color: "sage",
  allDay: true,
  start: "2026-11-16T00:00:00",
  end: "2026-11-16T23:59:00",
  repeat: null,
  remindMinutes: null,
  ...extra,
});

describe("isSpanning", () => {
  it("draws all-day events and timed events of a day or more as bars", () => {
    expect(isSpanning(event("a", { startDay: "2026-11-16", endDay: "2026-11-16" }))).toBe(true);
    expect(isSpanning(event("b", { allDay: false, start: "2026-11-20T18:00:00", end: "2026-11-22T12:00:00" }))).toBe(true);
    expect(isSpanning(event("c", { allDay: false, start: "2026-11-20T18:00:00", end: "2026-11-20T20:00:00" }))).toBe(false);
  });
});

describe("spanBars", () => {
  it("draws one bar per event across its days", () => {
    const { bars, lanes } = spanBars(week, [event("trip", { startDay: "2026-11-16", endDay: "2026-11-22" })]);
    expect(lanes).toBe(1);
    expect(bars[0]).toMatchObject({ startCol: 0, endCol: 6, lane: 0, continuesBefore: false, continuesAfter: false });
  });

  it("stacks overlapping events and reuses free lanes", () => {
    const { bars, lanes } = spanBars(week, [
      event("long", { startDay: "2026-11-16", endDay: "2026-11-22" }),
      event("tue", { startDay: "2026-11-17", endDay: "2026-11-17" }),
      event("thu", { startDay: "2026-11-19", endDay: "2026-11-19" }),
    ]);
    expect(lanes).toBe(2);
    expect(bars.find((bar) => bar.occurrence._id === "tue")?.lane).toBe(1);
    expect(bars.find((bar) => bar.occurrence._id === "thu")?.lane).toBe(1);
  });

  it("clips events that run past the week", () => {
    const { bars } = spanBars(week, [event("conf", { startDay: "2026-11-21", endDay: "2026-11-25" })]);
    expect(bars[0]).toMatchObject({ startCol: 5, endCol: 6, continuesBefore: false, continuesAfter: true });
  });

  it("ignores events outside the days shown", () => {
    expect(spanBars(week, [event("old", { startDay: "2026-11-01", endDay: "2026-11-02" })]).bars).toHaveLength(0);
  });
});
