import { useState } from "react";
import { Gamepad2, Plus, Heart } from "lucide-react";
import { useMediaLogs } from "../hooks/useMediaLogs";
import AddLogModal from "../components/AddLogModal";
import EditLogModal from "../components/EditLogModal";
import MediaLogCard from "../components/MediaLogCard";
import DeleteMediaLogModal from "../components/DeleteMediaLogModal";
import type { MediaLog } from "../types/media-types";
import { Button } from "../../../components/ui/button";

function GamesPanelPage() {
  const { logs, loading, createLog, updateLog, deleteLog, toggleFavorite } = useMediaLogs("game");
  const [modalOpen, setModalOpen] = useState(false);
  const [editLog, setEditLog] = useState<MediaLog | null>(null);
  const [pendingDelete, setPendingDelete] = useState<MediaLog | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const visibleLogs = favoritesOnly ? logs.filter((l) => l.favorite) : logs;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title">Games</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFavoritesOnly((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
              favoritesOnly
                ? "border-[--rating] text-[--rating] bg-[--rating]/10"
                : "border-border text-muted-foreground hover:text-foreground hover:border-muted"
            }`}
            aria-pressed={favoritesOnly}
          >
            <Heart
              className="h-3 w-3"
              style={favoritesOnly ? { fill: "var(--rating)", color: "var(--rating)" } : undefined}
            />
            Favorites
          </button>
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Add game
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-muted-foreground text-sm">Loading your games…</div>
      ) : visibleLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-xl text-center gap-4">
          <Gamepad2 className="w-10 h-10 text-muted-foreground opacity-40" />
          <p className="text-muted-foreground text-sm">
            {favoritesOnly ? "No favorited games yet." : "No games logged yet."}
          </p>
          {!favoritesOnly && (
            <Button variant="outline" size="sm" onClick={() => setModalOpen(true)}>
              Log your first game
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {visibleLogs.map((log) => (
            <MediaLogCard
              key={log._id}
              log={log}
              onEdit={setEditLog}
              onDelete={(id) => setPendingDelete(logs.find((l) => l._id === id) ?? null)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}

      <AddLogModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        presetType="game"
        onCreate={createLog}
      />
      <EditLogModal
        isOpen={editLog !== null}
        onClose={() => setEditLog(null)}
        log={editLog}
        onUpdate={async (id, payload) => {
          await updateLog(id, payload);
          setEditLog(null);
        }}
      />
      <DeleteMediaLogModal
        isOpen={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        log={pendingDelete}
        onConfirm={(id) => { void deleteLog(id); setPendingDelete(null); }}
      />
    </>
  );
}

export default GamesPanelPage;
