import { useMemo } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getErrorMessage, toApiError } from "@lib/api/errors";
import { queryKeys } from "@lib/query/keys";
import {
  useWorkoutsApi,
  type ExercisePayload,
  type RoutinePayload,
} from "../api/workouts-api";
import type { Exercise, Routine, WorkoutSession } from "../types/workout-types";

const keys = queryKeys.workouts;
const HISTORY_PAGE = 20;

// ---- Exercises ------------------------------------------------------------

export const useExercises = (opts: { archived?: boolean } = {}) => {
  const api = useWorkoutsApi();
  const query = useQuery({
    queryKey: keys.exercises(opts),
    queryFn: () => api.fetchExercises(opts),
  });
  return { exercises: query.data ?? [], loading: query.isPending };
};

export const useExerciseActions = () => {
  const api = useWorkoutsApi();
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: keys.exerciseLists() });

  const create = useMutation({
    mutationFn: (payload: ExercisePayload) => api.createExercise(payload),
    onSuccess: (created) => {
      queryClient.setQueryData<Exercise[]>(keys.exercises(), (previous) =>
        previous
          ? [...previous.filter((e) => e._id !== created._id), created].sort((a, b) =>
              a.name.localeCompare(b.name),
            )
          : previous,
      );
      void refresh();
    },
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ExercisePayload }) =>
      api.updateExercise(id, payload),
    onSuccess: (updated) => {
      void refresh();
      void queryClient.invalidateQueries({ queryKey: keys.progress(updated._id) });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.deleteExercise(id),
    onSuccess: ({ archived }) => {
      toast.success(archived ? "Exercise archived (it has history)" : "Exercise deleted");
      void refresh();
    },
  });

  return {
    createExercise: create.mutateAsync,
    updateExercise: update.mutateAsync,
    deleteExercise: remove.mutateAsync,
    saving: create.isPending || update.isPending,
  };
};

export const useExerciseProgress = (id: string | undefined) => {
  const api = useWorkoutsApi();
  const query = useQuery({
    queryKey: keys.progress(id ?? ""),
    queryFn: () => api.fetchProgress(id as string),
    enabled: Boolean(id),
  });
  return { progress: query.data, loading: query.isPending, error: query.error };
};

/** Last time's sets for one exercise, for prefill and the "Last time" hint. */
export const useLastSets = (exerciseId: string | undefined) => {
  const api = useWorkoutsApi();
  const query = useQuery({
    queryKey: keys.lastSets(exerciseId ?? ""),
    queryFn: () => api.fetchLastSets(exerciseId as string),
    enabled: Boolean(exerciseId),
    staleTime: 5 * 60_000,
    meta: { silentErrors: true },
  });
  return query.data;
};

// ---- Routines -------------------------------------------------------------

export const useRoutines = () => {
  const api = useWorkoutsApi();
  const query = useQuery({ queryKey: keys.routines(), queryFn: api.fetchRoutines });
  return { routines: query.data ?? [], loading: query.isPending };
};

export const useRoutine = (id: string | undefined) => {
  const api = useWorkoutsApi();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: keys.routine(id ?? ""),
    queryFn: () => api.fetchRoutine(id as string),
    enabled: Boolean(id),
    // Opening a routine from the list shows it straight away.
    initialData: () =>
      queryClient.getQueryData<Routine[]>(keys.routines())?.find((r) => r._id === id),
  });
  return { routine: query.data, loading: Boolean(id) && query.isPending };
};

export const useRoutineActions = () => {
  const api = useWorkoutsApi();
  const queryClient = useQueryClient();

  const afterWrite = (routine?: Routine) => {
    if (routine) queryClient.setQueryData(keys.routine(routine._id), routine);
    void queryClient.invalidateQueries({ queryKey: keys.routines() });
    void queryClient.invalidateQueries({ queryKey: keys.summary() });
  };

  const create = useMutation({
    mutationFn: (payload: RoutinePayload) => api.createRoutine(payload),
    onSuccess: afterWrite,
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RoutinePayload }) =>
      api.updateRoutine(id, payload),
    onSuccess: afterWrite,
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.deleteRoutine(id),
    onSuccess: () => afterWrite(),
  });

  const reorder = useMutation({
    mutationFn: (ids: string[]) => api.reorderRoutines(ids),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: keys.routines() });
      const snapshot = queryClient.getQueryData<Routine[]>(keys.routines());
      if (snapshot) {
        const byId = new Map(snapshot.map((r) => [r._id, r]));
        queryClient.setQueryData(
          keys.routines(),
          ids.flatMap((id) => byId.get(id) ?? []),
        );
      }
      return { snapshot };
    },
    onError: (error, _ids, context) => {
      if (context?.snapshot) queryClient.setQueryData(keys.routines(), context.snapshot);
      toast.error(getErrorMessage(error));
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: keys.summary() }),
  });

  return {
    createRoutine: create.mutateAsync,
    updateRoutine: update.mutateAsync,
    deleteRoutine: remove.mutateAsync,
    reorderRoutines: reorder.mutate,
    saving: create.isPending || update.isPending,
  };
};

// ---- Sessions -------------------------------------------------------------

export const useActiveSession = () => {
  const api = useWorkoutsApi();
  const query = useQuery({ queryKey: keys.activeSession(), queryFn: api.fetchActiveSession });
  return { active: query.data ?? null, loading: query.isPending };
};

export const useSession = (id: string | undefined) => {
  const api = useWorkoutsApi();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: keys.session(id ?? ""),
    queryFn: () => api.fetchSession(id as string),
    enabled: Boolean(id),
    initialData: () => {
      const active = queryClient.getQueryData<WorkoutSession | null>(keys.activeSession());
      return active?._id === id ? active : undefined;
    },
    // The live screen owns its edits; a background refetch must not clobber them.
    staleTime: Infinity,
  });
  return { session: query.data, loading: query.isPending, error: query.error };
};

/**
 * Starts a workout and opens it. If one is already live, goes there instead:
 * there is only ever one session in progress.
 */
export const useStartSession = () => {
  const api = useWorkoutsApi();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const start = useMutation({
    mutationFn: (routineId?: string) => api.startSession(routineId),
    onSuccess: (session) => {
      queryClient.setQueryData(keys.activeSession(), session);
      queryClient.setQueryData(keys.session(session._id), session);
      void queryClient.invalidateQueries({ queryKey: keys.summary() });
      navigate(`/workouts/session/${session._id}`);
    },
    onError: async (error) => {
      if (toApiError(error).code !== "SESSION_IN_PROGRESS") {
        toast.error(getErrorMessage(error));
        return;
      }
      const active = await queryClient.fetchQuery({
        queryKey: keys.activeSession(),
        queryFn: api.fetchActiveSession,
        staleTime: 0,
      });
      toast.info("You already have a workout going — picking it back up.");
      if (active) navigate(`/workouts/session/${active._id}`);
    },
  });

  return { startSession: start.mutate, starting: start.isPending };
};

/** Completed workouts, newest first, paged by start time. */
export const useSessionHistory = () => {
  const api = useWorkoutsApi();
  const query = useInfiniteQuery({
    queryKey: keys.sessionHistory(),
    queryFn: ({ pageParam }) =>
      api.fetchSessions({ before: pageParam || undefined, limit: HISTORY_PAGE }),
    initialPageParam: "",
    getNextPageParam: (last) =>
      last.length < HISTORY_PAGE ? undefined : last[last.length - 1]?.startedAt,
  });
  return {
    sessions: query.data?.pages.flat() ?? [],
    loading: query.isPending,
    hasMore: query.hasNextPage,
    loadingMore: query.isFetchingNextPage,
    loadMore: () => void query.fetchNextPage(),
  };
};

export const useWorkoutHistory = (days: number) => {
  const api = useWorkoutsApi();
  const query = useQuery({
    queryKey: keys.history(days),
    queryFn: () => api.fetchHistory(days),
  });
  return { history: query.data, loading: query.isPending };
};

export const useWorkoutSummary = () => {
  const api = useWorkoutsApi();
  const query = useQuery({ queryKey: keys.summary(), queryFn: api.fetchSummary });
  return { summary: query.data, loading: query.isPending };
};

/** Delete a past workout, or discard the live one. */
export const useDeleteSession = () => {
  const api = useWorkoutsApi();
  const queryClient = useQueryClient();
  const remove = useMutation({
    mutationFn: (id: string) => api.deleteSession(id),
    onSuccess: (_void, id) => {
      queryClient.removeQueries({ queryKey: keys.session(id) });
      const active = queryClient.getQueryData<WorkoutSession | null>(keys.activeSession());
      if (active?._id === id) queryClient.setQueryData(keys.activeSession(), null);
      void queryClient.invalidateQueries({ queryKey: keys.all });
    },
  });
  return { deleteSession: remove.mutateAsync, deleting: remove.isPending };
};

/** Imperative "last time's sets" for an exercise just added to a session. */
export const useFetchLastSets = () => {
  const api = useWorkoutsApi();
  const queryClient = useQueryClient();
  return (exerciseId: string) =>
    queryClient.fetchQuery({
      queryKey: keys.lastSets(exerciseId),
      queryFn: () => api.fetchLastSets(exerciseId),
      staleTime: 5 * 60_000,
    });
};

/** Every exercise by id, archived ones included (old routines may use them). */
export const useExerciseMap = () => {
  const { exercises, loading } = useExercises();
  const { exercises: archived, loading: archivedLoading } = useExercises({ archived: true });
  const map = useMemo(
    () => new Map([...exercises, ...archived].map((e) => [e._id, e])),
    [exercises, archived],
  );
  return { map, loading: loading || archivedLoading };
};

/** Exercise names by id, for one-line routine summaries. */
export const useExerciseNames = () => {
  const { map } = useExerciseMap();
  return useMemo(() => new Map([...map].map(([id, e]) => [id, e.name])), [map]);
};
