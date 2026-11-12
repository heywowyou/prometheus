import type { MediaLog, MediaLogStatus } from "./types/media-types";

/** "Directed by …", "Frank Herbert · 608 pages", "Radiohead". */
export const creditLine = (log: MediaLog): string | null => {
  switch (log.type) {
    case "movie":
      return log.director ? `Directed by ${log.director}` : null;
    case "book":
      return (
        [log.author, log.pages ? `${log.pages} pages` : null].filter(Boolean).join(" · ") ||
        null
      );
    case "music_album":
      return log.artist || null;
    default:
      return null;
  }
};

export interface StatusMeta {
  label: string;
  /** What the log's `date` means for this status, e.g. "Finished". */
  dateLabel: string;
  /** Token classes for the status badge. */
  badge: string;
  /** Whether a rating makes sense yet. */
  rated: boolean;
}

/** Display rules per status, shared by cards, the detail view and the form. */
export const STATUS_META: Record<MediaLogStatus, StatusMeta> = {
  finished: {
    label: "Finished",
    dateLabel: "Finished",
    badge: "border-success/40 bg-success/15 text-success",
    rated: true,
  },
  in_progress: {
    label: "In progress",
    dateLabel: "Started",
    badge: "border-warning/40 bg-warning/15 text-warning",
    rated: true,
  },
  planned: {
    label: "Planned",
    dateLabel: "Added",
    badge: "border-rating/40 bg-rating/15 text-rating",
    rated: false,
  },
  dropped: {
    label: "Dropped",
    dateLabel: "Dropped",
    badge: "border-border bg-secondary text-muted-foreground",
    rated: true,
  },
};

/** "12 Mar 2026" for a stored ISO date, or null. */
export const formatLogDate = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};
