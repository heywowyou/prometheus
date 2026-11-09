import { useRef, useState } from "react";
import { Link, Upload, X } from "lucide-react";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Button } from "@components/ui/button";
import { cn } from "@lib/utils";
import { getErrorMessage } from "@lib/api/errors";
import { useUploadApi } from "../api/upload-api";
import type { CoverImage } from "../types/media-types";

interface CoverImageInputProps {
  value: CoverImage | null;
  onChange: (value: CoverImage | null) => void;
}

type Mode = "url" | "upload";

/**
 * Picks a cover either by remote URL or by file upload.
 *
 * Both paths store the image in Cloudinary so covers don't break when the
 * source site reorganises; the API owns deleting replaced assets.
 */
function CoverImageInput({ value, onChange }: CoverImageInputProps) {
  const { uploadCover, uploadCoverFromUrl } = useUploadApi();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>(
    value?.source === "upload" ? "upload" : "url",
  );
  const [urlInput, setUrlInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUrlFetch = async () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    setBusy(true);
    setError(null);
    try {
      const result = await uploadCoverFromUrl(trimmed);
      onChange({ url: result.url, source: "upload", publicId: result.publicId });
      setUrlInput("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setError(null);
    try {
      const result = await uploadCover(file);
      onChange({ url: result.url, source: "upload", publicId: result.publicId });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
      // Reset so the same file can be re-selected after an error.
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const modeButton = (target: Mode, icon: typeof Link, label: string) => (
    <button
      type="button"
      onClick={() => setMode(target)}
      aria-pressed={mode === target}
      className={cn(
        "flex items-center gap-1 rounded-md px-2 py-0.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        mode === target
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon === Link ? <Link className="h-3 w-3" /> : <Upload className="h-3 w-3" />}
      {label}
    </button>
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Cover image</Label>
        <div className="flex items-center gap-2">
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="flex items-center gap-1 rounded-md text-xs text-destructive transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <X className="h-3 w-3" />
              Remove
            </button>
          )}
          <div className="flex gap-1">
            {modeButton("url", Link, "URL")}
            {modeButton("upload", Upload, "Upload")}
          </div>
        </div>
      </div>

      {value?.url && (
        <div className="aspect-square w-14 overflow-hidden rounded-lg border border-border">
          <img
            src={value.url}
            alt="Cover preview"
            className="h-full w-full object-cover"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        </div>
      )}

      {mode === "url" ? (
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder={value ? "Paste a new URL to replace…" : "https://…"}
            value={urlInput}
            onChange={(event) => {
              setUrlInput(event.target.value);
              setError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleUrlFetch();
              }
            }}
            disabled={busy}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleUrlFetch()}
            disabled={!urlInput.trim() || busy}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground"
          >
            {busy ? "Fetching…" : "Fetch"}
          </Button>
        </div>
      ) : (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => void handleFileChange(event)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            className="flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground transition-colors hover:border-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
          >
            <Upload className="h-3.5 w-3.5" />
            {busy
              ? "Uploading…"
              : value
                ? "Choose a replacement file"
                : "Choose file"}
          </button>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export default CoverImageInput;
