import { useState, KeyboardEvent } from "react";
import { MEDIA_TYPE_LABELS, type MediaLogType } from "../types/media-types";

interface AddLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  presetType?: MediaLogType;
  onCreate: (payload: {
    type: MediaLogType;
    title: string;
    url?: string;
    cover?: string;
    rating: number;
    review?: string;
    date: string;
    status?: "finished" | "in_progress";
    director?: string;
    author?: string;
    pages?: number;
    artist?: string;
  }) => Promise<unknown>;
}

const MEDIA_TYPES: MediaLogType[] = [
  "movie",
  "tvshow",
  "book",
  "music_album",
  "game",
];

function AddLogModal({ isOpen, onClose, presetType, onCreate }: AddLogModalProps) {
  const [type, setType] = useState<MediaLogType>(presetType ?? "movie");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [cover, setCover] = useState("");
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [date, setDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [status, setStatus] = useState<"finished" | "in_progress">("finished");
  const [director, setDirector] = useState("");
  const [author, setAuthor] = useState("");
  const [pages, setPages] = useState<string>("");
  const [artist, setArtist] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleCreateAndClose = async () => {
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      await onCreate({
        type,
        title: title.trim(),
        url: url.trim() || undefined,
        cover: cover.trim() || undefined,
        rating,
        review: review.trim() || undefined,
        date,
        status,
        director: type === "movie" ? director.trim() || undefined : undefined,
        author: type === "book" ? author.trim() || undefined : undefined,
        pages:
          type === "book" && pages.trim()
            ? Number(pages)
            : undefined,
        artist:
          type === "music_album" ? artist.trim() || undefined : undefined,
      });
      setTitle("");
      setUrl("");
      setCover("");
      setRating(5);
      setReview("");
      setDate(new Date().toISOString().slice(0, 10));
      setStatus("finished");
      setDirector("");
      setAuthor("");
      setPages("");
      setArtist("");
      setType(presetType ?? "movie");
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") void handleCreateAndClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-lg z-50 flex items-center justify-center">
      <div className="bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
        <h2 className="text-2xl font-bold text-cyan-400 mb-4">
          Log something
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Type
            </label>
            {presetType ? (
              <div className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-gray-300">
                {MEDIA_TYPE_LABELS[presetType]}
              </div>
            ) : (
              <select
                value={type}
                onChange={(e) => setType(e.target.value as MediaLogType)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-gray-400 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {MEDIA_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {MEDIA_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Date
            </label>
            <input
              type="date"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-500 transition-colors text-gray-100"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "finished" | "in_progress")
              }
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-gray-400 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="finished">Finished</option>
              <option value="in_progress">In progress</option>
            </select>
          </div>

          {type === "movie" && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Director
              </label>
              <input
                type="text"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-500 transition-colors text-gray-100"
                value={director}
                onChange={(e) => setDirector(e.target.value)}
              />
            </div>
          )}

          {type === "book" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Author
                </label>
                <input
                  type="text"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-500 transition-colors text-gray-100"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Pages
                </label>
                <input
                  type="number"
                  min={1}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-500 transition-colors text-gray-100"
                  value={pages}
                  onChange={(e) => setPages(e.target.value)}
                />
              </div>
            </div>
          )}

          {type === "music_album" && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Artist
              </label>
              <input
                type="text"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-500 transition-colors text-gray-100"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Review
            </label>
            <textarea
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-500 transition-colors text-gray-100 min-h-[80px]"
              placeholder="What did you think?"
              value={review}
              onChange={(e) => setReview(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Title *
            </label>
            <input
              type="text"
              placeholder="Title"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-500 transition-colors text-gray-100"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              URL
            </label>
            <input
              type="url"
              placeholder="https://..."
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-500 transition-colors text-gray-100"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Cover image URL
            </label>
            <input
              type="url"
              placeholder="https://..."
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-500 transition-colors text-gray-100"
              value={cover}
              onChange={(e) => setCover(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Rating (1–10)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={1}
                max={10}
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <span className="text-cyan-400 font-semibold w-8 tabular-nums">
                {rating}/10
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleCreateAndClose()}
            disabled={!title.trim() || submitting}
            className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Adding…" : "Add log"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddLogModal;
