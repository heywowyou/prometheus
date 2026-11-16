import { toDayKey } from "./due";
import { MAX_DURATION_GOAL, type RepeatRule, type TodoArea, type TodoProject } from "./types/todo-types";
import { dayLabel, nextMonday, shiftDayKey } from "./task-views";

/**
 * Quick add, Things/Todoist style: "Pay rent fri 9am every month #home !"
 * fills the fields and leaves "Pay rent". Every recognised piece becomes a
 * chip; removing a chip puts its words back in the title.
 */

export type TokenKind = "when" | "time" | "repeat" | "deadline" | "list" | "tag" | "important" | "duration";

export interface ParsedToken {
  /** Stable across keystrokes, for "don't parse this one". */
  key: string;
  kind: TokenKind;
  label: string;
}

export interface ParsedTask {
  text: string;
  when?: string;
  evening?: boolean;
  time?: string;
  repeat?: RepeatRule;
  dueDate?: string;
  projectId?: string;
  areaId?: string;
  tags: string[];
  important?: boolean;
  durationGoal?: number;
  tokens: ParsedToken[];
}

const WEEKDAYS: Array<[number, RegExp]> = [
  [0, /^(sun|sunday|dim|dimanche)$/],
  [1, /^(mon|monday|lun|lundi)$/],
  [2, /^(tue|tues|tuesday|mar|mardi)$/],
  [3, /^(wed|wednesday|mer|mercredi)$/],
  [4, /^(thu|thur|thurs|thursday|jeu|jeudi)$/],
  [5, /^(fri|friday|ven|vendredi)$/],
  [6, /^(sat|saturday|sam|samedi)$/],
];
const WEEKDAY_WORD =
  "sun|sunday|mon|monday|tue|tues|tuesday|wed|wednesday|thu|thur|thurs|thursday|fri|friday|sat|saturday|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche";
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const MONTH_WORD =
  "jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december";

const weekdayOf = (word: string): number | null => {
  const lower = word.toLowerCase();
  for (const [day, pattern] of WEEKDAYS) if (pattern.test(lower)) return day;
  return null;
};

const monthOf = (word: string) => MONTHS.indexOf(word.toLowerCase().slice(0, 3));

/** A calendar day from day/month numbers: this year, or next year if already past. */
const dayFromParts = (day: number, month: number, year: number | null, now: Date): string | null => {
  if (month < 0 || month > 11 || day < 1 || day > 31) return null;
  const candidate = new Date(year ?? now.getFullYear(), month, day);
  if (candidate.getMonth() !== month) return null;
  if (year === null && toDayKey(candidate) < toDayKey(now)) candidate.setFullYear(candidate.getFullYear() + 1);
  return toDayKey(candidate);
};

const DATE_EXPR = [
  "today",
  "tonight",
  "this evening",
  "tomorrow",
  "tmrw",
  "someday",
  "next week",
  "next month",
  "aujourd'hui",
  "ce soir",
  "demain",
  `in \\d{1,3} (?:days?|weeks?|months?)`,
  `(?:next |on )?(?:${WEEKDAY_WORD})`,
  `\\d{1,2}(?:st|nd|rd|th)? (?:${MONTH_WORD})(?: \\d{4})?`,
  `(?:${MONTH_WORD}) \\d{1,2}(?:st|nd|rd|th)?(?:,? \\d{4})?`,
  "\\d{4}-\\d{2}-\\d{2}",
  "\\d{1,2}/\\d{1,2}(?:/\\d{4})?",
].join("|");

interface DateValue {
  day?: string;
  evening?: boolean;
  someday?: boolean;
}

/** Reads one DATE_EXPR match. */
const readDate = (raw: string, now: Date): DateValue | null => {
  const text = raw.toLowerCase().replace(/\s+/g, " ").trim();
  const today = toDayKey(now);
  if (text === "today" || text === "aujourd'hui") return { day: today };
  if (text === "tonight" || text === "this evening" || text === "ce soir") return { day: today, evening: true };
  if (text === "tomorrow" || text === "tmrw" || text === "demain") return { day: shiftDayKey(today, 1) };
  if (text === "someday") return { someday: true };
  if (text === "next week") return { day: nextMonday(now) };
  if (text === "next month") {
    return { day: toDayKey(new Date(now.getFullYear(), now.getMonth() + 1, 1)) };
  }
  let match = /^in (\d{1,3}) (day|week|month)s?$/.exec(text);
  if (match) {
    const amount = Number(match[1]);
    if (match[2] === "month") return { day: toDayKey(new Date(now.getFullYear(), now.getMonth() + amount, now.getDate())) };
    return { day: shiftDayKey(today, match[2] === "week" ? amount * 7 : amount) };
  }
  match = /^(next |on )?([a-z]+)$/.exec(text);
  if (match?.[2]) {
    const weekday = weekdayOf(match[2]);
    if (weekday !== null) {
      let offset = (weekday - now.getDay() + 7) % 7;
      if (match[1] === "next " && offset === 0) offset = 7;
      return { day: shiftDayKey(today, offset) };
    }
  }
  match = /^(\d{1,2})(?:st|nd|rd|th)? ([a-z]+)(?: (\d{4}))?$/.exec(text);
  if (match) {
    const day = dayFromParts(Number(match[1]), monthOf(match[2] ?? ""), match[3] ? Number(match[3]) : null, now);
    return day ? { day } : null;
  }
  match = /^([a-z]+) (\d{1,2})(?:st|nd|rd|th)?(?:,? (\d{4}))?$/.exec(text);
  if (match) {
    const day = dayFromParts(Number(match[2]), monthOf(match[1] ?? ""), match[3] ? Number(match[3]) : null, now);
    return day ? { day } : null;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return { day: text };
  // Day first, as written in France: 24/12.
  match = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/.exec(text);
  if (match) {
    const day = dayFromParts(Number(match[1]), Number(match[2]) - 1, match[3] ? Number(match[3]) : null, now);
    return day ? { day } : null;
  }
  return null;
};

const readRepeat = (raw: string): RepeatRule | null => {
  const text = raw.toLowerCase().replace(/\s+/g, " ").trim();
  const base: RepeatRule = { every: 1, unit: "day", weekdays: [], mode: "fixed" };
  if (text === "daily" || text === "every day") return base;
  if (text === "weekly" || text === "every week") return { ...base, unit: "week" };
  if (text === "monthly" || text === "every month") return { ...base, unit: "month" };
  if (text === "yearly" || text === "annually" || text === "every year") return { ...base, unit: "year" };
  if (text === "every weekday" || text === "every weekdays") return { ...base, unit: "week", weekdays: [1, 2, 3, 4, 5] };
  if (text === "every weekend") return { ...base, unit: "week", weekdays: [0, 6] };
  // A set day of the month: "every month on the 1st", "every 15th", "le 1er de chaque mois".
  const monthDayMatch =
    /^(?:every month|monthly) on the (?:(\d{1,2})(?:st|nd|rd|th)?|(last) day)$/.exec(text) ??
    /^every (\d{1,2})(?:st|nd|rd|th)(?: of the month)?$/.exec(text) ??
    /^(?:le |tous les )(?:(\d{1,2})(?:er|e)?|(dernier) jour) (?:de chaque|du) mois$/.exec(text);
  if (monthDayMatch) {
    const day = monthDayMatch[2] ? -1 : Number(monthDayMatch[1]);
    if (day === -1 || (day >= 1 && day <= 31)) return { ...base, unit: "month", monthDay: day };
  }
  let match = /^every (other |\d{1,3} )?(day|week|month|year)s?$/.exec(text);
  if (match) {
    const every = match[1] === "other " ? 2 : match[1] ? Number(match[1]) : 1;
    return { ...base, every, unit: match[2] as RepeatRule["unit"] };
  }
  match = /^every (.+)$/.exec(text);
  if (match?.[1]) {
    const days = match[1]
      .split(/\s*(?:,|and|&)\s*/)
      .map((word) => weekdayOf(word.trim()))
      .filter((day): day is number => day !== null);
    if (days.length > 0) return { ...base, unit: "week", weekdays: [...new Set(days)].sort() };
  }
  return null;
};

const REPEAT_PATTERN = new RegExp(
  `(?:^|\\s)((?:every month|monthly) on the (?:\\d{1,2}(?:st|nd|rd|th)?|last day)|every \\d{1,2}(?:st|nd|rd|th)(?: of the month)?|(?:le |tous les )(?:\\d{1,2}(?:er|e)?|dernier jour) (?:de chaque|du) mois|daily|weekly|monthly|yearly|annually|every (?:weekdays?|weekend|(?:other |\\d{1,3} )?(?:days?|weeks?|months?|years?)|(?:${WEEKDAY_WORD})(?:\\s*(?:,|and|&)\\s*(?:${WEEKDAY_WORD}))*))(?=\\s|$)`,
  "i",
);
const DEADLINE_PATTERN = new RegExp(`(?:^|\\s)((?:due|deadline|by) @?(${DATE_EXPR}))(?=\\s|$|[.,])`, "i");
const WHEN_PATTERN = new RegExp(`(?:^|\\s)(@?(${DATE_EXPR}))(?=\\s|$|[.,])`, "i");
const TIME_PATTERNS = [
  /(?:^|\s)((?:at |à )?(1[0-2]|0?[1-9])(?::([0-5]\d))? ?(am|pm))(?=\s|$)/i,
  /(?:^|\s)((?:at |à )?([01]?\d|2[0-3])[:h]([0-5]\d))(?=\s|$)/i,
  /(?:^|\s)((?:at |à )?([01]?\d|2[0-3])h)(?=\s|$)/i,
  /(?:^|\s)((?:at|à) ([01]?\d|2[0-3]))(?=\s|$)/i,
];
const LIST_PATTERN = /(?:^|\s)(#([\p{L}\d][\p{L}\d_-]*))/u;
const IMPORTANT_PATTERN = /(?:^|\s)(!{1,3})(?=\s|$)/;
// "30m", "45 min", "2 hrs", "1h" (1 to 6 only: "18h" is a time, French style).
const DURATION_PATTERN = /(?:^|\s)((?:(\d{1,4}) ?(m|min|mins|minutes|hrs?|hours?))|(?:([1-6]) ?(h)))(?=\s*$)/i;

const slug = (text: string) => text.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");

export interface ParseContext {
  now?: Date;
  projects?: TodoProject[];
  areas?: TodoArea[];
  /** Token keys the user dismissed; their words stay in the title. */
  ignored?: ReadonlySet<string>;
}

const hhmm = (hour: number, minute: number) => `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

export const parseTask = (raw: string, context: ParseContext = {}): ParsedTask => {
  const now = context.now ?? new Date();
  const ignored = context.ignored ?? new Set<string>();
  let text = ` ${raw} `;
  const result: ParsedTask = { text: "", tags: [], tokens: [] };

  /** Finds the first match not dismissed, removes it, and returns it. */
  const take = (pattern: RegExp, kind: TokenKind): RegExpExecArray | null => {
    const global = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`);
    let match: RegExpExecArray | null;
    while ((match = global.exec(text))) {
      const whole = match[1] ?? match[0];
      const key = `${kind}:${whole.toLowerCase()}`;
      if (!ignored.has(key)) {
        const start = match.index + match[0].indexOf(whole);
        text = `${text.slice(0, start)} ${text.slice(start + whole.length)}`;
        return Object.assign(match, { tokenKey: key }) as RegExpExecArray;
      }
      if (global.lastIndex === match.index) global.lastIndex += 1;
    }
    return null;
  };
  const keyOf = (match: RegExpExecArray) => (match as RegExpExecArray & { tokenKey: string }).tokenKey;

  const duration = take(DURATION_PATTERN, "duration");
  if (duration) {
    const amount = Number(duration[2] ?? duration[4]);
    const unit = (duration[3] ?? duration[5] ?? "").toLowerCase();
    const minutes = unit.startsWith("h") ? amount * 60 : amount;
    if (minutes >= 1 && minutes <= MAX_DURATION_GOAL) {
      result.durationGoal = minutes;
      result.tokens.push({ key: keyOf(duration), kind: "duration", label: `${minutes} min timer` });
    }
  }

  const repeatMatch = take(REPEAT_PATTERN, "repeat");
  if (repeatMatch?.[1]) {
    const rule = readRepeat(repeatMatch[1]);
    if (rule) {
      result.repeat = rule;
      result.tokens.push({ key: keyOf(repeatMatch), kind: "repeat", label: describeRepeat(rule) });
    }
  }

  const deadline = take(DEADLINE_PATTERN, "deadline");
  if (deadline?.[2]) {
    const value = readDate(deadline[2], now);
    if (value?.day) {
      result.dueDate = value.day;
      result.tokens.push({ key: keyOf(deadline), kind: "deadline", label: `Deadline ${dayLabel(value.day, now, "short")}` });
    }
  }

  const when = take(WHEN_PATTERN, "when");
  if (when?.[2]) {
    const value = readDate(when[2], now);
    if (value) {
      if (value.someday) result.when = "someday";
      if (value.day) result.when = value.day;
      if (value.evening) result.evening = true;
      const label = value.someday
        ? "Someday"
        : value.evening
          ? "This Evening"
          : dayLabel(value.day as string, now);
      result.tokens.push({ key: keyOf(when), kind: "when", label });
    }
  }

  for (const pattern of TIME_PATTERNS) {
    const time = take(pattern, "time");
    if (!time) continue;
    let hour = Number(time[2]);
    const minute = time[3] && /^\d+$/.test(time[3]) ? Number(time[3]) : 0;
    const meridiem = (time[4] ?? "").toLowerCase();
    if (meridiem === "pm" && hour < 12) hour += 12;
    if (meridiem === "am" && hour === 12) hour = 0;
    result.time = hhmm(hour, minute);
    result.tokens.push({ key: keyOf(time), kind: "time", label: result.time });
    break;
  }

  let list: RegExpExecArray | null;
  while ((list = take(LIST_PATTERN, "list"))) {
    const name = list[2] ?? "";
    const wanted = slug(name);
    const project = context.projects?.find((item) => slug(item.title) === wanted) ??
      context.projects?.find((item) => wanted.length >= 2 && slug(item.title).startsWith(wanted));
    const area = project
      ? undefined
      : (context.areas?.find((item) => slug(item.title) === wanted) ??
        context.areas?.find((item) => wanted.length >= 2 && slug(item.title).startsWith(wanted)));
    if (project && !result.projectId && !result.areaId) {
      result.projectId = project._id;
      result.tokens.push({ key: keyOf(list), kind: "list", label: project.title || "Untitled project" });
    } else if (area && !result.projectId && !result.areaId) {
      result.areaId = area._id;
      result.tokens.push({ key: keyOf(list), kind: "list", label: area.title || "Untitled area" });
    } else {
      const tag = name.toLowerCase();
      if (!result.tags.includes(tag)) result.tags.push(tag);
      result.tokens.push({ key: keyOf(list), kind: "tag", label: `#${tag}` });
    }
  }

  const important = take(IMPORTANT_PATTERN, "important");
  if (important) {
    result.important = true;
    result.tokens.push({ key: keyOf(important), kind: "important", label: "Important" });
  }

  result.text = text.replace(/\s+/g, " ").trim();
  return result;
};

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "the 1st", "the 22nd", "the last day". */
export const ordinalDay = (day: number): string => {
  if (day === -1) return "the last day";
  const tens = day % 100;
  const suffix = tens >= 11 && tens <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[day % 10] ?? "th";
  return `the ${day}${suffix}`;
};

/** "Every day", "Every 2 weeks on Mon, Thu", "Monthly, after done". */
export const describeRepeat = (rule: RepeatRule): string => {
  const unit = rule.unit;
  let label: string;
  if (rule.every === 1) {
    label = { day: "Every day", week: "Every week", month: "Every month", year: "Every year" }[unit];
  } else {
    label = `Every ${rule.every} ${unit}s`;
  }
  if (unit === "week" && rule.weekdays.length > 0) {
    const days = [...rule.weekdays].sort();
    label =
      days.join(",") === "1,2,3,4,5" && rule.every === 1
        ? "Every weekday"
        : `${label} on ${days.map((day) => WEEKDAY_SHORT[day]).join(", ")}`;
  }
  if (unit === "month" && rule.monthDay) label += ` on ${ordinalDay(rule.monthDay)}`;
  if (rule.mode === "afterCompletion") label += ", after done";
  return label;
};
