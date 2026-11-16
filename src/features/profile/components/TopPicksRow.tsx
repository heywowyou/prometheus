import { useState } from "react";
import { Plus } from "lucide-react";
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@lib/utils";
import type { MediaTypeConfig } from "@features/media/media-config";
import { resolveCoverUrl, type MediaLog } from "@features/media/types/media-types";
import { TOP_PICKS_LIMIT } from "../api/profile-api";
import TopPickSearchDialog from "./TopPickSearchDialog";

interface TopPicksRowProps {
  config: MediaTypeConfig;
  picks: MediaLog[];
  /** Called with the full ordered row after any change. */
  onChange: (picks: MediaLog[]) => void;
}

function PickTile({
  log,
  config,
  onOpen,
}: {
  log: MediaLog;
  config: MediaTypeConfig;
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: log._id,
  });
  const cover = resolveCoverUrl(log.cover);

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("relative min-w-0", isDragging && "z-20")}
    >
      <button
        type="button"
        onClick={onOpen}
        {...attributes}
        {...listeners}
        aria-label={`${log.title}. Click to swap or remove, drag to reorder.`}
        className="group block w-full cursor-grab text-left focus-visible:outline-none active:cursor-grabbing"
      >
        <span
          className={cn(
            config.coverAspect,
            "relative flex w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-secondary transition-all group-hover:border-muted-foreground/60 group-focus-visible:ring-2 group-focus-visible:ring-ring sm:rounded-2xl",
            isDragging && "scale-[1.04] shadow-2xl shadow-overlay/60",
          )}
        >
          {cover ? (
            <img src={cover} alt="" draggable={false} className="h-full w-full object-cover" />
          ) : (
            <span className="line-clamp-4 px-1.5 text-center font-serif text-xs text-muted-foreground sm:text-sm">
              {log.title}
            </span>
          )}
        </span>
        <span className="mt-2 hidden truncate font-serif text-[15px] leading-tight text-foreground sm:block">
          {log.title}
        </span>
      </button>
    </li>
  );
}

function EmptySlot({ config, onOpen }: { config: MediaTypeConfig; onOpen: () => void }) {
  return (
    <li className="min-w-0">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Add a ${config.singular} to your top 5`}
        className={cn(
          config.coverAspect,
          "flex w-full items-center justify-center rounded-xl border border-dashed border-border text-muted-foreground transition-colors hover:border-muted-foreground/60 hover:bg-secondary/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:rounded-2xl",
        )}
      >
        <Plus className="h-5 w-5" />
      </button>
    </li>
  );
}

/**
 * Five slots for one category. Filled ones open the search to swap or remove
 * and can be dragged to reorder (press and hold on touch); empty ones add.
 */
function TopPicksRow({ config, picks, onChange }: TopPicksRowProps) {
  // The slot being edited: an index into `picks`, or `picks.length` to add.
  const [slot, setSlot] = useState<number | null>(null);
  const sensors = useSensors(
    // A small distance keeps a plain click a click.
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // Press and hold, so the row doesn't steal page scrolls.
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const current = slot !== null ? (picks[slot] ?? null) : null;
  const pickedIds = new Set(picks.map((log) => log._id));
  const emptyCount = Math.max(0, TOP_PICKS_LIMIT - picks.length);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = picks.findIndex((log) => log._id === active.id);
    const to = picks.findIndex((log) => log._id === over.id);
    if (from < 0 || to < 0) return;
    onChange(arrayMove(picks, from, to));
  };

  const select = (log: MediaLog) => {
    if (slot === null) return;
    const next = [...picks];
    if (slot < next.length) next[slot] = log;
    else next.push(log);
    onChange(next.slice(0, TOP_PICKS_LIMIT));
  };

  const remove = () => {
    if (slot === null || slot >= picks.length) return;
    onChange(picks.filter((_, index) => index !== slot));
  };

  return (
    <section>
      <div className="mb-4 flex items-center gap-2.5">
        <config.icon className="h-4 w-4 text-muted-foreground" />
        <h2 className="section-title sm:text-[2rem]">{config.plural}</h2>
      </div>

      {picks.length === 0 ? (
        // An empty category is one quiet line, not five empty frames.
        <button
          type="button"
          onClick={() => setSlot(0)}
          className="flex w-full items-center gap-2 rounded-2xl border border-dashed border-border px-4 py-3.5 text-left text-sm text-muted-foreground transition-colors hover:border-muted-foreground/60 hover:text-foreground"
        >
          <Plus className="h-4 w-4" /> Pick your top {TOP_PICKS_LIMIT} {config.plural.toLowerCase()}
        </button>
      ) : (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={picks.map((log) => log._id)} strategy={rectSortingStrategy}>
          <ul className="grid grid-cols-5 items-start gap-2 sm:gap-4">
            {picks.map((log, index) => (
              <PickTile key={log._id} log={log} config={config} onOpen={() => setSlot(index)} />
            ))}
            {Array.from({ length: emptyCount }, (_, index) => (
              <EmptySlot key={`empty-${index}`} config={config} onOpen={() => setSlot(picks.length)} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      )}

      <TopPickSearchDialog
        open={slot !== null}
        onOpenChange={(open) => !open && setSlot(null)}
        config={config}
        current={current}
        pickedIds={pickedIds}
        onSelect={select}
        onRemove={remove}
      />
    </section>
  );
}

export default TopPicksRow;
