import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@lib/api/errors";
import { queryKeys } from "@lib/query/keys";
import type { MediaLog, MediaLogType } from "@features/media/types/media-types";
import { useProfileApi, type Profile } from "../api/profile-api";

/** The profile and its top picks, with optimistic edits per row. */
export const useProfile = () => {
  const queryClient = useQueryClient();
  const api = useProfileApi();
  const key = queryKeys.profile.all;

  const query = useQuery({ queryKey: key, queryFn: api.fetchProfile });

  const setPicks = useMutation({
    mutationFn: ({ type, logs }: { type: MediaLogType; logs: MediaLog[] }) =>
      api.setTopPicks(
        type,
        logs.map((log) => log._id),
      ),
    onMutate: async ({ type, logs }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const snapshot = queryClient.getQueryData<Profile>(key);
      queryClient.setQueryData<Profile>(key, (previous) =>
        previous ? { ...previous, topPicks: { ...previous.topPicks, [type]: logs } } : previous,
      );
      return { snapshot };
    },
    // Owning onError opts out of the global toast, so report it here.
    onError: (error, _vars, context) => {
      if (context?.snapshot) queryClient.setQueryData(key, context.snapshot);
      toast.error(`Couldn't save your picks: ${getErrorMessage(error)}`);
    },
    onSuccess: (profile) => queryClient.setQueryData(key, profile),
  });

  return {
    profile: query.data ?? null,
    loading: query.isPending,
    /** Saves a row as the full ordered list of logs. */
    setPicks: (type: MediaLogType, logs: MediaLog[]) => setPicks.mutate({ type, logs }),
  };
};
