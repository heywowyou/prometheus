import { useState } from "react";
import { Bell, MapPin, Repeat, Trash2 } from "lucide-react";
import { Button } from "@components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@components/ui/dialog";
import { Switch } from "@components/ui/switch";
import { cn } from "@lib/utils";
import { toDayKey } from "@features/todos/due";
import { addDaysKey, hhmm, minutesFromHhmm, minutesOfDay, parseDay } from "../calendar-dates";
import {
  COLOR_NAMES,
  COLOR_VARS,
  EVENT_COLORS,
  REMIND_OPTIONS,
  type CalendarOccurrence,
  type EventColor,
  type EventPayload,
  type EventRepeat,
} from "../types/calendar-types";

/** What a new event starts with (a clicked slot or a dragged range). */
export interface EventDraft {
  /** Prefilled title (an event typed in search). */
  title?: string;
  allDay: boolean;
  startDay: string;
  endDay: string;
  /** Minutes past midnight, timed events. */
  startMinutes: number;
  endMinutes: number;
}

type RepeatChoice = "none" | "day" | "weekdays" | "week" | "month" | "year" | "custom";

const WEEKDAY_TOGGLES = [
  { day: 1, label: "M" },
  { day: 2, label: "T" },
  { day: 3, label: "W" },
  { day: 4, label: "T" },
  { day: 5, label: "F" },
  { day: 6, label: "S" },
  { day: 0, label: "S" },
];

const choiceOf = (repeat: EventRepeat | null): RepeatChoice => {
  if (!repeat) return "none";
  if (repeat.every !== 1) return "custom";
  if (repeat.unit === "week" && repeat.weekdays.join() === "1,2,3,4,5") return "weekdays";
  if (repeat.unit === "week" && repeat.weekdays.length > 1) return "custom";
  return repeat.unit;
};

interface FormState {
  title: string;
  allDay: boolean;
  startDay: string;
  startTime: string;
  endDay: string;
  endTime: string;
  repeat: RepeatChoice;
  every: number;
  unit: EventRepeat["unit"];
  weekdays: number[];
  until: string;
  color: EventColor;
  location: string;
  remindMinutes: number | null;
  notes: string;
}

const fromOccurrence = (occurrence: CalendarOccurrence): FormState => {
  const start = new Date(occurrence.start);
  const end = new Date(occurrence.end);
  return {
    title: occurrence.title,
    allDay: occurrence.allDay,
    startDay: occurrence.allDay ? (occurrence.startDay as string) : toDayKey(start),
    startTime: hhmm(minutesOfDay(start)),
    endDay: occurrence.allDay ? (occurrence.endDay as string) : toDayKey(end),
    endTime: hhmm(minutesOfDay(end)),
    repeat: choiceOf(occurrence.repeat),
    every: occurrence.repeat?.every ?? 1,
    unit: occurrence.repeat?.unit ?? "week",
    weekdays: occurrence.repeat?.weekdays ?? [],
    until: occurrence.repeat?.until ?? "",
    color: occurrence.color,
    location: occurrence.location,
    remindMinutes: occurrence.remindMinutes,
    notes: occurrence.notes,
  };
};

const fromDraft = (draft: EventDraft): FormState => ({
  title: draft.title ?? "",
  allDay: draft.allDay,
  startDay: draft.startDay,
  startTime: hhmm(draft.startMinutes),
  endDay: draft.endDay,
  endTime: hhmm(Math.min(draft.endMinutes, 24 * 60 - 1)),
  repeat: "none",
  every: 1,
  unit: "week",
  weekdays: [],
  until: "",
  color: "sage",
  location: "",
  remindMinutes: draft.allDay ? null : 10,
  notes: "",
});

const toPayload = (form: FormState): EventPayload => {
  const repeat: EventRepeat | null =
    form.repeat === "none"
      ? null
      : form.repeat === "weekdays"
        ? { every: 1, unit: "week", weekdays: [1, 2, 3, 4, 5], until: form.until || null }
        : form.repeat === "custom"
          ? { every: form.every, unit: form.unit, weekdays: form.unit === "week" ? form.weekdays : [], until: form.until || null }
          : { every: 1, unit: form.repeat, weekdays: [], until: form.until || null };
  const base = {
    title: form.title.trim(),
    color: form.color,
    location: form.location.trim(),
    notes: form.notes,
    remindMinutes: form.remindMinutes,
    repeat,
  };
  if (form.allDay) {
    return {
      ...base,
      allDay: true,
      startDay: form.startDay,
      endDay: form.endDay < form.startDay ? form.startDay : form.endDay,
    };
  }
  const start = parseDay(form.startDay);
  start.setMinutes(minutesFromHhmm(form.startTime));
  const end = parseDay(form.endDay);
  end.setMinutes(minutesFromHhmm(form.endTime));
  const safeEnd = end > start ? end : new Date(start.getTime() + 60 * 60_000);
  return { ...base, allDay: false, start: start.toISOString(), end: safeEnd.toISOString() };
};

const inputClass =
  "rounded-lg border border-border bg-secondary px-2.5 py-1.5 text-sm text-foreground outline-none [color-scheme:dark] focus:border-rating/60";

/** Create or edit an event. Edits to a repeating event apply to the whole series. */
function EventForm({
  occurrence,
  draft,
  onSave,
  onDelete,
  onClose,
}: {
  occurrence: CalendarOccurrence | null;
  draft: EventDraft | null;
  onSave: (payload: EventPayload) => Promise<unknown>;
  onDelete: (onlyThis: boolean) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormState>(() =>
    occurrence ? fromOccurrence(occurrence) : fromDraft(draft as EventDraft),
  );
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = (patch: Partial<FormState>) => setForm((previous) => ({ ...previous, ...patch }));
  const weekdayName = parseDay(form.startDay).toLocaleDateString(undefined, { weekday: "long" });

  const save = async () => {
    setSaving(true);
    try {
      await onSave(toPayload(form));
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
      className="space-y-4"
    >
      <input
        autoFocus
        value={form.title}
        onChange={(event) => set({ title: event.target.value })}
        placeholder="Event title"
        aria-label="Title"
        className="w-full bg-transparent font-serif text-2xl text-foreground outline-none placeholder:text-muted-foreground/60"
      />

      <div className="space-y-2">
        <label className="flex items-center justify-between text-sm text-soft">
          All day
          <Switch checked={form.allDay} onCheckedChange={(allDay) => set({ allDay })} />
        </label>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <input
            type="date"
            value={form.startDay}
            onChange={(event) => {
              const startDay = event.target.value;
              if (!startDay) return;
              const shift = Math.round((parseDay(startDay).getTime() - parseDay(form.startDay).getTime()) / 86_400_000);
              set({ startDay, endDay: addDaysKey(form.endDay, shift) });
            }}
            className={inputClass}
            aria-label="Start day"
          />
          {!form.allDay && (
            <input
              type="time"
              value={form.startTime}
              onChange={(event) => {
                const startTime = event.target.value;
                if (!startTime) return;
                const length = minutesFromHhmm(form.endTime) - minutesFromHhmm(form.startTime);
                set({ startTime, endTime: hhmm(Math.min(24 * 60 - 1, minutesFromHhmm(startTime) + Math.max(15, length))) });
              }}
              className={inputClass}
              aria-label="Start time"
            />
          )}
          <span>to</span>
          {(form.allDay || form.endDay !== form.startDay) && (
            <input
              type="date"
              value={form.endDay}
              min={form.startDay}
              onChange={(event) => event.target.value && set({ endDay: event.target.value })}
              className={inputClass}
              aria-label="End day"
            />
          )}
          {!form.allDay && (
            <input
              type="time"
              value={form.endTime}
              onChange={(event) => event.target.value && set({ endTime: event.target.value })}
              className={inputClass}
              aria-label="End time"
            />
          )}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Repeat className="h-4 w-4 shrink-0" />
          <select
            value={form.repeat}
            onChange={(event) => set({ repeat: event.target.value as RepeatChoice })}
            className={cn(inputClass, "w-full")}
            aria-label="Repeat"
          >
            <option value="none">Does not repeat</option>
            <option value="day">Every day</option>
            <option value="weekdays">Every weekday</option>
            <option value="week">Every week on {weekdayName}</option>
            <option value="month">Every month</option>
            <option value="year">Every year</option>
            <option value="custom">Custom…</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Bell className="h-4 w-4 shrink-0" />
          <select
            value={form.remindMinutes === null ? "" : String(form.remindMinutes)}
            onChange={(event) => set({ remindMinutes: event.target.value === "" ? null : Number(event.target.value) })}
            className={cn(inputClass, "w-full")}
            aria-label="Reminder"
          >
            {REMIND_OPTIONS.map((option) => (
              <option key={option.label} value={option.value === null ? "" : String(option.value)}>
                {form.allDay && option.value !== null ? option.label.replace("before", "before 9:00") : option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {form.repeat === "custom" && (
        <div className="space-y-2 rounded-xl bg-secondary/50 p-3 text-sm text-soft">
          <div className="flex items-center gap-2">
            Every
            <input
              type="number"
              min={1}
              max={365}
              value={form.every}
              onChange={(event) => set({ every: Math.min(365, Math.max(1, Number(event.target.value) || 1)) })}
              className={cn(inputClass, "w-16")}
            />
            <select
              value={form.unit}
              onChange={(event) => set({ unit: event.target.value as EventRepeat["unit"] })}
              className={inputClass}
            >
              {(["day", "week", "month", "year"] as const).map((unit) => (
                <option key={unit} value={unit}>
                  {form.every === 1 ? unit : `${unit}s`}
                </option>
              ))}
            </select>
          </div>
          {form.unit === "week" && (
            <div className="flex gap-1">
              {WEEKDAY_TOGGLES.map(({ day, label }) => {
                const on = form.weekdays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      set({ weekdays: on ? form.weekdays.filter((item) => item !== day) : [...form.weekdays, day] })
                    }
                    className={cn(
                      "h-8 w-8 rounded-full text-xs",
                      on ? "bg-rating text-rating-foreground" : "bg-secondary text-soft",
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
      {form.repeat !== "none" && (
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Until
          <input
            type="date"
            value={form.until}
            min={form.startDay}
            onChange={(event) => set({ until: event.target.value })}
            className={inputClass}
          />
          {!form.until && <span className="text-xs">(forever)</span>}
        </label>
      )}

      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4 shrink-0" />
        <input
          value={form.location}
          onChange={(event) => set({ location: event.target.value })}
          placeholder="Location"
          className={cn(inputClass, "w-full")}
        />
      </label>

      <textarea
        value={form.notes}
        onChange={(event) => set({ notes: event.target.value })}
        placeholder="Notes"
        rows={2}
        className={cn(inputClass, "w-full resize-y")}
      />

      <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Color">
        {EVENT_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={form.color === color}
            aria-label={COLOR_NAMES[color]}
            title={COLOR_NAMES[color]}
            onClick={() => set({ color })}
            className={cn(
              "h-6 w-6 rounded-full border-2 transition-transform",
              form.color === color ? "scale-110 border-foreground" : "border-transparent",
            )}
            style={{ background: COLOR_VARS[color] }}
          />
        ))}
      </div>

      {occurrence?.repeat && (
        <p className="text-xs text-muted-foreground">Changes apply to every event in this series.</p>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
        {occurrence &&
          (confirmDelete && occurrence.repeat ? (
            <span className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => onDelete(true)}>
                Only this one
              </Button>
              <Button type="button" size="sm" variant="destructive" onClick={() => onDelete(false)}>
                All events
              </Button>
            </span>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => (occurrence.repeat ? setConfirmDelete(true) : onDelete(false))}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          ))}
        <span className="ml-auto flex gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {occurrence ? "Save" : "Add event"}
          </Button>
        </span>
      </div>
    </form>
  );
}

export default function EventDialog({
  occurrence,
  draft,
  onSave,
  onDelete,
  onClose,
}: {
  occurrence: CalendarOccurrence | null;
  draft: EventDraft | null;
  onSave: (payload: EventPayload) => Promise<unknown>;
  onDelete: (onlyThis: boolean) => void;
  onClose: () => void;
}) {
  const open = Boolean(occurrence || draft);
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogTitle className="sr-only">{occurrence ? "Edit event" : "New event"}</DialogTitle>
        <DialogDescription className="sr-only">Title, time, repeat, reminder and color</DialogDescription>
        {open && (
          <EventForm
            key={occurrence?._id ?? `${draft?.startDay}-${draft?.startMinutes}`}
            occurrence={occurrence}
            draft={draft}
            onSave={onSave}
            onDelete={(onlyThis) => {
              onDelete(onlyThis);
              onClose();
            }}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
