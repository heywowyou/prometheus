import { useMemo, useState } from "react";
import { Check, ImageIcon, Search, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import { Button } from "@components/ui/button";
import { cn } from "@lib/utils";
import { useMediaLogs } from "@features/media/hooks/useMediaLogs";
import { creditLine } from "@features/media/media-status";
import type { MediaTypeConfig } from "@features/media/media-config";
import { resolveCoverUrl, type MediaLog } from "@features/media/types/media-types";

interface TopPickSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: MediaTypeConfig;
  /** The pick being swapped, or null when filling an empty slot. */
  current: MediaLog | null;
  /** Ids already in the row; they can't be picked twice. */
  pickedIds: ReadonlySet<string>;
  onSelect: (log: MediaLog) => void;
  onRemove: () => void;
}

const normalise = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** Search the category's library to fill or swap one top 5 slot. */
function TopPickSearchDialog({ open, onOpenChange, ...rest }: TopPickSearchDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        {open && <SearchBody {...rest} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function SearchBody({
  config,
  current,
  pickedIds,
  onSelect,
  onRemove,
  onClose,
}: Omit<TopPickSearchDialogProps, "open" | "onOpenChange"> & { onClose: () => void }) {
  const { logs, loading } = useMediaLogs(config.type);
  const [query, setQuery] = useState("");

  // Best rated first, so the likely candidates are on top before typing.
  const results = useMemo(() => {
    const needle = normalise(query.trim());
    return logs
      .filter(
        (log) =>
          !needle ||
          normalise(`${log.title} ${creditLine(log) ?? ""} ${log.releaseYear ?? ""}`).includes(needle),
      )
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || a.title.localeCompare(b.title));
  }, [logs, query]);

  const choose = (log: MediaLog) => {
    onSelect(log);
    onClose();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{current ? `Swap “${current.title}”` : `Add to your top ${config.plural.toLowerCase()}`}</DialogTitle>
        <DialogDescription>Pick from the {config.plural.toLowerCase()} you've logged.</DialogDescription>
      </DialogHeader>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            const first = results.find((log) => !pickedIds.has(log._id));
            if (first) choose(first);
          }}
          placeholder={`Search your ${config.plural.toLowerCase()}…`}
          aria-label={`Search your ${config.plural.toLowerCase()}`}
          className="h-11 w-full rounded-xl border border-border bg-secondary pl-10 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <ul className="-mx-2 max-h-[50vh] min-h-[200px] overflow-y-auto">
        {loading ? (
          <li className="px-2 pt-16 text-center text-sm text-muted-foreground">Loading…</li>
        ) : results.length === 0 ? (
          <li className="px-2 pt-16 text-center text-sm text-muted-foreground">
            {logs.length === 0
              ? `No ${config.plural.toLowerCase()} logged yet.`
              : `Nothing matches “${query.trim()}”.`}
          </li>
        ) : (
          results.map((log) => {
            const picked = pickedIds.has(log._id);
            const cover = resolveCoverUrl(log.cover);
            const meta = [log.releaseYear, creditLine(log)].filter(Boolean).join(" · ");
            return (
              <li key={log._id}>
                <button
                  type="button"
                  disabled={picked}
                  onClick={() => choose(log)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition-colors hover:bg-secondary focus-visible:bg-secondary focus-visible:outline-none",
                    picked && "cursor-default opacity-50 hover:bg-transparent",
                  )}
                >
                  <span
                    className={cn(
                      config.coverAspect,
                      "flex w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-secondary",
                    )}
                  >
                    {cover ? (
                      <img src={cover} alt="" loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-4 w-4 text-muted-foreground opacity-40" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-serif text-lg leading-tight text-foreground">
                      {log.title}
                    </span>
                    {meta && <span className="block truncate text-xs text-muted-foreground">{meta}</span>}
                  </span>
                  {picked ? (
                    <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                      <Check className="h-3.5 w-3.5" />
                      In top 5
                    </span>
                  ) : log.rating ? (
                    <span className="shrink-0 text-xs font-semibold tabular-nums text-rating">
                      {log.rating}/10
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })
        )}
      </ul>

      {current && (
        <div className="flex justify-end border-t border-border pt-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => {
              onRemove();
              onClose();
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove from top 5
          </Button>
        </div>
      )}
    </>
  );
}

export default TopPickSearchDialog;
