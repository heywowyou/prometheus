import { useRef, useState } from "react";
import { Link, Upload } from "lucide-react";
import type { CoverImage } from "../types/media-types";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { useUploadApi } from "../api/upload-api";

interface CoverImageInputProps {
  value: CoverImage | null;
  onChange: (value: CoverImage | null) => void;
}

function CoverImageInput({ value, onChange }: CoverImageInputProps) {
  const [mode, setMode] = useState<"url" | "upload">(
    value?.source === "upload" ? "upload" : "url"
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadCover } = useUploadApi();

  const previewUrl = value?.url || null;

  const handleUrlChange = (raw: string) => {
    onChange(raw.trim() ? { url: raw.trim(), source: "external" } : null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const result = await uploadCover(file);
      onChange({ url: result.url, source: "upload", publicId: result.publicId });
    } catch {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const modeButtonClass = (active: boolean) =>
    `px-2 py-0.5 rounded-md flex items-center gap-1 text-xs transition-colors ${
      active
        ? "bg-accent text-accent-foreground"
        : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Cover image</Label>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setMode("url")}
            className={modeButtonClass(mode === "url")}
          >
            <Link className="w-3 h-3" />
            URL
          </button>
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={modeButtonClass(mode === "upload")}
          >
            <Upload className="w-3 h-3" />
            Upload
          </button>
        </div>
      </div>

      {mode === "url" ? (
        <Input
          type="url"
          placeholder="https://..."
          value={value?.source === "external" ? value.url : ""}
          onChange={(e) => handleUrlChange(e.target.value)}
        />
      ) : (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => void handleFileChange(e)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full h-9 flex items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-muted transition-colors disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            {uploading ? "Uploading…" : "Choose file"}
          </button>
          {uploadError && (
            <p className="text-xs text-red-400 mt-1">{uploadError}</p>
          )}
        </div>
      )}

      {previewUrl && (
        <div className="w-14 aspect-square overflow-hidden rounded-lg border border-border">
          <img
            src={previewUrl}
            alt="Cover preview"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}
    </div>
  );
}

export default CoverImageInput;
