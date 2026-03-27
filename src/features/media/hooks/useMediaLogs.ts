import { useState, useEffect, useCallback } from "react";
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
    toggleFavorite: apiToggleFavorite,
  } = useMediaApi();

  const fetchLogs = useCallback(async () => {
    try {
      const data = await apiFetchLogs(type);
      setLogs(data);
    } catch (error) {
      console.error("Failed to fetch media logs:", error);
    } finally {
      setLoading(false);
    }
  }, [apiFetchLogs, type]);

  const createLog = async (payload: CreateMediaLogPayload) => {
    try {
      const created = await apiCreateLog(payload);
      setLogs((prev) =>
        [...prev, created].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
      );
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
        prev
          .map((log) => (log._id === id ? updated : log))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
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

  const toggleFavorite = async (id: string) => {
    // Optimistic update
    setLogs((prev) =>
      prev.map((log) => (log._id === id ? { ...log, favorite: !log.favorite } : log))
    );
    try {
      const updated = await apiToggleFavorite(id);
      setLogs((prev) => prev.map((log) => (log._id === id ? updated : log)));
    } catch (error) {
      // Revert on failure
      setLogs((prev) =>
        prev.map((log) => (log._id === id ? { ...log, favorite: !log.favorite } : log))
      );
      console.error("Failed to toggle favorite:", error);
    }
  };

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  return {
    logs,
    loading,
    createLog,
    updateLog,
    deleteLog,
    toggleFavorite,
    refetch: fetchLogs,
  };
};
