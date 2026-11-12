import { useNavigate } from "react-router-dom";
import { ClipboardList, Plus, Zap } from "lucide-react";
import { Button } from "@components/ui/button";
import EmptyState from "@components/feedback/EmptyState";
import RoutineList from "../components/RoutineList";
import {
  useExerciseNames,
  useRoutineActions,
  useRoutines,
  useStartSession,
} from "../hooks/useWorkouts";

/** `/workouts` index: start an empty workout or a saved routine. */
function StartPage() {
  const navigate = useNavigate();
  const { routines, loading } = useRoutines();
  const { reorderRoutines } = useRoutineActions();
  const { startSession, starting } = useStartSession();
  const names = useExerciseNames();

  return (
    <div className="space-y-6">
      <Button
        variant="secondary"
        className="h-14 w-full justify-start gap-3 rounded-2xl border border-border px-4 text-base"
        disabled={starting}
        onClick={() => startSession(undefined)}
      >
        <Zap className="h-5 w-5 text-rating" />
        Start an empty workout
      </Button>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="section-title">Routines</h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-9"
            onClick={() => navigate("/workouts/routines/new")}
          >
            <Plus className="h-4 w-4" /> New
          </Button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-card" />
            ))}
          </div>
        ) : routines.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            message="Save a routine (e.g. “Push day”) to start it in one tap."
            action={{ label: "Create a routine", onClick: () => navigate("/workouts/routines/new") }}
          />
        ) : (
          <RoutineList
            routines={routines}
            names={names}
            starting={starting}
            onStart={(routine) => startSession(routine._id)}
            onReorder={reorderRoutines}
          />
        )}
      </section>
    </div>
  );
}

export default StartPage;
