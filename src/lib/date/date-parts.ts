export interface DateParts {
  day: string;
  month: string;
  year: string;
}

const pad = (value: number, length: number) => String(value).padStart(length, "0");

export const dateToParts = (date: Date): DateParts => ({
  day: pad(date.getDate(), 2),
  month: pad(date.getMonth() + 1, 2),
  year: String(date.getFullYear()),
});

/** Splits an ISO date (or date-time) into display parts, defaulting to today. */
export const isoToParts = (iso: string | null | undefined): DateParts => {
  const date = iso ? new Date(iso) : new Date();
  return dateToParts(Number.isNaN(date.getTime()) ? new Date() : date);
};

/** `YYYY-MM-DD`, or null when the parts don't form a real calendar date. */
export const partsToIso = (parts: DateParts): string | null => {
  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);

  if (!Number.isInteger(year) || parts.year.length !== 4) return null;
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;
  if (!Number.isInteger(day) || day < 1) return null;

  // Reject day overflow (e.g. 31 February) by round-tripping through Date.
  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (candidate.getUTCMonth() !== month - 1 || candidate.getUTCDate() !== day) {
    return null;
  }

  return `${parts.year}-${pad(month, 2)}-${pad(day, 2)}`;
};
