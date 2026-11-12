import { isoToParts, type DateParts } from "@lib/date/date-parts";
import {
  toCoverImage,
  type CoverImage,
  type MediaLog,
  type MediaLogStatus,
  type MediaLogType,
} from "../types/media-types";
import type { ExternalRef, MetadataDetails } from "../types/metadata-types";

export interface MediaLogFormValues {
  type: MediaLogType;
  title: string;
  /** 1–10, or null when unrated. */
  rating: number | null;
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
  rating: null,
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
  rating: log.rating ?? null,
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

/**
 * Overlays catalogue details onto the form. Only fields the catalogue knows
 * are replaced, so a rating, date, status or review already entered is kept.
 */
export const applyDetails = (
  values: MediaLogFormValues,
  details: MetadataDetails,
): MediaLogFormValues => ({
  ...values,
  title: details.title,
  releaseYear: details.year ? String(details.year) : values.releaseYear,
  url: details.url ?? values.url,
  cover: details.coverUrl ? { url: details.coverUrl, source: "external" } : values.cover,
  director: details.credits.director ?? values.director,
  author: details.credits.author ?? values.author,
  pages: details.credits.pages ? String(details.credits.pages) : values.pages,
  artist: details.credits.artist ?? values.artist,
  external: { provider: details.provider, id: details.externalId },
});
