import { useState, useEffect, KeyboardEvent } from "react";
import { Star } from "lucide-react";
import { MEDIA_TYPE_LABELS, type MediaLog, type MediaLogType, type CoverImage } from "../types/media-types";
import type { UpdateMediaLogPayload } from "../api/media-api";
import CoverImageInput from "./CoverImageInput";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";

interface EditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: MediaLog | null;
  onUpdate: (id: string, payload: UpdateMediaLogPayload) => Promise<unknown>;
}

function EditLogModal({ isOpen, onClose, log, onUpdate }: EditLogModalProps) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [cover, setCover] = useState<CoverImage | null>(null);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [dateDay, setDateDay] = useState("");
  const [dateMonth, setDateMonth] = useState("");
  const [dateYear, setDateYear] = useState("");
  const [status, setStatus] = useState<"finished" | "in_progress">("finished");
  const [director, setDirector] = useState("");
  const [author, setAuthor] = useState("");
  const [pages, setPages] = useState<string>("");
  const [artist, setArtist] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (log) {
      setTitle(log.title);
      setUrl(log.url ?? "");
      setCover(
        log.cover
          ? typeof log.cover === "string"
            ? { url: log.cover, source: "external" }
            : log.cover
          : null
      );
      setRating(log.rating);
      setReview(log.review ?? "");
      const d = log.date ? log.date.slice(0, 10) : new Date().toISOString().slice(0, 10);
      setDateDay(d.slice(8, 10));
      setDateMonth(d.slice(5, 7));
      setDateYear(d.slice(0, 4));
      setStatus(log.status ?? "finished");
      setDirector(log.director ?? "");
      setAuthor(log.author ?? "");
      setPages(log.pages != null ? String(log.pages) : "");
      setArtist(log.artist ?? "");
    }
  }, [log]);

  if (!log) return null;

  const type: MediaLogType = log.type;

  const handleSaveAndClose = async () => {
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      await onUpdate(log._id, {
        title: title.trim(),
        url: url.trim() || undefined,
        cover: cover ?? undefined,
        rating,
        review: review.trim() || undefined,
        date: (dateYear && dateMonth && dateDay) ? `${dateYear}-${dateMonth}-${dateDay}` : undefined,
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit log</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* — Default fields — */}
          <div className="space-y-1.5">
            <Label>Type</Label>
            <div className="flex h-9 w-full items-center rounded-xl border border-border bg-secondary px-3 text-sm text-muted-foreground">
              {MEDIA_TYPE_LABELS[type]}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Rating</Label>
              <span className="text-sm font-semibold tabular-nums" style={{ color: "#5bb8e8" }}>
                {rating}/10
              </span>
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: 10 }, (_, i) => (
                <Star
                  key={i}
                  className="w-5 h-5 cursor-pointer rounded-sm"
                  style={{
                    fill: i < rating ? "#5bb8e8" : "#2e2e2e",
                    color: i < rating ? "#5bb8e8" : "#2e2e2e",
                  }}
                  onClick={() => setRating(i + 1)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Date</Label>
            <div className="flex items-center gap-1.5">
              <Input
                type="text"
                inputMode="numeric"
                maxLength={2}
                placeholder="DD"
                className="w-12 text-center"
                value={dateDay}
                onChange={(e) => setDateDay(e.target.value)}
              />
              <span className="text-muted-foreground text-sm">/</span>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={2}
                placeholder="MM"
                className="w-12 text-center"
                value={dateMonth}
                onChange={(e) => setDateMonth(e.target.value)}
              />
              <span className="text-muted-foreground text-sm">/</span>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={4}
                placeholder="YYYY"
                className="w-16 text-center"
                value={dateYear}
                onChange={(e) => setDateYear(e.target.value)}
              />
            </div>
          </div>

          {/* — Advanced toggle — */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            {showAdvanced ? "Hide advanced options ▴" : "Show advanced options ▾"}
          </button>

          {/* — Advanced fields — */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              showAdvanced ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={status}
                  onValueChange={(value) =>
                    setStatus(value as "finished" | "in_progress")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="finished">Finished</SelectItem>
                    <SelectItem value="in_progress">In progress</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {type === "movie" && (
                <div className="space-y-1.5">
                  <Label>Director</Label>
                  <Input
                    type="text"
                    value={director}
                    onChange={(e) => setDirector(e.target.value)}
                  />
                </div>
              )}

              {type === "book" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Author</Label>
                    <Input
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Pages</Label>
                    <Input
                      type="number"
                      min={1}
                      value={pages}
                      onChange={(e) => setPages(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {type === "music_album" && (
                <div className="space-y-1.5">
                  <Label>Artist</Label>
                  <Input
                    type="text"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Review</Label>
                <Textarea
                  placeholder="What did you think?"
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>URL</Label>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>

              <CoverImageInput value={cover} onChange={setCover} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleSaveAndClose()}
            disabled={!title.trim() || submitting}
          >
            {submitting ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default EditLogModal;
