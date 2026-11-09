/**
 * Recurrence vocabulary, mirroring `core/domain/recurrence.ts` in the backend.
 *
 * Only the type and labels live here. The reset *calculation* is deliberately
 * backend-only now: the API reports whether a recurring todo is currently
 * complete, so the client no longer recomputes rollover and the two
 * implementations can't disagree. If this ever needs to move, promote it to a
 * shared package rather than copying the logic back.
 */
export const RECURRENCE_TYPES = ["none", "daily", "weekly", "monthly"] as const;

export type RecurrenceType = (typeof RECURRENCE_TYPES)[number];

export const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  none: "One-time",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};
