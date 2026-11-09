import { Film, Tv, BookOpen, Disc3, Gamepad2, type LucideIcon } from "lucide-react";
import type { MediaLogType } from "./types/media-types";

/** The extra credit fields a media type collects beyond the shared ones. */
export type CreditField = "director" | "author" | "pages" | "artist";

export interface MediaTypeConfig {
  type: MediaLogType;
  /** URL segment under `/media`. */
  slug: string;
  /** Tab and heading label, e.g. "Movies". */
  plural: string;
  /** Used in prose: "Add movie", "No movies logged yet". */
  singular: string;
  icon: LucideIcon;
  /** Tailwind aspect ratio for the cover art. */
  coverAspect: string;
  credits: readonly CreditField[];
}

/**
 * Single source of truth for the media panels.
 *
 * The five panels were previously five byte-identical page components; they are
 * now one page parameterised by this map, so adding a media type is a matter of
 * adding an entry here.
 */
export const MEDIA_TYPE_CONFIGS = [
  {
    type: "movie",
    slug: "movies",
    plural: "Movies",
    singular: "movie",
    icon: Film,
    coverAspect: "aspect-[2/3]",
    credits: ["director"],
  },
  {
    type: "tvshow",
    slug: "tv",
    plural: "TV Shows",
    singular: "show",
    icon: Tv,
    coverAspect: "aspect-[2/3]",
    credits: [],
  },
  {
    type: "book",
    slug: "books",
    plural: "Books",
    singular: "book",
    icon: BookOpen,
    coverAspect: "aspect-[2/3]",
    credits: ["author", "pages"],
  },
  {
    type: "music_album",
    slug: "music",
    plural: "Music",
    singular: "album",
    icon: Disc3,
    coverAspect: "aspect-square",
    credits: ["artist"],
  },
  {
    type: "game",
    slug: "games",
    plural: "Games",
    singular: "game",
    icon: Gamepad2,
    coverAspect: "aspect-[2/3]",
    credits: [],
  },
] as const satisfies ReadonlyArray<MediaTypeConfig>;

const BY_TYPE = new Map<MediaLogType, MediaTypeConfig>(
  MEDIA_TYPE_CONFIGS.map((config) => [config.type, config]),
);
const BY_SLUG = new Map<string, MediaTypeConfig>(
  MEDIA_TYPE_CONFIGS.map((config) => [config.slug, config]),
);

export const configForType = (type: MediaLogType): MediaTypeConfig => {
  const config = BY_TYPE.get(type);
  if (!config) throw new Error(`No media config for type "${type}"`);
  return config;
};

export const configForSlug = (slug: string | undefined): MediaTypeConfig | null =>
  (slug && BY_SLUG.get(slug)) || null;

export const DEFAULT_MEDIA_SLUG = MEDIA_TYPE_CONFIGS[0].slug;
