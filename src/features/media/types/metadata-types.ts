/** Mirrors `modules/metadata/metadata.types.ts` in the backend. */
export const METADATA_PROVIDERS = [
  "tmdb-movie",
  "tmdb-tv",
  "openlibrary",
  "musicbrainz",
  "steam",
] as const;
export type MetadataProvider = (typeof METADATA_PROVIDERS)[number];

/** A link from a media log to the catalogue entry it was filled from. */
export interface ExternalRef {
  provider: MetadataProvider;
  id: string;
}

/** One search hit, for the title dropdown. */
export interface MetadataCandidate {
  provider: MetadataProvider;
  externalId: string;
  title: string;
  year?: number;
  subtitle?: string;
  thumbnailUrl?: string;
}

/** Everything the media form can be filled with for one title. */
export interface MetadataDetails {
  provider: MetadataProvider;
  externalId: string;
  title: string;
  year?: number;
  /** Remote cover. The API copies it into Cloudinary when the log is saved. */
  coverUrl?: string;
  url?: string;
  credits: {
    director?: string;
    author?: string;
    pages?: number;
    artist?: string;
  };
}
