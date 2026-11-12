import { useCallback } from "react";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { queryKeys } from "@lib/query/keys";
import { useMetadataApi } from "../api/metadata-api";
import type { MediaLogType } from "../types/media-types";
import type { MetadataProvider } from "../types/metadata-types";

export const MIN_SEARCH_LENGTH = 2;

/**
 * Catalogue search for the title field. `query` should already be debounced.
 *
 * Errors are shown inline by the dropdown rather than toasted: a search runs
 * on every pause in typing, and one toast per pause would be noise.
 */
export const useMetadataSearch = (
  type: MediaLogType,
  query: string,
  enabled: boolean,
) => {
  const api = useMetadataApi();
  const normalised = query.trim().toLowerCase();

  const result = useQuery({
    queryKey: queryKeys.media.metadataSearch(type, normalised),
    queryFn: () => api.search(type, query.trim()),
    enabled: enabled && normalised.length >= MIN_SEARCH_LENGTH,
    staleTime: 10 * 60_000,
    // Keep the last list on screen while the next one loads.
    placeholderData: keepPreviousData,
    retry: false,
    meta: { silentErrors: true },
  });

  return {
    results: result.data ?? [],
    isFetching: result.isFetching,
    isError: result.isError,
  };
};

/** Loads (and caches) the full details for a picked search result. */
export const useMetadataDetails = () => {
  const queryClient = useQueryClient();
  const api = useMetadataApi();

  return useCallback(
    (provider: MetadataProvider, id: string) =>
      queryClient.fetchQuery({
        queryKey: queryKeys.media.metadataDetails(provider, id),
        queryFn: () => api.details(provider, id),
        staleTime: 60 * 60_000,
      }),
    [queryClient, api],
  );
};
