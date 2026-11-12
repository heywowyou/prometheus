import { Link } from "react-router-dom";
import { ArrowDown, ArrowUp, Check, Ellipsis, LineChart, Plus, Timer, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import { cn } from "@lib/utils";
import { useLastSets } from "../hooks/useWorkouts";
import { KIND_ICON } from "../kind-icons";
import { describeSet, restLabel, REST_OPTIONS } from "../workout-format";
import { MAX_SESSION_SETS, type SessionEntry, type SessionSet } from "../types/workout-types";
import NumberField from "./NumberField";

interface EntryCardProps {
  entry: SessionEntry;
  /** Live sessions show last time's sets and start the rest timer on a tick. */
  live: boolean;
  isFirst: boolean;
  isLast: boolean;
  onChange: (entry: SessionEntry) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
  /** A set was just ticked as done. */
  onSetDone?: (restSec: number) => void;
}

/** One exercise in a session: its sets as rows with big tap targets. */
function EntryCard({
  entry,
  live,
  isFirst,
  isLast,
  onChange,
  onRemove,
  onMove,
  onSetDone,
}: EntryCardProps) {
  const lastSets = useLastSets(live ? entry.exerciseId : undefined);
  const Icon = KIND_ICON[entry.kind];
  const strength = entry.kind === "strength";
  const doneCount = entry.sets.filter((s) => s.done).length;

  const setSets = (sets: SessionSet[]) => onChange({ ...entry, sets });
  const patchSet = (index: number, patch: Partial<SessionSet>) =>
    setSets(entry.sets.map((set, i) => (i === index ? { ...set, ...patch } : set)));

  const toggleDone = (index: number) => {
    const set = entry.sets[index];
    if (!set) return;
    patchSet(index, { done: !set.done });
    if (!set.done) onSetDone?.(entry.restSec);
  };

  const addSet = () => {
    const last = entry.sets[entry.sets.length - 1];
    const template: SessionSet = last
      ? { reps: last.reps, weightKg: last.weightKg, durationSec: last.durationSec, distanceM: last.distanceM, done: false }
      : { ...(lastSets?.[0] ?? {}), done: false };
    setSets([...entry.sets, template]);
  };

  return (
    <section className="rounded-2xl border border-border bg-card">
      <header className="flex items-start gap-2 p-3 pb-2">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-foreground">{entry.exerciseName}</h3>
          <p className="text-xs text-muted-foreground">
            {doneCount}/{entry.sets.length} sets
            {entry.restSec > 0 && ` · rest ${restLabel(entry.restSec)}`}
          </p>
          {live && lastSets && lastSets.length > 0 && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground/80">
              Last time: {lastSets.map((s) => describeSet(entry.kind, s)).join(", ")}
            </p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`${entry.exerciseName} options`}
            className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <Ellipsis className="h-5 w-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
              <Timer className="h-3.5 w-3.5" /> Rest timer
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={String(entry.restSec)}
              onValueChange={(value) => onChange({ ...entry, restSec: Number(value) })}
            >
              {REST_OPTIONS.map((sec) => (
                <DropdownMenuRadioItem key={sec} value={String(sec)}>
                  {restLabel(sec)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to={`/workouts/exercises/${entry.exerciseId}`}>
                <LineChart className="h-4 w-4" /> Progress
              </Link>
            </DropdownMenuItem>
            {!isFirst && (
              <DropdownMenuItem onSelect={() => onMove(-1)}>
                <ArrowUp className="h-4 w-4" /> Move up
              </DropdownMenuItem>
            )}
            {!isLast && (
              <DropdownMenuItem onSelect={() => onMove(1)}>
                <ArrowDown className="h-4 w-4" /> Move down
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onRemove} className="text-destructive focus:text-destructive">
              <Trash2 className="h-4 w-4" /> Remove exercise
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="px-3">
        <div className="grid grid-cols-[2.25rem_1fr_1fr_3rem] gap-2 pb-1 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          <span>Set</span>
          <span>{strength ? "kg" : "km"}</span>
          <span>{strength ? "Reps" : "min"}</span>
          <span className="sr-only">Done</span>
        </div>

        <ol className="space-y-1.5">
          {entry.sets.map((set, index) => {
            const hint = lastSets?.[index];
            return (
              <li
                key={index}
                className={cn(
                  "grid grid-cols-[2.25rem_1fr_1fr_3rem] items-center gap-2 rounded-lg transition-colors",
                  set.done && "bg-success/10",
                )}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger
                    aria-label={`Set ${index + 1} options`}
                    className="flex h-11 items-center justify-center rounded-lg text-sm font-semibold tabular-nums text-muted-foreground hover:bg-secondary"
                  >
                    {index + 1}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem
                      onSelect={() => setSets(entry.sets.filter((_, i) => i !== index))}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" /> Remove set
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {strength ? (
                  <>
                    <NumberField
                      label={`Set ${index + 1} weight in kg`}
                      value={set.weightKg}
                      placeholder={hint?.weightKg !== undefined ? String(hint.weightKg) : "–"}
                      onChange={(weightKg) => patchSet(index, { weightKg })}
                    />
                    <NumberField
                      integer
                      label={`Set ${index + 1} reps`}
                      value={set.reps}
                      placeholder={hint?.reps !== undefined ? String(hint.reps) : "–"}
                      onChange={(reps) => patchSet(index, { reps })}
                    />
                  </>
                ) : (
                  <>
                    <NumberField
                      label={`Set ${index + 1} distance in km`}
                      value={set.distanceM !== undefined ? set.distanceM / 1000 : undefined}
                      placeholder={hint?.distanceM ? String(hint.distanceM / 1000) : "–"}
                      onChange={(km) =>
                        patchSet(index, { distanceM: km === undefined ? undefined : Math.round(km * 1000) })
                      }
                    />
                    <NumberField
                      label={`Set ${index + 1} duration in minutes`}
                      value={set.durationSec !== undefined ? set.durationSec / 60 : undefined}
                      placeholder={hint?.durationSec ? String(Math.round(hint.durationSec / 60)) : "–"}
                      onChange={(min) =>
                        patchSet(index, { durationSec: min === undefined ? undefined : Math.round(min * 60) })
                      }
                    />
                  </>
                )}

                <button
                  type="button"
                  aria-label={set.done ? `Untick set ${index + 1}` : `Tick set ${index + 1}`}
                  aria-pressed={set.done}
                  onClick={() => toggleDone(index)}
                  className={cn(
                    "flex h-11 items-center justify-center rounded-lg transition-colors",
                    set.done
                      ? "bg-success text-background"
                      : "bg-secondary text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Check className="h-5 w-5" strokeWidth={3} />
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="p-3 pt-2">
        <button
          type="button"
          onClick={addSet}
          disabled={entry.sets.length >= MAX_SESSION_SETS}
          className="flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-secondary text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Add set
        </button>
      </div>
    </section>
  );
}

export default EntryCard;
