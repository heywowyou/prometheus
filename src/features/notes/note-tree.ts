import type { NoteIndexEntry } from "./types/note-types";

export interface NoteTree {
  byId: Map<string, NoteIndexEntry>;
  /** Pages at the top level, in order. Daily notes and templates live apart. */
  roots: NoteIndexEntry[];
  childrenOf: (id: string | null) => NoteIndexEntry[];
  favorites: NoteIndexEntry[];
  /** Newest day first. */
  dailies: NoteIndexEntry[];
  templates: NoteIndexEntry[];
  /** Ancestors of a page, outermost first (not including the page). */
  pathTo: (id: string) => NoteIndexEntry[];
  /** Every page under `id`. */
  descendantsOf: (id: string) => Set<string>;
}

const byOrder = (a: NoteIndexEntry, b: NoteIndexEntry) => a.order - b.order;

/** A page's display title. */
export const titleOf = (entry: Pick<NoteIndexEntry, "title"> | undefined | null) =>
  entry?.title.trim() || "Untitled";

export const buildNoteTree = (entries: NoteIndexEntry[]): NoteTree => {
  const byId = new Map(entries.map((entry) => [entry._id, entry]));
  const children = new Map<string | null, NoteIndexEntry[]>();

  for (const entry of entries) {
    if (entry.isTemplate) continue;
    // A daily note joins the tree only once it's been nested somewhere.
    if (entry.dailyDate && !entry.parentId) continue;
    // A page whose parent is gone (archived or trashed) shows at the top level.
    const parent = entry.parentId && byId.has(entry.parentId) ? entry.parentId : null;
    children.set(parent, [...(children.get(parent) ?? []), entry]);
  }
  for (const list of children.values()) list.sort(byOrder);

  const childrenOf = (id: string | null) => children.get(id) ?? [];

  const pathTo = (id: string) => {
    const path: NoteIndexEntry[] = [];
    const seen = new Set<string>([id]);
    let current = byId.get(id)?.parentId ?? null;
    while (current && !seen.has(current)) {
      const entry = byId.get(current);
      if (!entry) break;
      path.unshift(entry);
      seen.add(current);
      current = entry.parentId;
    }
    return path;
  };

  const descendantsOf = (id: string) => {
    const result = new Set<string>();
    const queue = [id];
    while (queue.length > 0) {
      const current = queue.shift() as string;
      for (const child of childrenOf(current)) {
        if (result.has(child._id)) continue;
        result.add(child._id);
        queue.push(child._id);
      }
    }
    return result;
  };

  return {
    byId,
    roots: childrenOf(null),
    childrenOf,
    favorites: entries.filter((entry) => entry.pinned && !entry.isTemplate),
    dailies: entries
      .filter((entry) => entry.dailyDate)
      .sort((a, b) => (b.dailyDate ?? "").localeCompare(a.dailyDate ?? "")),
    templates: entries.filter((entry) => entry.isTemplate),
    pathTo,
    descendantsOf,
  };
};

/** Local calendar day as `YYYY-MM-DD`. */
export const dayKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;

/** `YYYY-MM-DD` to a local Date at midnight. */
export const parseDayKey = (key: string): Date => {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
};

/** "Monday 16 November 2026", in the browser's language. */
export const dailyTitle = (key: string): string =>
  parseDayKey(key).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export const shiftDay = (key: string, days: number): string => {
  const date = parseDayKey(key);
  date.setDate(date.getDate() + days);
  return dayKey(date);
};
