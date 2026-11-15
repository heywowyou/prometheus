export const NOTE_FONT_FAMILIES = ["sans", "serif"] as const;
export type NoteFontFamily = (typeof NOTE_FONT_FAMILIES)[number];

/** Which slice of notes the dashboard shows. Mirrors the API's `view`. */
export const NOTE_VIEWS = ["active", "archived", "trash"] as const;
export type NotesView = (typeof NOTE_VIEWS)[number];

/** Days a trashed note is kept before the database deletes it. */
export const TRASH_RETENTION_DAYS = 30;

export interface NoteCover {
  /** An https image URL, or a CSS `linear-gradient(...)`. */
  url: string;
  publicId?: string;
}

/** A full note, as the editor loads it. */
export interface Note {
  _id: string;
  title: string;
  /** Tiptap HTML. */
  content: string;
  userId: string;
  tags: string[];
  /** Shown under Favorites. */
  pinned: boolean;
  archived: boolean;
  /** Set while the note is in the trash. */
  deletedAt?: string | null;
  fontFamily: NoteFontFamily;
  icon?: string;
  cover?: NoteCover | null;
  parentId?: string | null;
  order?: number;
  /** `YYYY-MM-DD` on a daily note. */
  dailyDate?: string;
  isTemplate?: boolean;
  isDailyTemplate?: boolean;
  links?: string[];
  createdAt: string;
  updatedAt: string;
}

/** A list item: no body, just a plain-text excerpt. */
export interface NoteSummary {
  _id: string;
  title: string;
  excerpt: string;
  tags: string[];
  pinned: boolean;
  archived: boolean;
  deletedAt?: string | null;
  fontFamily: NoteFontFamily;
  icon?: string;
  parentId?: string | null;
  dailyDate?: string;
  isTemplate?: boolean;
  createdAt: string;
  updatedAt: string;
}

/** One light entry per live note, for the page tree, link search, the switcher and the graph. */
export interface NoteIndexEntry {
  _id: string;
  title: string;
  icon: string;
  parentId: string | null;
  order: number;
  pinned: boolean;
  dailyDate?: string;
  isTemplate: boolean;
  isDailyTemplate: boolean;
  /** No title, text or images yet. */
  empty: boolean;
  /** Ids of the notes this one links to. */
  links: string[];
  updatedAt: string;
}

export interface BacklinkEntry {
  _id: string;
  title: string;
  icon: string;
  snippet: string;
  updatedAt: string;
}

export interface Backlinks {
  linked: BacklinkEntry[];
  /** Notes mentioning this note's title without linking it. */
  unlinked: BacklinkEntry[];
}

export interface NoteVersionSummary {
  _id: string;
  title: string;
  excerpt: string;
  createdAt: string;
}

export interface NoteVersion {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface NotesFilter {
  view: NotesView;
  query?: string;
  tag?: string;
}

export interface TagCount {
  tag: string;
  count: number;
}

export interface CreateNotePayload {
  title?: string;
  content?: string;
  tags?: string[];
  fontFamily?: NoteFontFamily;
  icon?: string;
  /** Nest the new page under this one. */
  parentId?: string | null;
  /** Start from this template's body, icon, font and tags. */
  templateId?: string;
  isTemplate?: boolean;
}

export interface UpdateNotePayload {
  title?: string;
  content?: string;
  tags?: string[];
  pinned?: boolean;
  archived?: boolean;
  fontFamily?: NoteFontFamily;
  icon?: string;
  /** `null` removes the cover. */
  cover?: NoteCover | null;
  /** `null` moves the page to the top level. */
  parentId?: string | null;
  isTemplate?: boolean;
  isDailyTemplate?: boolean;
}
