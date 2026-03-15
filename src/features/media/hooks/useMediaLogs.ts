import { useState, useEffect } from "react";
import { useMediaApi } from "../api/media-api";
import type { MediaLog, MediaLogType } from "../types/media-types";
import type {
  CreateMediaLogPayload,
  UpdateMediaLogPayload,
} from "../api/media-api";

export const useMediaLogs = (type?: MediaLogType) => {
  const [logs, setLogs] = useState<MediaLog[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    fetchLogs: apiFetchLogs,
    createLog: apiCreateLog,
    updateLog: apiUpdateLog,
    deleteLog: apiDeleteLog,
  } = useMediaApi();

  const fetchLogs = async () => {
    try {
      const data = await apiFetchLogs(type);
      setLogs(data);
    } catch (error) {
      console.error("Failed to fetch media logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const createLog = async (payload: CreateMediaLogPayload) => {
    try {
      const created = await apiCreateLog(payload);
      setLogs((prev) => [created, ...prev]);
      return created;
    } catch (error) {
      console.error("Failed to create media log:", error);
      throw error;
    }
  };

  const updateLog = async (id: string, payload: UpdateMediaLogPayload) => {
    try {
      const updated = await apiUpdateLog(id, payload);
      setLogs((prev) =>
        prev.map((log) => (log._id === id ? updated : log))
      );
      return updated;
    } catch (error) {
      console.error("Failed to update media log:", error);
      throw error;
    }
  };

  const deleteLog = async (id: string) => {
    try {
      await apiDeleteLog(id);
      setLogs((prev) => prev.filter((log) => log._id !== id));
    } catch (error) {
      console.error("Failed to delete media log:", error);
    }
  };

  useEffect(() => {
    void fetchLogs();
  }, []);

  return {
    logs,
    loading,
    createLog,
    updateLog,
    deleteLog,
    refetch: fetchLogs,
  };
};
