import { useCallback, useMemo } from "react";
import { useApiClient } from "@lib/api/api-client";
import type { MediaLogType } from "../types/media-types";
import type {
  MetadataCandidate,
  MetadataDetails,
  MetadataProvider,
} from "../types/metadata-types";

const METADATA_PATH = "/metadata";

/** Title lookup against TMDB / Open Library / MusicBrainz / Steam, via the API. */
export const useMetadataApi = () => {
  const client = useApiClient();

  const search = useCallback(
    async (type: MediaLogType, q: string): Promise<MetadataCandidate[]> => {
      const { data } = await client.get<MetadataCandidate[]>(
        `${METADATA_PATH}/search`,
        { params: { type, q } },
      );
      return data;
    },
    [client],
  );

  const details = useCallback(
    async (provider: MetadataProvider, id: string): Promise<MetadataDetails> => {
      const { data } = await client.get<MetadataDetails>(
        `${METADATA_PATH}/${provider}/${encodeURIComponent(id)}`,
      );
      return data;
    },
    [client],
  );

  return useMemo(() => ({ search, details }), [search, details]);
};
