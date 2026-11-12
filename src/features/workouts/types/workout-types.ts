/**
 * Mirrors of the API's workout shapes (`prometheus-backend/modules/workouts`).
 * Units: kg, seconds, metres.
 */

export const EXERCISE_KINDS = ["strength", "cardio"] as const;
export type ExerciseKind = (typeof EXERCISE_KINDS)[number];

export const MUSCLE_GROUPS = [
  "chest",
  "back",
  "shoulders",
  "arms",
  "legs",
  "core",
  "full_body",
  "other",
] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: "Chest",
  back: "Back",
  shoulders: "Shoulders",
  arms: "Arms",
  legs: "Legs",
  core: "Core",
  full_body: "Full body",
  other: "Other",
};

export const DEFAULT_REST_SEC = 90;
export const MAX_SETS = 20;
export const MAX_SESSION_SETS = 50;
export const MAX_SESSION_ENTRIES = 30;

export interface Exercise {
  _id: string;
  userId: string;
  name: string;
  kind: ExerciseKind;
  muscleGroup?: MuscleGroup;
  notes?: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoutineExercise {
  exerciseId: string;
  sets: number;
  targetReps?: number;
  targetWeightKg?: number;
  targetDurationSec?: number;
  targetDistanceM?: number;
  restSec: number;
}

export interface Routine {
  _id: string;
  userId: string;
  name: string;
  notes?: string;
  order: number;
  exercises: RoutineExercise[];
  createdAt: string;
  updatedAt: string;
}

export interface SessionSet {
  reps?: number;
  weightKg?: number;
  durationSec?: number;
  distanceM?: number;
  done: boolean;
}

export interface SessionEntry {
  exerciseId: string;
  exerciseName: string;
  kind: ExerciseKind;
  restSec: number;
  sets: SessionSet[];
}

export const SESSION_STATUSES = ["in_progress", "completed"] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

export interface WorkoutSession {
  _id: string;
  userId: string;
  routineId?: string;
  name: string;
  status: SessionStatus;
  startedAt: string;
  finishedAt?: string;
  notes?: string;
  entries: SessionEntry[];
  createdAt: string;
  updatedAt: string;
}

export const PR_TYPES = ["weight", "e1rm", "volume", "reps", "distance", "duration", "pace"] as const;
export type PrType = (typeof PR_TYPES)[number];
export type PersonalRecords = Partial<Record<PrType, number>>;

export const PR_LABELS: Record<PrType, string> = {
  weight: "Heaviest weight",
  e1rm: "Best est. 1RM",
  volume: "Most volume",
  reps: "Most reps",
  distance: "Longest distance",
  duration: "Longest duration",
  pace: "Fastest pace",
};

export interface SessionPr {
  exerciseId: string;
  exerciseName: string;
  types: PrType[];
}

export interface FinishResult {
  session: WorkoutSession;
  prs: SessionPr[];
}

export interface StrengthMetrics {
  kind: "strength";
  bestWeightKg: number;
  e1rmKg: number;
  bestSet: { reps: number; weightKg: number } | null;
  volumeKg: number;
  maxReps: number;
}

export interface CardioMetrics {
  kind: "cardio";
  distanceM: number;
  durationSec: number;
  paceSecPerKm: number | null;
}

export type ExerciseMetrics = StrengthMetrics | CardioMetrics;

export interface ExerciseProgress {
  exercise: { _id: string; name: string; kind: ExerciseKind; muscleGroup?: MuscleGroup };
  /** Oldest first, one point per completed session. */
  points: Array<{ sessionId: string; date: string; metrics: ExerciseMetrics }>;
  records: PersonalRecords;
}

export interface WorkoutHistory {
  /** Consecutive weeks with at least one workout. */
  streak: { current: number; best: number };
  total: number;
  days: Array<{ date: string; count: number }>;
}

export interface WorkoutSummary {
  active: { _id: string; name: string; startedAt: string } | null;
  thisWeek: number;
  streak: { current: number; best: number };
  lastSession: {
    _id: string;
    name: string;
    startedAt: string;
    finishedAt?: string;
    exerciseCount: number;
    setCount: number;
  } | null;
  routines: Array<{ _id: string; name: string; exerciseCount: number }>;
}

/** Done sets only; strength volume in kg. */
export const sessionStats = (session: Pick<WorkoutSession, "entries">) => {
  let sets = 0;
  let volumeKg = 0;
  for (const entry of session.entries) {
    for (const set of entry.sets) {
      if (!set.done) continue;
      sets += 1;
      if (entry.kind === "strength") volumeKg += (set.weightKg ?? 0) * (set.reps ?? 0);
    }
  }
  return { sets, volumeKg: Math.round(volumeKg) };
};
