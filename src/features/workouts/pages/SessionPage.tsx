import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  CloudOff,
  Dumbbell,
  Ellipsis,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import ConfirmDialog from "@components/feedback/ConfirmDialog";
import EmptyState from "@components/feedback/EmptyState";
import PageLoader from "@components/feedback/PageLoader";
import { formatClock } from "@lib/date/duration";
import { getErrorMessage } from "@lib/api/errors";
import { useNow } from "@lib/hooks/useNow";
import { cn } from "@lib/utils";
import EntryCard from "../components/EntryCard";
import ExercisePicker from "../components/ExercisePicker";
import FinishSummaryDialog from "../components/FinishSummaryDialog";
import RestTimerBar from "../components/RestTimerBar";
import { useLiveSession, type LiveSaveStatus } from "../hooks/useLiveSession";
import { useRestTimer } from "../hooks/useRestTimer";
import { useWakeLock } from "../hooks/useWakeLock";
import { useDeleteSession, useFetchLastSets, useSession } from "../hooks/useWorkouts";
import { formatSessionDate } from "../workout-format";
import {
  DEFAULT_REST_SEC,
  MAX_SESSION_ENTRIES,
  sessionStats,
  type Exercise,
  type FinishResult,
  type SessionEntry,
  type SessionSet,
  type WorkoutSession,
} from "../types/workout-types";

const DEFAULT_NEW_SETS = 3;

function SaveIndicator({ status }: { status: LiveSaveStatus }) {
  if (status === "offline") {
    return (
      <span className="flex items-center gap-1 text-warning">
        <CloudOff className="h-3.5 w-3.5" /> Offline – will sync
      </span>
    );
  }
  if (status === "pending" || status === "saving") {
    return (
      <span className="flex items-center gap-1">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving
      </span>
    );
  }
  return status === "saved" ? <span>Saved</span> : null;
}

function ElapsedClock({ startedAt }: { startedAt: string }) {
  const now = useNow(true);
  return <span className="tabular-nums">{formatClock(now - new Date(startedAt).getTime())}</span>;
}

/** The editor for one session, live or finished. Keyed by id by the page. */
function SessionEditor({ session }: { session: WorkoutSession }) {
  const navigate = useNavigate();
  const live = session.status === "in_progress";
  const editor = useLiveSession(session);
  const rest = useRestTimer();
  const fetchLastSets = useFetchLastSets();
  const { deleteSession, deleting } = useDeleteSession();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [result, setResult] = useState<FinishResult | null>(null);

  useWakeLock(live);

  const { entries } = editor;
  const unticked = entries.reduce((n, e) => n + e.sets.filter((s) => !s.done).length, 0);
  const { sets: doneSets } = sessionStats({ entries });

  const updateEntry = (index: number, entry: SessionEntry) =>
    editor.setEntries((current) => current.map((e, i) => (i === index ? entry : e)));

  const removeEntry = (index: number) =>
    editor.setEntries((current) => current.filter((_, i) => i !== index));

  const moveEntry = (index: number, direction: -1 | 1) =>
    editor.setEntries((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target] as SessionEntry, next[index] as SessionEntry];
      return next;
    });

  const addExercise = async (exercise: Exercise) => {
    let last: SessionSet[] = [];
    try {
      last = await fetchLastSets(exercise._id);
    } catch {
      // Offline: start with empty sets.
    }
    const sets: SessionSet[] = last.length
      ? last.map((s) => ({ ...s, done: false }))
      : Array.from({ length: DEFAULT_NEW_SETS }, () => ({ done: false }));
    editor.setEntries((current) => [
      ...current,
      {
        exerciseId: exercise._id,
        exerciseName: exercise.name,
        kind: exercise.kind,
        restSec: DEFAULT_REST_SEC,
        sets,
      },
    ]);
    // Bring the new card into view above the bottom bar.
    requestAnimationFrame(() =>
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }),
    );
  };

  const finish = async () => {
    setConfirmFinish(false);
    try {
      rest.skip();
      setResult(await editor.finish());
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const remove = async () => {
    setConfirmDelete(false);
    try {
      await deleteSession(session._id);
    } catch {
      return; // Toasted by the query client.
    }
    editor.discard();
    rest.skip();
    toast.success(live ? "Workout discarded" : "Workout deleted");
    navigate(live ? "/workouts" : "/workouts/history", { replace: true });
  };

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-4 flex items-start gap-2">
        <Link
          to={live ? "/workouts" : "/workouts/history"}
          aria-label="Back"
          className="-ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <div className="min-w-0 flex-1">
          <input
            value={editor.name}
            onChange={(event) => editor.setName(event.target.value)}
            onBlur={(event) => {
              if (!event.target.value.trim()) editor.setName(session.name || "Workout");
            }}
            aria-label="Workout name"
            maxLength={80}
            className="w-full truncate bg-transparent text-2xl font-bold tracking-tight text-foreground focus:outline-none"
          />
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {live ? (
              <ElapsedClock startedAt={session.startedAt} />
            ) : (
              <span>{formatSessionDate(session.startedAt)}</span>
            )}
            <span>
              {doneSets} set{doneSets === 1 ? "" : "s"} done
            </span>
            <SaveIndicator status={editor.saveStatus} />
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Workout options"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <Ellipsis className="h-5 w-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={() => setConfirmDelete(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              {live ? "Discard workout" : "Delete workout"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {entries.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          message="No exercises yet."
          action={{ label: "Add an exercise", onClick: () => setPickerOpen(true) }}
        />
      ) : (
        <div className="space-y-3">
          {entries.map((entry, index) => (
            <EntryCard
              key={`${entry.exerciseId}-${index}`}
              entry={entry}
              live={live}
              isFirst={index === 0}
              isLast={index === entries.length - 1}
              onChange={(next) => updateEntry(index, next)}
              onRemove={() => removeEntry(index)}
              onMove={(direction) => moveEntry(index, direction)}
              onSetDone={live ? rest.start : undefined}
            />
          ))}
        </div>
      )}

      <textarea
        value={editor.notes}
        onChange={(event) => editor.setNotes(event.target.value)}
        placeholder="Notes (how it felt, what to change next time)…"
        rows={2}
        maxLength={2000}
        className="mt-4 w-full resize-none rounded-xl border border-border bg-card p-3 text-base text-foreground placeholder:text-muted-foreground focus:border-rating focus:outline-none"
      />

      {/* Room for the fixed action bar. */}
      <div aria-hidden className={cn(live && rest.active ? "h-44" : "h-24")} />

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-navbar/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
        <div className="mx-auto max-w-2xl space-y-2">
          {live && rest.active && (
            <RestTimerBar
              remainingMs={rest.remainingMs}
              fraction={rest.fraction}
              finished={rest.finished}
              onAdjust={rest.adjust}
              onSkip={rest.skip}
            />
          )}
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="h-12 flex-1 text-base"
              disabled={entries.length >= MAX_SESSION_ENTRIES}
              onClick={() => setPickerOpen(true)}
            >
              <Plus className="h-5 w-5" /> Exercise
            </Button>
            {live && (
              <Button
                className="h-12 flex-1 text-base"
                disabled={editor.finishing || doneSets === 0}
                onClick={() => (unticked > 0 ? setConfirmFinish(true) : void finish())}
              >
                {editor.finishing && <Loader2 className="h-5 w-5 animate-spin" />}
                Finish
              </Button>
            )}
          </div>
        </div>
      </div>

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(exercise) => void addExercise(exercise)}
        usedIds={entries.map((e) => e.exerciseId)}
      />

      <ConfirmDialog
        open={confirmFinish}
        onClose={() => setConfirmFinish(false)}
        onConfirm={() => void finish()}
        title="Finish workout?"
        description={`${unticked} unticked set${unticked === 1 ? "" : "s"} will be left out.`}
        confirmLabel="Finish"
        destructive={false}
      />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => void remove()}
        title={live ? "Discard this workout?" : "Delete this workout?"}
        description={
          live
            ? "Everything logged in it will be lost."
            : "It will disappear from your history and progress charts."
        }
        confirmLabel={deleting ? "Deleting…" : live ? "Discard" : "Delete"}
      />

      <FinishSummaryDialog
        result={result}
        onClose={() => {
          setResult(null);
          navigate("/workouts/history", { replace: true });
        }}
      />
    </div>
  );
}

/** `/workouts/session/:id` — the live workout screen, also used to edit past ones. */
function SessionPage() {
  const { id } = useParams();
  const { session, loading } = useSession(id);
  const navigate = useNavigate();

  if (loading) return <PageLoader />;
  if (!session) {
    return (
      <EmptyState
        icon={Dumbbell}
        message="This workout doesn't exist any more."
        action={{ label: "Back to workouts", onClick: () => navigate("/workouts") }}
      />
    );
  }
  return <SessionEditor key={session._id} session={session} />;
}

export default SessionPage;
