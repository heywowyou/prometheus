import type { MediaLog, MediaLogStatus } from "./types/media-types";

export const SORT_OPTIONS = [
  { value: "recent", label: "Recently logged" },
  { value: "rating", label: "Highest rated" },
  { value: "title", label: "Title A–Z" },
  { value: "released", label: "Release year" },
] as const;
export type SortKey = (typeof SORT_OPTIONS)[number]["value"];

export const isSortKey = (value: unknown): value is SortKey =>
  SORT_OPTIONS.some((option) => option.value === value);

export type StatusFilter = MediaLogStatus | "all";

export interface MediaFilters {
  query: string;
  status: StatusFilter;
  favoritesOnly: boolean;
  missingCover: boolean;
  sort: SortKey;
}

/** Lower-case, accent-free text for matching ("Amélie" ↔ "amelie"). */
const fold = (text: string) =>
  text.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();

const time = (value: string) => new Date(value).getTime() || 0;

const COMPARATORS: Record<SortKey, (a: MediaLog, b: MediaLog) => number> = {
  recent: (a, b) => time(b.date) - time(a.date),
  rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0) || time(b.date) - time(a.date),
  title: (a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
  // Unknown years sort last.
  released: (a, b) => (b.releaseYear ?? -Infinity) - (a.releaseYear ?? -Infinity),
};

const hasCover = (log: MediaLog) =>
  typeof log.cover === "string" ? Boolean(log.cover) : Boolean(log.cover?.url);

export const applyMediaFilters = (logs: MediaLog[], filters: MediaFilters): MediaLog[] => {
  const query = fold(filters.query.trim());
  return logs
    .filter((log) => filters.status === "all" || (log.status ?? "finished") === filters.status)
    .filter((log) => !filters.favoritesOnly || log.favorite)
    .filter((log) => !filters.missingCover || !hasCover(log))
    .filter(
      (log) =>
        !query ||
        fold([log.title, log.director, log.author, log.artist].filter(Boolean).join(" ")).includes(
          query,
        ),
    )
    .sort(COMPARATORS[filters.sort]);
};

export interface MediaStats {
  total: number;
  /** Finished this calendar year. */
  thisYear: number;
  averageRating: number | null;
  /** Books only: pages of books finished this year. */
  pagesThisYear: number;
  missingCovers: number;
  byStatus: Record<MediaLogStatus, number>;
}

export const computeMediaStats = (logs: MediaLog[], now: Date): MediaStats => {
  const year = now.getFullYear();
  const finishedThisYear = logs.filter(
    (log) => (log.status ?? "finished") === "finished" && new Date(log.date).getFullYear() === year,
  );
  const rated = logs.filter((log) => log.rating);
  const byStatus: Record<MediaLogStatus, number> = {
    finished: 0,
    in_progress: 0,
    planned: 0,
    dropped: 0,
  };
  for (const log of logs) byStatus[log.status ?? "finished"] += 1;

  return {
    total: logs.length,
    thisYear: finishedThisYear.length,
    averageRating: rated.length
      ? rated.reduce((sum, log) => sum + (log.rating ?? 0), 0) / rated.length
      : null,
    pagesThisYear: finishedThisYear.reduce((sum, log) => sum + (log.pages ?? 0), 0),
    missingCovers: logs.filter((log) => !hasCover(log)).length,
    byStatus,
  };
};
