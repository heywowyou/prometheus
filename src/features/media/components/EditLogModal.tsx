import { useState, useEffect, KeyboardEvent } from "react";
import { MEDIA_TYPE_LABELS, type MediaLog, type MediaLogType } from "../types/media-types";
import type { UpdateMediaLogPayload } from "../api/media-api";
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
import { Slider } from "../../../components/ui/slider";
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

  if (!log) return null;

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit log</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Type</Label>
            <div className="flex h-9 w-full items-center rounded-sm border border-border bg-secondary px-3 text-sm text-muted-foreground">
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

          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

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

          <div className="space-y-1.5">
            <Label>Cover image URL</Label>
            <Input
              type="url"
              placeholder="https://..."
              value={cover}
              onChange={(e) => setCover(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Rating</Label>
              <span
                className="text-sm font-semibold tabular-nums"
                style={{ color: "var(--rating)" }}
              >
                {rating}/10
              </span>
            </div>
            <Slider
              min={1}
              max={10}
              step={1}
              value={[rating]}
              onValueChange={([val]) => setRating(val)}
            />
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
