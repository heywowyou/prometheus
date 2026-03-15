import { useState } from "react";
import { useMediaLogs } from "../hooks/useMediaLogs";
import AddLogModal from "../components/AddLogModal";
import EditLogModal from "../components/EditLogModal";
import MediaLogCard from "../components/MediaLogCard";
import type { MediaLog } from "../types/media-types";

function MusicPanelPage() {
  const { logs, loading, createLog, updateLog, deleteLog } = useMediaLogs("music_album");
  const [modalOpen, setModalOpen] = useState(false);
  const [editLog, setEditLog] = useState<MediaLog | null>(null);

  const albums = logs;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title">Music</h3>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="btn-primary"
        >
          <span className="text-sm font-semibold">Add album</span>
        </button>
      </div>

      {loading ? (
        <div className="text-text-muted">Loading your albums…</div>
      ) : albums.length === 0 ? (
        <div className="text-center py-12 bg-surface rounded-2xl border border-border border-dashed">
          <p className="text-text-muted mb-3">No albums logged yet.</p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="text-accent hover:underline"
          >
            Log your first album
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
          {albums.map((log) => (
            <MediaLogCard
              key={log._id}
              log={log}
              onEdit={setEditLog}
              onDelete={deleteLog}
            />
          ))}
        </div>
      )}

      <AddLogModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        presetType="music_album"
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
    </>
  );
}

export default MusicPanelPage;

