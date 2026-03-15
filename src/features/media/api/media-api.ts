import { useApiClient } from "../../../lib/api/api-client";
import type { MediaLog, MediaLogType } from "../types/media-types";

const MEDIA_PATH = "/media";

export interface CreateMediaLogPayload {
  type: MediaLogType;
  title: string;
  url?: string;
  cover?: string;
  rating: number;
}

export type UpdateMediaLogPayload = Partial<CreateMediaLogPayload>;

export const useMediaApi = () => {
  const { withAuth } = useApiClient();

  const fetchLogs = async (): Promise<MediaLog[]> => {
    const client = await withAuth();
    const response = await client.get<MediaLog[]>(MEDIA_PATH);
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
