import { useCallback } from "react";
import { useApiClient } from "../../../lib/api/api-client";
import type { MediaLog, MediaLogType, CoverImage } from "../types/media-types";

const MEDIA_PATH = "/media";

export interface CreateMediaLogPayload {
  type: MediaLogType;
  title: string;
  url?: string;
  cover?: CoverImage;
  rating: number;
  review?: string;
  date: string;
  status?: "finished" | "in_progress";
  director?: string;
  author?: string;
  pages?: number;
  artist?: string;
}

export type UpdateMediaLogPayload = Partial<Omit<CreateMediaLogPayload, "cover">> & {
  cover?: CoverImage | null;
};

export const useMediaApi = () => {
  const client = useApiClient();

  const fetchLogs = useCallback(
    async (type?: MediaLogType): Promise<MediaLog[]> => {
      const params = type ? { params: { type } } : undefined;
      const response = await client.get<MediaLog[]>(MEDIA_PATH, params);
      return response.data;
    },
    [client]
  );

  const createLog = useCallback(
    async (payload: CreateMediaLogPayload): Promise<MediaLog> => {
      const response = await client.post<MediaLog>(MEDIA_PATH, payload);
      return response.data;
    },
    [client]
  );

  const updateLog = useCallback(
    async (id: string, payload: UpdateMediaLogPayload): Promise<MediaLog> => {
      const response = await client.put<MediaLog>(
        `${MEDIA_PATH}/${id}`,
        payload
      );
      return response.data;
    },
    [client]
  );

  const deleteLog = useCallback(
    async (id: string): Promise<void> => {
      await client.delete(`${MEDIA_PATH}/${id}`);
    },
    [client]
  );

  const toggleFavorite = useCallback(
    async (id: string): Promise<MediaLog> => {
      const response = await client.patch<MediaLog>(`${MEDIA_PATH}/${id}/favorite`);
      return response.data;
    },
    [client]
  );

  return { fetchLogs, createLog, updateLog, deleteLog, toggleFavorite };
};
