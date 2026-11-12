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
  /** Tailwind aspect ratio for the preview, from the type's config. */
  coverAspect?: string;
}

type Mode = "url" | "upload";

const isHttpUrl = (raw: string): boolean => {
  try {
    const url = new URL(raw);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

/**
 * Picks a cover by remote URL or by file upload. Covers usually arrive from
 * the title search instead; this is for overriding them.
 *
 * A URL cover stays `source: "external"` in the form and is copied into
 * Cloudinary by the API when the log is saved — so cancelling never leaves an
 * orphaned image. Files have to be uploaded straight away.
 */
function CoverImageInput({
  value,
  onChange,
  coverAspect = "aspect-[2/3]",
}: CoverImageInputProps) {
  const { uploadCover } = useUploadApi();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>("url");
  const [urlInput, setUrlInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUseUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (!isHttpUrl(trimmed)) {
      setError("Enter a full http(s) image URL");
      return;
    }
    onChange({ url: trimmed, source: "external" });
    setUrlInput("");
    setError(null);
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

  const modeButton = (target: Mode, label: string) => (
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
      {target === "url" ? <Link className="h-3 w-3" /> : <Upload className="h-3 w-3" />}
      {label}
    </button>
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Cover</Label>
        <div className="flex gap-1">
          {modeButton("url", "URL")}
          {modeButton("upload", "Upload")}
        </div>
      </div>

      <div className="flex gap-3">
        {value?.url && (
          <div className="relative shrink-0">
            <div
              className={cn(
                coverAspect,
                "w-16 overflow-hidden rounded-lg border border-border bg-secondary",
              )}
            >
              <img
                src={value.url}
                alt="Cover preview"
                className="h-full w-full object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => onChange(null)}
              aria-label="Remove cover"
              className="absolute -right-1.5 -top-1.5 rounded-full border border-border bg-card p-0.5 text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-1.5">
          {mode === "url" ? (
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder={value ? "Paste a URL to replace…" : "https://…"}
                value={urlInput}
                onChange={(event) => {
                  setUrlInput(event.target.value);
                  setError(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleUseUrl();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleUseUrl}
                disabled={!urlInput.trim()}
                className="flex-shrink-0 text-muted-foreground hover:text-foreground"
              >
                Use
              </Button>
            </div>
          ) : (
            <>
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
            </>
          )}

          {value?.source === "external" && (
            <p className="text-[11px] text-muted-foreground">
              Saved to your library when you save the log.
            </p>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      </div>
    </div>
  );
}

export default CoverImageInput;
