import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@lib/query/keys";
import {
  useMediaApi,
  type CreateMediaLogPayload,
  type UpdateMediaLogPayload,
} from "../api/media-api";
import type { MediaLog, MediaLogType } from "../types/media-types";

const byDateDesc = (a: MediaLog, b: MediaLog) =>
  new Date(b.date).getTime() - new Date(a.date).getTime();

export const useMediaLogs = (type?: MediaLogType) => {
  const queryClient = useQueryClient();
  const api = useMediaApi();
  const listKey = queryKeys.media.list(type);

  const query = useQuery({
    queryKey: listKey,
    queryFn: () => api.fetchLogs(type),
  });

  const writeToCache = (updated: MediaLog) => {
    queryClient.setQueryData<MediaLog[]>(listKey, (previous) =>
      previous
        ?.map((log) => (log._id === updated._id ? updated : log))
        .sort(byDateDesc),
    );
  };

  const createLog = useMutation({
    mutationFn: (payload: CreateMediaLogPayload) => api.createLog(payload),
    onSuccess: (created) => {
      queryClient.setQueryData<MediaLog[]>(listKey, (previous) =>
        [...(previous ?? []), created].sort(byDateDesc),
      );
    },
  });

  const updateLog = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMediaLogPayload }) =>
      api.updateLog(id, payload),
    onSuccess: writeToCache,
  });

  const deleteLog = useMutation({
    mutationFn: (id: string) => api.deleteLog(id),
    onSuccess: (_result, id) => {
      queryClient.setQueryData<MediaLog[]>(listKey, (previous) =>
        previous?.filter((log) => log._id !== id),
      );
    },
  });

  const toggleFavorite = useMutation({
    mutationFn: (id: string) => api.toggleFavorite(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const snapshot = queryClient.getQueryData<MediaLog[]>(listKey);

      queryClient.setQueryData<MediaLog[]>(listKey, (previous) =>
        previous?.map((log) =>
          log._id === id ? { ...log, favorite: !log.favorite } : log,
        ),
      );
      return { snapshot };
    },
    onError: (_error, _id, context) => {
      if (context?.snapshot) {
        queryClient.setQueryData(listKey, context.snapshot);
      }
    },
    onSuccess: writeToCache,
  });

  return {
    logs: query.data ?? [],
    loading: query.isPending,
    error: query.error,
    createLog: (payload: CreateMediaLogPayload) => createLog.mutateAsync(payload),
    updateLog: (id: string, payload: UpdateMediaLogPayload) =>
      updateLog.mutateAsync({ id, payload }),
    deleteLog: (id: string) => deleteLog.mutate(id),
    toggleFavorite: (id: string) => toggleFavorite.mutate(id),
    refetch: query.refetch,
  };
};
