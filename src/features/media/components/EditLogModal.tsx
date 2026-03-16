import { useState, useEffect, KeyboardEvent } from "react";
import { MEDIA_TYPE_LABELS, type MediaLog, type MediaLogType } from "../types/media-types";
import type { UpdateMediaLogPayload } from "../api/media-api";

interface EditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: MediaLog | null;
  onUpdate: (id: string, payload: UpdateMediaLogPayload) => Promise<unknown>;
}

function EditLogModal({ isOpen, onClose, log, onUpdate }: EditLogModalProps) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [cover, setCover] = useState("");
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState<"finished" | "in_progress">("finished");
  const [director, setDirector] = useState("");
  const [author, setAuthor] = useState("");
  const [pages, setPages] = useState<string>("");
  const [artist, setArtist] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (log) {
      setTitle(log.title);
      setUrl(log.url ?? "");
      setCover(log.cover ?? "");
      setRating(log.rating);
      setReview(log.review ?? "");
      setDate(log.date ? log.date.slice(0, 10) : new Date().toISOString().slice(0, 10));
      setStatus(log.status ?? "finished");
      setDirector(log.director ?? "");
      setAuthor(log.author ?? "");
      setPages(log.pages != null ? String(log.pages) : "");
      setArtist(log.artist ?? "");
    }
  }, [log]);

  if (!isOpen || !log) {
    return null;
  }

  const type: MediaLogType = log.type;

  const handleSaveAndClose = async () => {
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      await onUpdate(log._id, {
        title: title.trim(),
        url: url.trim() || undefined,
        cover: cover.trim() || undefined,
        rating,
        review: review.trim() || undefined,
        date: date || undefined,
        status,
        director: type === "movie" ? director.trim() || undefined : undefined,
        author: type === "book" ? author.trim() || undefined : undefined,
        pages: type === "book" && pages.trim() ? Number(pages) : undefined,
        artist: type === "music_album" ? artist.trim() || undefined : undefined,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") void handleSaveAndClose();
  };

  const inputClass =
    "w-full bg-background border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-accent transition-colors text-text";
  const labelClass = "block text-sm font-medium text-text-muted mb-1";

  return (
    <div className="fixed inset-0 bg-background/60 backdrop-blur-lg z-50 flex items-center justify-center">
      <div className="bg-surface p-6 rounded-xl shadow-2xl w-full max-w-md border border-border max-h-[90vh] overflow-y-auto">
        <h2 className="font-sans text-2xl font-bold text-text mb-4">
          Edit log
        </h2>

        <div className="space-y-4">
          <div>
            <label className={labelClass}>Type</label>
            <div className="w-full bg-background border border-border rounded-lg px-4 py-3 text-text">
              {MEDIA_TYPE_LABELS[type]}
            </div>
          </div>

          <div>
            <label className={labelClass}>Title *</label>
            <input
              type="text"
              placeholder="Title"
              className={inputClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>

          <div>
            <label className={labelClass}>Date</label>
            <input
              type="date"
              className={inputClass}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Status</label>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "finished" | "in_progress")
              }
              className={`${inputClass} cursor-pointer`}
            >
              <option value="finished">Finished</option>
              <option value="in_progress">In progress</option>
            </select>
          </div>

          {type === "movie" && (
            <div>
              <label className={labelClass}>Director</label>
              <input
                type="text"
                className={inputClass}
                value={director}
                onChange={(e) => setDirector(e.target.value)}
              />
            </div>
          )}

          {type === "book" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Author</label>
                <input
                  type="text"
                  className={inputClass}
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Pages</label>
                <input
                  type="number"
                  min={1}
                  className={inputClass}
                  value={pages}
                  onChange={(e) => setPages(e.target.value)}
                />
              </div>
            </div>
          )}

          {type === "music_album" && (
            <div>
              <label className={labelClass}>Artist</label>
              <input
                type="text"
                className={inputClass}
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className={labelClass}>Review</label>
            <textarea
              className={`${inputClass} min-h-[80px]`}
              placeholder="What did you think?"
              value={review}
              onChange={(e) => setReview(e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>URL</label>
            <input
              type="url"
              placeholder="https://..."
              className={inputClass}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Cover image URL</label>
            <input
              type="url"
              placeholder="https://..."
              className={inputClass}
              value={cover}
              onChange={(e) => setCover(e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Rating (1–10)</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={1}
                max={10}
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="flex-1 h-2 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
              />
              <span className="text-accent font-semibold w-8 tabular-nums">
                {rating}/10
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-lg border border-border text-text-muted hover:bg-surface-hover transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSaveAndClose()}
            disabled={!title.trim() || submitting}
            className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditLogModal;
