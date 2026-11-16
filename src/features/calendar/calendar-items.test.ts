import { describe, expect, it } from "vitest";
import { isSpanning, spanDays } from "./calendar-items";
import { toInputs } from "./calendar-inputs";
import { task } from "../../test/fixtures";
import type { CalendarOccurrence } from "./types/calendar-types";

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

  it("does not count the day a timed event ends at midnight", () => {
    expect(spanDays(event("d", { allDay: false, start: "2026-11-20T00:00:00", end: "2026-11-22T00:00:00" }))).toEqual([
      "2026-11-20",
      "2026-11-21",
    ]);
  });
});

describe("toInputs", () => {
  it("gives all-day events FullCalendar's exclusive end", () => {
    const [input] = toInputs([event("trip", { startDay: "2026-11-16", endDay: "2026-11-22" })], []);
    expect(input).toMatchObject({ allDay: true, start: "2026-11-16", end: "2026-11-23" });
  });

  it("shows a weekend-long timed event as a bar on top", () => {
    const [input] = toInputs(
      [event("weekend", { allDay: false, start: "2026-11-20T18:00:00", end: "2026-11-22T20:00:00" })],
      [],
    );
    expect(input).toMatchObject({ allDay: true, start: "2026-11-20", end: "2026-11-23", durationEditable: false });
  });

  it("puts tasks on their day, at their time, and on their deadline", () => {
    const inputs = toInputs(
      [],
      [
        task("a", "Call bank", { when: "2026-11-18" }),
        task("b", "Dentist forms", { when: "2026-11-18", time: "09:30" }),
        task("c", "Invoice", { when: "2026-11-17", dueDate: "2026-11-20" }),
      ],
    );
    expect(inputs.find((input) => input.id === "task-a")).toMatchObject({ allDay: true, start: "2026-11-18" });
    expect(inputs.find((input) => input.id === "task-b")).toMatchObject({
      allDay: false,
      start: "2026-11-18T09:30:00",
      end: "2026-11-18T10:00:00",
    });
    expect(inputs.find((input) => input.id === "due-c")).toMatchObject({ allDay: true, start: "2026-11-20", editable: false });
  });
});

describe("calendarTasks", () => {
  it("leaves out the done records of repeating tasks", async () => {
    const { calendarTasks } = await import("./calendar-items");
    const shown = calendarTasks([
      task("live", "Urssaf", { when: "2026-12-01", repeat: { every: 1, unit: "month", weekdays: [], mode: "fixed" } }),
      task("record", "Urssaf", { when: "2026-11-16", completed: true, repeatOf: "live" }),
    ]);
    expect(shown.map((todo) => todo._id)).toEqual(["live"]);
  });
});
