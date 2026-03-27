export interface Note {
  _id: string;
  title: string;
  content: string;
  userId: string;
  pinned: boolean;
  archived: boolean;
  fontFamily: "sans" | "serif";
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotePayload {
  title: string;
  content?: string;
}

export interface UpdateNotePayload {
  title?: string;
  content?: string;
  pinned?: boolean;
  archived?: boolean;
  fontFamily?: "sans" | "serif";
}
