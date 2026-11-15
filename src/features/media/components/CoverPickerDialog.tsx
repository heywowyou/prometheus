import { useState } from "react";
import { Check, ImageIcon, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { cn } from "@lib/utils";
import { getErrorMessage } from "@lib/api/errors";
import { useCoverOptions } from "../hooks/useMetadata";
import type { MediaTypeConfig } from "../media-config";
import type { ExternalRef } from "../types/metadata-types";

interface CoverPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: MediaTypeConfig;
  /** The catalogue entry to browse; null when the log isn't linked to one. */
  external: ExternalRef | null;
  title: string;
  /**
   * Called with the chosen remote URL. May return a promise (saving straight
   * away from the detail view); the dialog stays open, busy, until it settles
   * and closes only if it resolves.
   */
  onPick: (url: string) => unknown;
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
 * Browse every cover the log's catalogue entry has and pick one. A pasted
 * link is offered only when the catalogue has nothing else to choose from.
 */
function CoverPickerDialog({ open, onOpenChange, ...rest }: CoverPickerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* No auto-focus on the first tile: a highlighted cover reads as "current". */}
      <DialogContent className="max-w-3xl" onOpenAutoFocus={(event) => event.preventDefault()}>
        {open && <PickerBody {...rest} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function PickerBody({
  config,
  external,
  title,
  onPick,
  onClose,
}: Omit<CoverPickerDialogProps, "open" | "onOpenChange"> & { onClose: () => void }) {
  const { options, loading, isError, error } = useCoverOptions(external, true);
  const [saving, setSaving] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(() => new Set());

  const visible = options.filter((option) => !hidden.has(option.url));
  const offerUrl = !loading && visible.length <= 1;

  const choose = async (url: string) => {
    if (saving) return;
    setSaving(url);
    try {
      await onPick(url);
      onClose();
    } catch {
      // Toasted by the query client; stay open to try another.
    } finally {
      setSaving(null);
    }
  };

  const applyUrl = () => {
    const trimmed = urlInput.trim();
    if (!isHttpUrl(trimmed)) {
      setUrlError("Enter a full http(s) image link");
      return;
    }
    void choose(trimmed);
  };

  const emptyMessage = !external
    ? `This ${config.singular} isn't linked to ${config.metadataSource}, so there are no covers to browse. Link it from Edit, or paste an image link.`
    : isError
      ? `${config.metadataSource} covers couldn't be loaded: ${getErrorMessage(error)}`
      : visible.length === 0
        ? `${config.metadataSource} has no cover for this ${config.singular}.`
        : `${config.metadataSource} only has this one cover.`;

  return (
    <>
      <DialogHeader>
        <DialogTitle>Change cover</DialogTitle>
        <DialogDescription>
          {title}
          {visible.length > 1 ? ` · ${visible.length} covers from ${config.metadataSource}` : ""}
        </DialogDescription>
      </DialogHeader>

      {loading ? (
        <div className="flex min-h-[240px] items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Looking for covers…
        </div>
      ) : (
        visible.length > 0 && (
          <ul className="grid max-h-[60vh] grid-cols-3 gap-3 overflow-y-auto pr-1 sm:grid-cols-5">
            {visible.map((option) => (
              <li key={option.url}>
                <button
                  type="button"
                  onClick={() => void choose(option.url)}
                  disabled={saving !== null}
                  className="group w-full text-left focus-visible:outline-none"
                >
                  <div
                    className={cn(
                      config.coverAspect,
                      "relative flex w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-secondary transition-colors group-hover:border-rating group-focus-visible:border-rating",
                      saving === option.url && "border-rating",
                    )}
                  >
                    <img
                      src={option.thumbnailUrl}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                      // A dead link (common on Cover Art Archive) drops out of the grid.
                      onError={() => setHidden((previous) => new Set(previous).add(option.url))}
                    />
                    {saving === option.url && (
                      <div className="absolute inset-0 flex items-center justify-center bg-overlay/60">
                        <Loader2 className="h-5 w-5 animate-spin text-foreground" />
                      </div>
                    )}
                    <span className="absolute bottom-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-rating text-rating-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <p className="mt-1 truncate text-[11px] text-muted-foreground">
                    {option.label ?? " "}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )
      )}

      {offerUrl && (
        <div className="space-y-3">
          {visible.length === 0 && (
            <div className="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border text-muted-foreground">
              <ImageIcon className="h-6 w-6 opacity-40" />
            </div>
          )}
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          <div className="flex gap-2">
            <Input
              type="url"
              autoFocus
              placeholder="Paste an image link: https://…"
              value={urlInput}
              onChange={(event) => {
                setUrlInput(event.target.value);
                setUrlError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  applyUrl();
                }
              }}
            />
            <Button onClick={applyUrl} disabled={!urlInput.trim() || saving !== null}>
              {saving === urlInput.trim() ? <Loader2 className="h-4 w-4 animate-spin" /> : "Use"}
            </Button>
          </div>
          {urlError && <p className="text-xs text-destructive">{urlError}</p>}
        </div>
      )}
    </>
  );
}

export default CoverPickerDialog;
