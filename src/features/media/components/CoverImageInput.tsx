import { useRef, useState } from "react";
import { ImageIcon, Link, Upload, X } from "lucide-react";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { cn } from "@lib/utils";
import { getErrorMessage } from "@lib/api/errors";
import { useUploadApi } from "../api/upload-api";
import type { CoverImage } from "../types/media-types";

interface CoverImageInputProps {
  value: CoverImage | null;
  onChange: (value: CoverImage | null) => void;
  /** Tailwind aspect ratio for the preview, from the type's config. */
  coverAspect?: string;
}

const isHttpUrl = (raw: string): boolean => {
  try {
    const url = new URL(raw);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

/**
 * Large cover preview with "paste URL" and "upload" overrides. Covers usually
 * arrive from the catalogue search; this is for fixing or replacing them.
 *
 * A URL cover stays `source: "external"` and is copied into Cloudinary by the
 * API on save, so cancelling never leaves an orphaned image. Files have to be
 * uploaded straight away.
 */
function CoverImageInput({
  value,
  onChange,
  coverAspect = "aspect-[2/3]",
}: CoverImageInputProps) {
  const { uploadCover } = useUploadApi();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [urlOpen, setUrlOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [broken, setBroken] = useState(false);

  const set = (cover: CoverImage | null) => {
    setBroken(false);
    setError(null);
    onChange(cover);
  };

  const applyUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (!isHttpUrl(trimmed)) {
      setError("Enter a full http(s) image URL");
      return;
    }
    set({ url: trimmed, source: "external" });
    setUrlInput("");
    setUrlOpen(false);
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const result = await uploadCover(file);
      set({ url: result.url, source: "upload", publicId: result.publicId });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div
        className={cn(
          coverAspect,
          "group relative w-full overflow-hidden rounded-xl border border-border bg-secondary",
        )}
      >
        {value?.url && !broken ? (
          <img
            src={value.url}
            alt="Cover"
            className="h-full w-full object-cover"
            onError={() => setBroken(true)}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-3 text-center text-xs text-muted-foreground">
            <ImageIcon className="h-6 w-6 opacity-40" />
            {broken ? "Image can't be loaded" : "No cover"}
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-overlay/60 text-xs text-foreground">
            Uploading…
          </div>
        )}
        {value && (
          <button
            type="button"
            onClick={() => set(null)}
            aria-label="Remove cover"
            className="absolute right-1.5 top-1.5 rounded-full bg-overlay/60 p-1 text-foreground opacity-0 transition-opacity hover:bg-overlay/80 focus-visible:opacity-100 group-hover:opacity-100 touch:opacity-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() => setUrlOpen((open) => !open)}
          aria-expanded={urlOpen}
        >
          <Link className="h-3.5 w-3.5" />
          URL
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          disabled={busy}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-3.5 w-3.5" />
          Upload
        </Button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => void handleFile(event)}
      />

      {urlOpen && (
        <div className="flex gap-1.5">
          <Input
            type="url"
            autoFocus
            placeholder="https://…"
            className="h-8 text-xs"
            value={urlInput}
            onChange={(event) => {
              setUrlInput(event.target.value);
              setError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                applyUrl();
              }
            }}
          />
          <Button type="button" size="sm" className="h-8" onClick={applyUrl} disabled={!urlInput.trim()}>
            Use
          </Button>
        </div>
      )}

      {value?.source === "external" && !broken && (
        <p className="text-[11px] leading-snug text-muted-foreground">
          Saved to your library when you save.
        </p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export default CoverImageInput;
