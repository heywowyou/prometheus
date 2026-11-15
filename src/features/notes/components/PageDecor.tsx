import { useRef, useState, type ReactNode } from "react";
import { FileText, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import { getErrorMessage } from "@lib/api/errors";
import { cn } from "@lib/utils";
import { useUploadApi } from "@features/media/api/upload-api";
import type { NoteCover } from "../types/note-types";
import { COVER_GRADIENTS } from "../note-decor";

/** A page's emoji, or a document glyph when it has none. */
export function NoteIcon({ icon, className }: { icon?: string; className?: string }) {
  if (icon) {
    return (
      <span aria-hidden className={cn("inline-flex shrink-0 items-center justify-center leading-none", className)}>
        {icon}
      </span>
    );
  }
  return <FileText aria-hidden className={cn("shrink-0 text-muted-foreground", className)} strokeWidth={1.75} />;
}

const EMOJI_GROUPS: Array<{ label: string; emojis: string[] }> = [
  { label: "Common", emojis: ["📝", "📌", "💡", "✅", "⭐", "🔥", "📚", "🎯", "🧠", "🗂️", "📅", "🗓️", "✍️", "📖", "🔖", "📎"] },
  { label: "Life", emojis: ["🏠", "🍳", "🛒", "✈️", "🧳", "🏖️", "🎁", "💰", "🩺", "🧘", "🏋️", "🚴", "🏃", "⚽", "🎸", "🎧"] },
  { label: "Work", emojis: ["💼", "💻", "🛠️", "⚙️", "🧪", "📈", "📊", "🗺️", "🧭", "🚀", "🔒", "🔑", "📨", "☎️", "🤝", "🏆"] },
  { label: "Media", emojis: ["🎬", "📺", "🎮", "🎵", "📷", "🎨", "🖋️", "🎭", "📻", "🍿", "🕹️", "🎲", "🖼️", "🎤", "📽️", "🎞️"] },
  { label: "Nature", emojis: ["🌱", "🌿", "🌻", "🌙", "☀️", "🌊", "⛰️", "🌲", "🍂", "❄️", "🌧️", "🌈", "🐾", "🦊", "🐈", "🐕"] },
  { label: "Symbols", emojis: ["❤️", "💚", "💙", "🖤", "⚡", "✨", "💬", "❓", "❗", "⚠️", "🔴", "🟢", "🔵", "🟡", "⚪", "⚫"] },
];

/** A grid of emojis to set as a page icon. */
export function IconPicker({
  value,
  onChange,
  children,
}: {
  value?: string;
  onChange: (icon: string) => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pick = (icon: string) => {
    onChange(icon);
    setOpen(false);
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="start" className="w-[22rem] p-3">
        <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
          {EMOJI_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 px-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {group.label}
              </p>
              <div className="grid grid-cols-8 gap-0.5">
                {group.emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => pick(emoji)}
                    aria-label={`Use ${emoji}`}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg text-xl hover:bg-secondary",
                      value === emoji && "bg-raised",
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        {value && (
          <button
            type="button"
            onClick={() => pick("")}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-border py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove icon
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** Gradients to pick from, an image upload, or remove. */
export function CoverPicker({
  hasCover,
  onChange,
  children,
}: {
  hasCover: boolean;
  onChange: (cover: NoteCover | null) => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { uploadCover } = useUploadApi();

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const image = await uploadCover(file);
      onChange({ url: image.url, ...(image.publicId ? { publicId: image.publicId } : {}) });
      setOpen(false);
    } catch (error) {
      toast.error(`Upload failed: ${getErrorMessage(error)}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-3">
        <p className="mb-2 px-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Gradients
        </p>
        <div className="grid grid-cols-3 gap-2">
          {COVER_GRADIENTS.map((gradient, index) => (
            <button
              key={gradient}
              type="button"
              aria-label={`Gradient ${index + 1}`}
              onClick={() => {
                onChange({ url: gradient });
                setOpen(false);
              }}
              className="h-14 rounded-xl border border-border transition-transform hover:scale-[1.03]"
              style={{ background: gradient }}
            />
          ))}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void upload(file);
          }}
        />
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border py-2 text-sm hover:bg-secondary disabled:opacity-60"
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
            Upload image
          </button>
          {hasCover && (
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className="flex items-center justify-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
