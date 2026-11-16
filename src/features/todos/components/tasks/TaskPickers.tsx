import { useMemo, useState, type ReactNode } from "react";
import { Archive, Bell, Box, Check, Circle, Flag, Inbox, Layers, Moon, Repeat, Star, Tag, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import { cn } from "@lib/utils";
import { toDayKey } from "../../due";
import { describeRepeat, ordinalDay } from "../../task-parse";
import { dayLabel, nextMonday, shiftDayKey } from "../../task-views";
import type { RepeatRule, TodoArea, TodoProject } from "../../types/todo-types";
import MiniCalendar from "./MiniCalendar";

function PickerRow({
  icon,
  label,
  active,
  onClick,
  trailing,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  trailing?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-secondary",
        active ? "text-foreground" : "text-soft",
      )}
    >
      <span className="flex h-4 w-4 items-center justify-center">{icon}</span>
      <span className="flex-1">{label}</span>
      {trailing}
      {active && <Check className="h-3.5 w-3.5 text-rating" />}
    </button>
  );
}

export interface WhenValue {
  when: string | null;
  evening: boolean;
  time: string | null;
}

/** Things' "When": Today, This Evening, a day, Someday; plus an optional reminder time. */
export function WhenPicker({
  value,
  onChange,
  children,
  align = "start",
}: {
  value: WhenValue;
  onChange: (value: WhenValue) => void;
  children: ReactNode;
  align?: "start" | "end" | "center";
}) {
  const [open, setOpen] = useState(false);
  const today = toDayKey(new Date());
  const isDayValue = Boolean(value.when && value.when !== "someday");
  const pick = (next: WhenValue, close = true) => {
    onChange(next);
    if (close) setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align={align} className="w-72 p-2">
        <p className="px-2 pb-1 pt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">When</p>
        <PickerRow
          icon={<Star className="h-4 w-4 fill-highlight text-highlight" />}
          label="Today"
          active={value.when === today && !value.evening}
          onClick={() => pick({ when: today, evening: false, time: value.time })}
        />
        <PickerRow
          icon={<Moon className="h-4 w-4 text-info" />}
          label="This Evening"
          active={value.when === today && value.evening}
          onClick={() => pick({ when: today, evening: true, time: value.time })}
        />
        <PickerRow
          icon={<Layers className="h-4 w-4 text-muted-foreground" />}
          label="Tomorrow"
          active={value.when === shiftDayKey(today, 1)}
          onClick={() => pick({ when: shiftDayKey(today, 1), evening: false, time: value.time })}
        />
        <PickerRow
          icon={<Layers className="h-4 w-4 text-muted-foreground" />}
          label={`Next week (${dayLabel(nextMonday(), new Date(), "short")})`}
          active={value.when === nextMonday()}
          onClick={() => pick({ when: nextMonday(), evening: false, time: value.time })}
        />
        <div className="my-2 px-1">
          <MiniCalendar
            value={isDayValue ? value.when : null}
            onPick={(day) => pick({ when: day, evening: false, time: value.time })}
          />
        </div>
        <PickerRow
          icon={<Archive className="h-4 w-4 text-muted-foreground" />}
          label="Someday"
          active={value.when === "someday"}
          onClick={() => pick({ when: "someday", evening: false, time: null })}
        />
        {isDayValue && (
          <label className="mt-1 flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-soft">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1">Reminder</span>
            <input
              type="time"
              value={value.time ?? ""}
              onChange={(event) => pick({ ...value, time: event.target.value || null }, false)}
              className="rounded-md border border-border bg-secondary px-2 py-0.5 text-sm text-foreground [color-scheme:dark]"
            />
            {value.time && (
              <button
                type="button"
                aria-label="Remove reminder"
                onClick={() => pick({ ...value, time: null }, false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </label>
        )}
        {value.when && (
          <button
            type="button"
            onClick={() => pick({ when: null, evening: false, time: null })}
            className="mt-1 w-full rounded-lg px-2 py-1.5 text-center text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            Clear
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** A deadline: shows in red as it nears, and pulls the task into Today on the day. */
export function DeadlinePicker({
  value,
  onChange,
  children,
}: {
  value: string | null;
  onChange: (day: string | null) => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-3">
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          <Flag className="h-3.5 w-3.5" /> Deadline
        </p>
        <MiniCalendar
          value={value}
          onPick={(day) => {
            onChange(day);
            setOpen(false);
          }}
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className="mt-2 w-full rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            Remove deadline
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}

const PRESETS: Array<{ label: string; rule: RepeatRule }> = [
  { label: "Every day", rule: { every: 1, unit: "day", weekdays: [], mode: "fixed" } },
  { label: "Every weekday", rule: { every: 1, unit: "week", weekdays: [1, 2, 3, 4, 5], mode: "fixed" } },
  { label: "Every week", rule: { every: 1, unit: "week", weekdays: [], mode: "fixed" } },
  { label: "Every month", rule: { every: 1, unit: "month", weekdays: [], mode: "fixed" } },
  { label: "Every month on the 1st", rule: { every: 1, unit: "month", weekdays: [], mode: "fixed", monthDay: 1 } },
  { label: "Every year", rule: { every: 1, unit: "year", weekdays: [], mode: "fixed" } },
];

const WEEKDAY_TOGGLES = [
  { day: 1, label: "M" },
  { day: 2, label: "T" },
  { day: 3, label: "W" },
  { day: 4, label: "T" },
  { day: 5, label: "F" },
  { day: 6, label: "S" },
  { day: 0, label: "S" },
];

const sameRule = (a: RepeatRule | null, b: RepeatRule) =>
  Boolean(a) &&
  a?.every === b.every &&
  a.unit === b.unit &&
  a.mode === b.mode &&
  (a.monthDay ?? null) === (b.monthDay ?? null) &&
  [...a.weekdays].sort().join() === [...b.weekdays].sort().join();

/** Presets first; "Custom" opens every N units, weekdays and schedule mode. */
export function RepeatPicker({
  value,
  onChange,
  children,
}: {
  value: RepeatRule | null;
  onChange: (rule: RepeatRule | null) => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(false);
  const draft: RepeatRule = value ?? { every: 1, unit: "week", weekdays: [], mode: "fixed" };
  const update = (patch: Partial<RepeatRule>) => onChange({ ...draft, ...patch });

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setCustom(false);
      }}
    >
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-2">
        <p className="px-2 pb-1 pt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Repeat</p>
        {!custom ? (
          <>
            {PRESETS.map((preset) => (
              <PickerRow
                key={preset.label}
                icon={<Repeat className="h-4 w-4 text-muted-foreground" />}
                label={preset.label}
                active={sameRule(value, preset.rule)}
                onClick={() => {
                  onChange({ ...preset.rule, mode: value?.mode ?? "fixed" });
                  setOpen(false);
                }}
              />
            ))}
            <PickerRow
              icon={<Repeat className="h-4 w-4 text-muted-foreground" />}
              label={value && !PRESETS.some((preset) => sameRule(value, preset.rule)) ? describeRepeat(value) : "Custom…"}
              active={Boolean(value) && !PRESETS.some((preset) => sameRule(value, preset.rule))}
              onClick={() => setCustom(true)}
            />
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setOpen(false);
                }}
                className="mt-1 w-full rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                Don't repeat
              </button>
            )}
          </>
        ) : (
          <div className="space-y-3 px-2 py-1 text-sm text-soft">
            <div className="flex items-center gap-2">
              Every
              <input
                type="number"
                min={1}
                max={365}
                value={draft.every}
                onChange={(event) => update({ every: Math.min(365, Math.max(1, Number(event.target.value) || 1)) })}
                className="w-14 rounded-md border border-border bg-secondary px-2 py-1 text-foreground"
              />
              <select
                value={draft.unit}
                onChange={(event) =>
                  update({ unit: event.target.value as RepeatRule["unit"], weekdays: [], monthDay: null })
                }
                className="rounded-md border border-border bg-secondary px-2 py-1 text-foreground"
              >
                {(["day", "week", "month", "year"] as const).map((unit) => (
                  <option key={unit} value={unit}>
                    {draft.every === 1 ? unit : `${unit}s`}
                  </option>
                ))}
              </select>
            </div>
            {draft.unit === "week" && (
              <div className="flex gap-1">
                {WEEKDAY_TOGGLES.map(({ day, label }) => {
                  const on = draft.weekdays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      aria-pressed={on}
                      onClick={() =>
                        update({ weekdays: on ? draft.weekdays.filter((item) => item !== day) : [...draft.weekdays, day] })
                      }
                      className={cn(
                        "h-8 w-8 rounded-full text-xs transition-colors",
                        on ? "bg-rating text-rating-foreground" : "bg-secondary text-soft hover:text-foreground",
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
            {draft.unit === "month" && (
              <label className="flex items-center gap-2">
                On
                <select
                  value={draft.monthDay ?? 0}
                  onChange={(event) => {
                    const day = Number(event.target.value);
                    update({ monthDay: day === 0 ? null : day });
                  }}
                  className="min-w-0 flex-1 rounded-md border border-border bg-secondary px-2 py-1 text-foreground"
                >
                  <option value={0}>the same day each month</option>
                  {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => (
                    <option key={day} value={day}>
                      {ordinalDay(day)}
                    </option>
                  ))}
                  <option value={-1}>the last day</option>
                </select>
              </label>
            )}
            <div className="flex rounded-full bg-secondary p-0.5 text-xs">
              {(
                [
                  ["fixed", "On schedule"],
                  ["afterCompletion", "After done"],
                ] as const
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => update({ mode })}
                  className={cn(
                    "flex-1 rounded-full px-2 py-1 transition-colors",
                    draft.mode === mode ? "bg-raised text-foreground" : "text-muted-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {draft.mode === "fixed"
                ? "Comes back on schedule, even if done late."
                : "Comes back counted from the day you tick it."}
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full rounded-full bg-primary py-1.5 text-sm font-medium text-primary-foreground"
            >
              Done
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export interface ListTarget {
  projectId: string | null;
  areaId: string | null;
}

/** Inbox, an area, or a project (shown under its area). */
export function MovePicker({
  value,
  areas,
  projects,
  onChange,
  children,
}: {
  value: ListTarget;
  areas: TodoArea[];
  projects: TodoProject[];
  onChange: (target: ListTarget) => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const match = (title: string) => !query.trim() || title.toLowerCase().includes(query.trim().toLowerCase());
  const loose = projects.filter((project) => !project.areaId && match(project.title));
  const pick = (target: ListTarget) => {
    onChange(target);
    setOpen(false);
    setQuery("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-2">
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Move to…"
          className="mb-1 w-full rounded-lg bg-secondary px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
        />
        <div className="max-h-72 overflow-y-auto">
          {match("Inbox") && (
            <PickerRow
              icon={<Inbox className="h-4 w-4 text-info" />}
              label="Inbox"
              active={!value.projectId && !value.areaId}
              onClick={() => pick({ projectId: null, areaId: null })}
            />
          )}
          {loose.map((project) => (
            <PickerRow
              key={project._id}
              icon={<Circle className="h-4 w-4 text-info" />}
              label={project.title || "Untitled project"}
              active={value.projectId === project._id}
              onClick={() => pick({ projectId: project._id, areaId: null })}
            />
          ))}
          {areas.map((area) => {
            const inArea = projects.filter((project) => project.areaId === area._id && match(project.title));
            if (!match(area.title) && inArea.length === 0) return null;
            return (
              <div key={area._id} className="mt-1">
                <PickerRow
                  icon={<Box className="h-4 w-4 text-muted-foreground" />}
                  label={area.title || "Untitled area"}
                  active={value.areaId === area._id && !value.projectId}
                  onClick={() => pick({ projectId: null, areaId: area._id })}
                />
                {inArea.map((project) => (
                  <div key={project._id} className="pl-5">
                    <PickerRow
                      icon={<Circle className="h-4 w-4 text-info" />}
                      label={project.title || "Untitled project"}
                      active={value.projectId === project._id}
                      onClick={() => pick({ projectId: project._id, areaId: null })}
                    />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Toggle existing tags or type a new one. */
export function TagPicker({
  value,
  suggestions,
  onChange,
  children,
}: {
  value: string[];
  suggestions: string[];
  onChange: (tags: string[]) => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const all = useMemo(() => [...new Set([...suggestions, ...value])].sort(), [suggestions, value]);
  const normalised = draft.trim().toLowerCase().replace(/\s+/g, "-").replace(/^#/, "");
  const shown = all.filter((tag) => !normalised || tag.includes(normalised));
  const toggle = (tag: string) => onChange(value.includes(tag) ? value.filter((item) => item !== tag) : [...value, tag]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-2">
        <input
          autoFocus
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && normalised) {
              event.preventDefault();
              if (!value.includes(normalised)) onChange([...value, normalised]);
              setDraft("");
            }
          }}
          placeholder="Tag name, Enter to add"
          className="mb-1 w-full rounded-lg bg-secondary px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
        />
        <div className="max-h-60 overflow-y-auto">
          {shown.map((tag) => (
            <PickerRow
              key={tag}
              icon={<Tag className="h-3.5 w-3.5 text-muted-foreground" />}
              label={tag}
              active={value.includes(tag)}
              onClick={() => toggle(tag)}
            />
          ))}
          {shown.length === 0 && !normalised && (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">No tags yet.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

