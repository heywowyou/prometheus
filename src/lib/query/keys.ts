import type { MediaLogType } from "@features/media/types/media-types";
import type { MetadataProvider } from "@features/media/types/metadata-types";

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
    metadataSearch: (type: MediaLogType, query: string) =>
      ["media", "metadata", "search", type, query] as const,
    metadataDetails: (provider: MetadataProvider, id: string) =>
      ["media", "metadata", "details", provider, id] as const,
  },
  notes: {
    all: ["notes"] as const,
    /** Prefix matching both the active and archived lists. */
    lists: () => ["notes", "list"] as const,
    list: (opts: { archived?: boolean } = {}) =>
      ["notes", "list", { archived: opts.archived ?? false }] as const,
    detail: (id: string) => ["notes", "detail", id] as const,
  },
} as const;
