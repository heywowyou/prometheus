export const NOTE_FONT_FAMILIES = ["sans", "serif"] as const;
export type NoteFontFamily = (typeof NOTE_FONT_FAMILIES)[number];

/** Which slice of notes the dashboard shows. Mirrors the API's `view`. */
export const NOTE_VIEWS = ["active", "archived", "trash"] as const;
export type NotesView = (typeof NOTE_VIEWS)[number];

/** Days a trashed note is kept before the database deletes it. */
export const TRASH_RETENTION_DAYS = 30;

/** A full note, as the editor loads it. */
export interface Note {
  _id: string;
  title: string;
  /** Tiptap HTML. */
  content: string;
  userId: string;
  tags: string[];
  pinned: boolean;
  archived: boolean;
  /** Set while the note is in the trash. */
  deletedAt?: string | null;
  fontFamily: NoteFontFamily;
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
  createdAt: string;
  updatedAt: string;
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
}

export interface UpdateNotePayload {
  title?: string;
  content?: string;
  tags?: string[];
  pinned?: boolean;
  archived?: boolean;
  fontFamily?: NoteFontFamily;
}
