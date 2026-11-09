import { useCallback, useMemo } from "react";
import { useApiClient } from "@lib/api/api-client";
import type {
  CoverImage,
  MediaLog,
  MediaLogStatus,
  MediaLogType,
} from "../types/media-types";

const MEDIA_PATH = "/media";

export interface MediaLogFields {
  title: string;
  /** 1–10. */
  rating: number;
  /** `YYYY-MM-DD`. */
  date: string;
  url?: string;
  review?: string;
  status: MediaLogStatus;
  director?: string;
  author?: string;
  pages?: number;
  artist?: string;
}

export interface CreateMediaLogPayload extends MediaLogFields {
  type: MediaLogType;
  cover?: CoverImage;
}

export type UpdateMediaLogPayload = Partial<MediaLogFields> & {
  /** `null` clears the cover; omit the key to leave it unchanged. */
  cover?: CoverImage | null;
};

export const useMediaApi = () => {
  const client = useApiClient();

  const fetchLogs = useCallback(
    async (type?: MediaLogType): Promise<MediaLog[]> => {
      const { data } = await client.get<MediaLog[]>(MEDIA_PATH, {
        params: type ? { type } : undefined,
      });
      return data;
    },
    [client],
  );

  const createLog = useCallback(
    async (payload: CreateMediaLogPayload): Promise<MediaLog> => {
      const { data } = await client.post<MediaLog>(MEDIA_PATH, payload);
      return data;
    },
    [client],
  );

  const updateLog = useCallback(
    async (id: string, payload: UpdateMediaLogPayload): Promise<MediaLog> => {
      const { data } = await client.patch<MediaLog>(
        `${MEDIA_PATH}/${id}`,
        payload,
      );
      return data;
    },
    [client],
  );

  const deleteLog = useCallback(
    async (id: string): Promise<void> => {
      await client.delete(`${MEDIA_PATH}/${id}`);
    },
    [client],
  );

  const toggleFavorite = useCallback(
    async (id: string): Promise<MediaLog> => {
      const { data } = await client.patch<MediaLog>(
        `${MEDIA_PATH}/${id}/favorite`,
      );
      return data;
    },
    [client],
  );

  return useMemo(
    () => ({ fetchLogs, createLog, updateLog, deleteLog, toggleFavorite }),
    [fetchLogs, createLog, updateLog, deleteLog, toggleFavorite],
  );
};
