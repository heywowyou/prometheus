import { useState } from "react";
import { useMediaLogs } from "../hooks/useMediaLogs";
import AddLogModal from "../components/AddLogModal";
import EditLogModal from "../components/EditLogModal";
import MediaLogCard from "../components/MediaLogCard";
import type { MediaLog } from "../types/media-types";

function MoviesPanelPage() {
  const { logs, loading, createLog, updateLog, deleteLog } = useMediaLogs("movie");
  const [modalOpen, setModalOpen] = useState(false);
  const [editLog, setEditLog] = useState<MediaLog | null>(null);

  const movies = logs;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-cloud-300">Movies</h3>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="btn-primary"
        >
          <span className="text-sm font-semibold">Add movie</span>
        </button>
      </div>

      {loading ? (
        <div className="text-cloud-400">Loading your movies…</div>
      ) : movies.length === 0 ? (
        <div className="text-center py-12 bg-gray-900/50 rounded-2xl border border-gray-800 border-dashed">
          <p className="text-cloud-400 mb-3">No movies logged yet.</p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="text-electric hover:underline"
          >
            Log your first movie
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {movies.map((log) => (
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
        presetType="movie"
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

export default MoviesPanelPage;

