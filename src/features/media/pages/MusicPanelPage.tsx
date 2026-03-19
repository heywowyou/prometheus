import { useState } from "react";
import { Music, Plus } from "lucide-react";
import { useMediaLogs } from "../hooks/useMediaLogs";
import AddLogModal from "../components/AddLogModal";
import EditLogModal from "../components/EditLogModal";
import MediaLogCard from "../components/MediaLogCard";
import DeleteMediaLogModal from "../components/DeleteMediaLogModal";
import type { MediaLog } from "../types/media-types";
import { Button } from "../../../components/ui/button";

function MusicPanelPage() {
  const { logs, loading, createLog, updateLog, deleteLog } = useMediaLogs("music_album");
  const [modalOpen, setModalOpen] = useState(false);
  const [editLog, setEditLog] = useState<MediaLog | null>(null);
  const [pendingDelete, setPendingDelete] = useState<MediaLog | null>(null);

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title">Music</h3>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Add album
        </Button>
      </div>

      {loading ? (
        <div className="text-muted-foreground text-sm">Loading your albums…</div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-xl text-center gap-4">
          <Music className="w-10 h-10 text-muted-foreground opacity-40" />
          <p className="text-muted-foreground text-sm">No albums logged yet.</p>
          <Button variant="outline" size="sm" onClick={() => setModalOpen(true)}>
            Log your first album
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {logs.map((log) => (
            <MediaLogCard
              key={log._id}
              log={log}
              onEdit={setEditLog}
              onDelete={(id) => setPendingDelete(logs.find((l) => l._id === id) ?? null)}
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
      <DeleteMediaLogModal
        isOpen={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        log={pendingDelete}
        onConfirm={(id) => { void deleteLog(id); setPendingDelete(null); }}
      />
    </>
  );
}

export default MusicPanelPage;
