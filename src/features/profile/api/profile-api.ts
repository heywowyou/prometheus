import { useCallback, useMemo } from "react";
import { useApiClient } from "@lib/api/api-client";
import type { MediaLog, MediaLogType } from "@features/media/types/media-types";

/** How many picks each row holds. Mirrors `TOP_PICKS_LIMIT` in the API. */
export const TOP_PICKS_LIMIT = 5;

export interface Profile {
  /** Picked logs per media type, in the user's order. */
  topPicks: Record<MediaLogType, MediaLog[]>;
}

export const useProfileApi = () => {
  const client = useApiClient();

  const fetchProfile = useCallback(async (): Promise<Profile> => {
    const { data } = await client.get<Profile>("/profile");
    return data;
  }, [client]);

  const setTopPicks = useCallback(
    async (type: MediaLogType, ids: string[]): Promise<Profile> => {
      const { data } = await client.put<Profile>(`/profile/top-picks/${type}`, { ids });
      return data;
    },
    [client],
  );

  return useMemo(() => ({ fetchProfile, setTopPicks }), [fetchProfile, setTopPicks]);
};
