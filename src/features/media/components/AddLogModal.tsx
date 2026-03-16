import { useState, KeyboardEvent } from "react";
import { Star } from "lucide-react";
import { MEDIA_TYPE_LABELS, type MediaLogType } from "../types/media-types";
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
  const [dateDay, setDateDay] = useState<string>(() => String(new Date().getDate()).padStart(2, "0"));
  const [dateMonth, setDateMonth] = useState<string>(() => String(new Date().getMonth() + 1).padStart(2, "0"));
  const [dateYear, setDateYear] = useState<string>(() => String(new Date().getFullYear()));
  const [status, setStatus] = useState<"finished" | "in_progress">("finished");
  const [director, setDirector] = useState("");
  const [author, setAuthor] = useState("");
  const [pages, setPages] = useState<string>("");
  const [artist, setArtist] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

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
        date: `${dateYear}-${dateMonth}-${dateDay}`,
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
      setDateDay(String(new Date().getDate()).padStart(2, "0"));
      setDateMonth(String(new Date().getMonth() + 1).padStart(2, "0"));
      setDateYear(String(new Date().getFullYear()));
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
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log something</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* — Default fields — */}
          <div className="space-y-1.5">
            <Label>Type</Label>
            {presetType ? (
              <div className="flex h-9 w-full items-center rounded-xl border border-border bg-secondary px-3 text-sm text-muted-foreground">
                {MEDIA_TYPE_LABELS[presetType]}
              </div>
            ) : (
              <Select
                value={type}
                onValueChange={(value) => setType(value as MediaLogType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEDIA_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {MEDIA_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
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

              <div className="space-y-1.5">
                <Label>Cover image URL</Label>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={cover}
                  onChange={(e) => setCover(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleCreateAndClose()}
            disabled={!title.trim() || submitting}
          >
            {submitting ? "Adding…" : "Add log"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddLogModal;
