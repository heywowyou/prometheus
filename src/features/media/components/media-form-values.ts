import { isoToParts, type DateParts } from "@lib/date/date-parts";
import {
  toCoverImage,
  type CoverImage,
  type MediaLog,
  type MediaLogStatus,
  type MediaLogType,
} from "../types/media-types";
import type { ExternalRef } from "../types/metadata-types";

export interface MediaLogFormValues {
  type: MediaLogType;
  title: string;
  rating: number;
  date: DateParts;
  status: MediaLogStatus;
  url: string;
  review: string;
  cover: CoverImage | null;
  director: string;
  author: string;
  pages: string;
  artist: string;
  releaseYear: string;
  external: ExternalRef | null;
}

const empty = (type: MediaLogType): MediaLogFormValues => ({
  type,
  title: "",
  rating: 5,
  date: isoToParts(null),
  status: "finished",
  url: "",
  review: "",
  cover: null,
  director: "",
  author: "",
  pages: "",
  artist: "",
  releaseYear: "",
  external: null,
});

const fromLog = (log: MediaLog): MediaLogFormValues => ({
  type: log.type,
  title: log.title,
  rating: log.rating,
  date: isoToParts(log.date),
  status: log.status ?? "finished",
  url: log.url ?? "",
  review: log.review ?? "",
  cover: toCoverImage(log.cover),
  director: log.director ?? "",
  author: log.author ?? "",
  pages: log.pages != null ? String(log.pages) : "",
  artist: log.artist ?? "",
  releaseYear: log.releaseYear != null ? String(log.releaseYear) : "",
  external: log.external ?? null,
});

/** The form's starting state, for either create or edit. */
export const initialFormValues = (
  log: MediaLog | null,
  presetType: MediaLogType | undefined,
): MediaLogFormValues => (log ? fromLog(log) : empty(presetType ?? "movie"));
