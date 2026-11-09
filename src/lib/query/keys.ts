import type { MediaLogType } from "@features/media/types/media-types";

/**
 * Every query key in one place, so invalidations can't drift from the keys they
 * are meant to match.
 */
export const queryKeys = {
  todos: {
    all: ["todos"] as const,
    list: (opts: { paused?: boolean } = {}) =>
      ["todos", "list", { paused: opts.paused ?? false }] as const,
  },
  media: {
    all: ["media"] as const,
    list: (type?: MediaLogType) => ["media", "list", type ?? "all"] as const,
  },
  notes: {
    all: ["notes"] as const,
    list: () => ["notes", "list"] as const,
    detail: (id: string) => ["notes", "detail", id] as const,
  },
} as const;
