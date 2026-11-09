import { useState } from "react";
import { Plus, Heart } from "lucide-react";
import { Button } from "@components/ui/button";
import EmptyState from "@components/feedback/EmptyState";
import ConfirmDialog from "@components/feedback/ConfirmDialog";
import { cn } from "@lib/utils";
import { useMediaLogs } from "../hooks/useMediaLogs";
import MediaLogCard from "../components/MediaLogCard";
import MediaLogModal from "../components/MediaLogModal";
import type { MediaLog } from "../types/media-types";
import type { MediaTypeConfig } from "../media-config";

interface MediaPanelPageProps {
  config: MediaTypeConfig;
}

/**
 * One panel of the media log (movies, books, …).
 *
 * All five panels render through this component; `config` supplies the icon,
 * copy and cover aspect that used to be hardcoded in five identical files.
 */
function MediaPanelPage({ config }: MediaPanelPageProps) {
  const { logs, loading, createLog, updateLog, deleteLog, toggleFavorite } =
    useMediaLogs(config.type);

  const [addOpen, setAddOpen] = useState(false);
  const [editLog, setEditLog] = useState<MediaLog | null>(null);
  const [pendingDelete, setPendingDelete] = useState<MediaLog | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const visibleLogs = favoritesOnly ? logs.filter((log) => log.favorite) : logs;

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="section-title">{config.plural}</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFavoritesOnly((on) => !on)}
            aria-pressed={favoritesOnly}
            className={cn(
              "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors",
              favoritesOnly
                ? "border-rating bg-rating/10 text-rating"
                : "border-border text-muted-foreground hover:border-muted hover:text-foreground",
            )}
          >
            <Heart
              className={cn("h-3 w-3", favoritesOnly && "fill-rating text-rating")}
            />
            Favorites
          </button>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Add {config.singular}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, index) => (
            <div
              key={index}
              className="flex flex-col overflow-hidden rounded-xl border border-border bg-card"
            >
              <div
                className={cn(config.coverAspect, "w-full animate-pulse bg-secondary")}
              />
              <div className="flex flex-col gap-2 p-3">
                <div className="h-3 w-3/4 animate-pulse rounded bg-secondary" />
                <div className="h-2.5 w-1/3 animate-pulse rounded bg-secondary" />
              </div>
            </div>
          ))}
        </div>
      ) : visibleLogs.length === 0 ? (
        <EmptyState
          icon={config.icon}
          message={
            favoritesOnly
              ? `No favorited ${config.plural.toLowerCase()} yet.`
              : `No ${config.plural.toLowerCase()} logged yet.`
          }
          action={
            favoritesOnly
              ? undefined
              : {
                  label: `Log your first ${config.singular}`,
                  onClick: () => setAddOpen(true),
                }
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {visibleLogs.map((log) => (
            <MediaLogCard
              key={log._id}
              log={log}
              coverAspect={config.coverAspect}
              onEdit={setEditLog}
              onDelete={setPendingDelete}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}

      <MediaLogModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        presetType={config.type}
        onCreate={createLog}
      />
      <MediaLogModal
        isOpen={editLog !== null}
        onClose={() => setEditLog(null)}
        log={editLog}
        onUpdate={updateLog}
      />
      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) deleteLog(pendingDelete._id);
          setPendingDelete(null);
        }}
        title={`Delete “${pendingDelete?.title ?? ""}”?`}
      />
    </>
  );
}

export default MediaPanelPage;
