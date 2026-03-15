import { useState } from "react";
import { useUser, SignInButton } from "@clerk/clerk-react";
import { useMediaLogs } from "../hooks/useMediaLogs";
import AddLogModal from "../components/AddLogModal";
import MediaLogCard from "../components/MediaLogCard";

function MediaDashboardPage() {
  const { logs, loading, createLog, deleteLog } = useMediaLogs();
  const { isLoaded, isSignedIn } = useUser();
  const [modalOpen, setModalOpen] = useState(false);

  if (!isLoaded) {
    return (
      <div className="min-h-[400px] bg-gray-950 text-gray-100 flex justify-center items-center rounded-2xl">
        Loading...
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center mt-20 text-center space-y-6">
        <div className="bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-800 max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-100 mb-3">
            Welcome Back
          </h2>
          <p className="text-gray-400 mb-8">
            Sign in to log movies, shows, books, music, and games.
          </p>
          <SignInButton mode="modal">
            <button className="w-full py-3 px-4 bg-cyan-500 hover:bg-cyan-400 text-gray-900 font-bold rounded-lg transition-all transform hover:scale-[1.02] shadow-lg shadow-cyan-500/20">
              Sign In to Continue
            </button>
          </SignInButton>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-cloud-400 tracking-tight">
          Media log
        </h2>
        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Add log
        </button>
      </div>

      {loading ? (
        <div className="text-cloud-400">Loading your logs…</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-20 bg-gray-900/50 rounded-2xl border border-gray-800 border-dashed">
          <p className="text-cloud-400 mb-4">No logs yet.</p>
          <button
            onClick={() => setModalOpen(true)}
            className="text-electric hover:underline"
          >
            Log your first movie, show, book, album, or game
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {logs.map((log) => (
            <MediaLogCard
              key={log._id}
              log={log}
              onDelete={deleteLog}
            />
          ))}
        </div>
      )}

      <AddLogModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={createLog}
      />
    </>
  );
}

export default MediaDashboardPage;
