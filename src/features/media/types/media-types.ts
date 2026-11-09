export const MEDIA_LOG_TYPES = [
  "movie",
  "tvshow",
  "book",
  "music_album",
  "game",
] as const;
export type MediaLogType = (typeof MEDIA_LOG_TYPES)[number];

export const MEDIA_LOG_STATUSES = ["finished", "in_progress"] as const;
export type MediaLogStatus = (typeof MEDIA_LOG_STATUSES)[number];

export interface CoverImage {
  url: string;
  source: "upload" | "external";
  /** Cloudinary id, present only for covers we uploaded. */
  publicId?: string;
}

export interface MediaLog {
  _id: string;
  type: MediaLogType;
  title: string;
  url?: string | null;
  /** May be a plain URL string on documents written before the cover refactor. */
  cover?: CoverImage | string | null;
  /** 1–10. */
  rating: number;
  review?: string | null;
  date: string;
  status: MediaLogStatus;
  director?: string | null;
  author?: string | null;
  pages?: number | null;
  artist?: string | null;
  favorite: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

/** Reads a cover value that may be a legacy plain string. */
export const resolveCoverUrl = (
  cover: CoverImage | string | null | undefined,
): string | null => {
  if (!cover) return null;
  if (typeof cover === "string") return cover || null;
  return cover.url || null;
};

/** Converts a stored cover into the structured form the form inputs expect. */
export const toCoverImage = (
  cover: CoverImage | string | null | undefined,
): CoverImage | null => {
  if (!cover) return null;
  if (typeof cover === "string") {
    return cover ? { url: cover, source: "external" } : null;
  }
  return cover.url ? cover : null;
};

export const MEDIA_TYPE_LABELS: Record<MediaLogType, string> = {
  movie: "Movie",
  tvshow: "TV Show",
  book: "Book",
  music_album: "Music Album",
  game: "Game",
};
