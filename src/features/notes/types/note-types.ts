export const NOTE_FONT_FAMILIES = ["sans", "serif"] as const;
export type NoteFontFamily = (typeof NOTE_FONT_FAMILIES)[number];

export interface Note {
  _id: string;
  title: string;
  /** Tiptap HTML. */
  content: string;
  userId: string;
  pinned: boolean;
  archived: boolean;
  fontFamily: NoteFontFamily;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotePayload {
  title?: string;
  content?: string;
}

export interface UpdateNotePayload {
  title?: string;
  content?: string;
  pinned?: boolean;
  archived?: boolean;
  fontFamily?: NoteFontFamily;
}
