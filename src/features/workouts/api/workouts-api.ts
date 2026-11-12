import { useMemo } from "react";
import { useApiClient } from "@lib/api/api-client";
import type {
  Exercise,
  ExerciseKind,
  ExerciseProgress,
  FinishResult,
  MuscleGroup,
  Routine,
  RoutineExercise,
  SessionEntry,
  SessionSet,
  WorkoutHistory,
  WorkoutSession,
  WorkoutSummary,
} from "../types/workout-types";

const BASE = "/workouts";

export interface ExercisePayload {
  name?: string;
  kind?: ExerciseKind;
  /** `null` clears it. */
  muscleGroup?: MuscleGroup | null;
  notes?: string;
  archived?: boolean;
}

export interface RoutinePayload {
  name?: string;
  notes?: string;
  exercises?: RoutineExercise[];
}

export interface SessionPayload {
  name?: string;
  notes?: string;
  startedAt?: string;
  finishedAt?: string;
  /** Snapshots (name, kind) are kept server-side; extra fields are ignored. */
  entries?: Array<Pick<SessionEntry, "exerciseId" | "restSec" | "sets">>;
}

/** Every workouts endpoint. Stable as long as the API client is. */
export const useWorkoutsApi = () => {
  const client = useApiClient();

  return useMemo(
    () => ({
      // Exercises
      fetchExercises: async (opts: { archived?: boolean } = {}) =>
        (
          await client.get<Exercise[]>(`${BASE}/exercises`, {
            params: opts.archived ? { archived: "true" } : undefined,
          })
        ).data,
      createExercise: async (payload: ExercisePayload) =>
        (await client.post<Exercise>(`${BASE}/exercises`, payload)).data,
      updateExercise: async (id: string, payload: ExercisePayload) =>
        (await client.patch<Exercise>(`${BASE}/exercises/${id}`, payload)).data,
      deleteExercise: async (id: string) =>
        (await client.delete<{ id: string; archived: boolean }>(`${BASE}/exercises/${id}`)).data,
      fetchProgress: async (id: string) =>
        (await client.get<ExerciseProgress>(`${BASE}/exercises/${id}/progress`)).data,
      fetchLastSets: async (id: string) =>
        (
          await client.get<{ exerciseId: string; sets: SessionSet[] }>(
            `${BASE}/exercises/${id}/last`,
          )
        ).data.sets,

      // Routines
      fetchRoutines: async () => (await client.get<Routine[]>(`${BASE}/routines`)).data,
      fetchRoutine: async (id: string) =>
        (await client.get<Routine>(`${BASE}/routines/${id}`)).data,
      createRoutine: async (payload: RoutinePayload) =>
        (await client.post<Routine>(`${BASE}/routines`, payload)).data,
      updateRoutine: async (id: string, payload: RoutinePayload) =>
        (await client.patch<Routine>(`${BASE}/routines/${id}`, payload)).data,
      reorderRoutines: async (ids: string[]) => {
        await client.patch(`${BASE}/routines/reorder`, { ids });
      },
      deleteRoutine: async (id: string) => {
        await client.delete(`${BASE}/routines/${id}`);
      },

      // Sessions
      fetchActiveSession: async () =>
        (await client.get<WorkoutSession | null>(`${BASE}/sessions/active`)).data,
      fetchSessions: async (opts: { before?: string; limit?: number } = {}) =>
        (await client.get<WorkoutSession[]>(`${BASE}/sessions`, { params: opts })).data,
      fetchSession: async (id: string) =>
        (await client.get<WorkoutSession>(`${BASE}/sessions/${id}`)).data,
      startSession: async (routineId?: string) =>
        (await client.post<WorkoutSession>(`${BASE}/sessions`, { routineId })).data,
      updateSession: async (id: string, payload: SessionPayload) =>
        (await client.patch<WorkoutSession>(`${BASE}/sessions/${id}`, payload)).data,
      finishSession: async (id: string) =>
        (await client.patch<FinishResult>(`${BASE}/sessions/${id}/finish`)).data,
      deleteSession: async (id: string) => {
        await client.delete(`${BASE}/sessions/${id}`);
      },

      // Stats
      fetchHistory: async (days: number) =>
        (await client.get<WorkoutHistory>(`${BASE}/history`, { params: { days } })).data,
      fetchSummary: async () => (await client.get<WorkoutSummary>(`${BASE}/summary`)).data,
    }),
    [client],
  );
};
