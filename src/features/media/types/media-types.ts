export type MediaLogType =
  | "movie"
  | "tvshow"
  | "book"
  | "music_album"
  | "game";

export interface MediaLog {
  _id: string;
  type: MediaLogType;
  title: string;
  url?: string | null;
  cover?: string | null;
  rating: number; // 1–10
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
