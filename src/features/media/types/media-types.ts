export type MediaLogType =
  | "movie"
  | "tvshow"
  | "book"
  | "music_album"
  | "game";

export interface CoverImage {
  url: string;
  source: "upload" | "external";
  publicId?: string;
}

/** Normalises a cover value that may be a legacy plain string or the new structured object. */
export function resolveCoverUrl(cover: CoverImage | string | null | undefined): string | null {
  if (!cover) return null;
  if (typeof cover === "string") return cover || null;
  return cover.url || null;
}

export interface MediaLog {
  _id: string;
  type: MediaLogType;
  title: string;
  url?: string | null;
  /** May be a legacy plain string on old documents. */
  cover?: CoverImage | string | null;
  rating: number; // 1–10
   review?: string | null;
   date: string;
   status: "finished" | "in_progress";
   director?: string | null;
   author?: string | null;
   pages?: number | null;
   artist?: string | null;
  favorite: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export const MEDIA_TYPE_LABELS: Record<MediaLogType, string> = {
  movie: "Movie",
  tvshow: "TV Show",
  book: "Book",
  music_album: "Music Album",
  game: "Game",
};
