import { useApiClient } from "../../../lib/api/api-client";
import type { MediaLog, MediaLogType } from "../types/media-types";

const MEDIA_PATH = "/media";

export interface CreateMediaLogPayload {
  type: MediaLogType;
  title: string;
  url?: string;
  cover?: string;
  rating: number;
  review?: string;
  date: string;
  status?: "finished" | "in_progress";
  director?: string;
  author?: string;
  pages?: number;
  artist?: string;
}

export type UpdateMediaLogPayload = Partial<CreateMediaLogPayload>;

export const useMediaApi = () => {
  const { withAuth } = useApiClient();

  const fetchLogs = async (type?: MediaLogType): Promise<MediaLog[]> => {
    const client = await withAuth();
    const params = type ? { params: { type } } : undefined;
    const response = await client.get<MediaLog[]>(MEDIA_PATH, params);
    return response.data;
  };

  const createLog = async (
    payload: CreateMediaLogPayload
  ): Promise<MediaLog> => {
    const client = await withAuth();
    const response = await client.post<MediaLog>(MEDIA_PATH, payload);
    return response.data;
  };

  const updateLog = async (
    id: string,
    payload: UpdateMediaLogPayload
  ): Promise<MediaLog> => {
    const client = await withAuth();
    const response = await client.put<MediaLog>(`${MEDIA_PATH}/${id}`, payload);
    return response.data;
  };

  const deleteLog = async (id: string): Promise<void> => {
    const client = await withAuth();
    await client.delete(`${MEDIA_PATH}/${id}`);
  };

  return {
    fetchLogs,
    createLog,
    updateLog,
    deleteLog,
  };
};
