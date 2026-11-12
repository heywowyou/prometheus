import { ExternalLink, Heart, ImageIcon, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@components/ui/dialog";
import { Button } from "@components/ui/button";
import { StarRating } from "@components/ui/star-rating";
import { cn } from "@lib/utils";
import { configForType } from "../media-config";
import { STATUS_META, creditLine, formatLogDate } from "../media-status";
import { resolveCoverUrl, type MediaLog } from "../types/media-types";

interface MediaLogDetailProps {
  log: MediaLog | null;
  onClose: () => void;
  onEdit: (log: MediaLog) => void;
  onDelete: (log: MediaLog) => void;
  onToggleFavorite: (id: string) => void;
}

/** Everything about one log, opened by clicking its card. */
function MediaLogDetail({ log, onClose, onEdit, onDelete, onToggleFavorite }: MediaLogDetailProps) {
  return (
    <Dialog open={log !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92dvh] max-w-2xl overflow-y-auto p-0">
        {log && (
          <DetailBody
            log={log}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleFavorite={onToggleFavorite}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function DetailBody({
  log,
  onEdit,
  onDelete,
  onToggleFavorite,
}: Omit<MediaLogDetailProps, "log" | "onClose"> & { log: MediaLog }) {
  const config = configForType(log.type);
  const status = STATUS_META[log.status ?? "finished"];
  const cover = resolveCoverUrl(log.cover);
  const credit = creditLine(log);
  const date = formatLogDate(log.date);

  return (
    <div className="grid sm:grid-cols-[240px_1fr]">
      <div className="bg-secondary p-6 sm:p-0">
        <div
          className={cn(
            config.coverAspect,
            "mx-auto flex w-40 items-center justify-center overflow-hidden rounded-lg sm:h-full sm:w-full sm:rounded-none sm:rounded-l-xl",
          )}
        >
          {cover ? (
            <img src={cover} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-10 w-10 text-muted-foreground opacity-30" />
          )}
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-4 p-6">
        <div className="pr-6">
          <p className="mb-1 flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
            <config.icon className="h-3.5 w-3.5" />
            {config.singular}
            {log.releaseYear ? ` · ${log.releaseYear}` : ""}
          </p>
          <DialogTitle className="text-xl leading-tight">{log.title}</DialogTitle>
          <DialogDescription className="mt-1">
            {credit ?? `Logged ${date ?? ""}`.trim()}
          </DialogDescription>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className={cn("rounded-full border px-2 py-0.5 font-medium", status.badge)}>
            {status.label}
          </span>
          {date && (
            <span className="text-muted-foreground">
              {status.dateLabel} {date}
            </span>
          )}
        </div>

        {log.rating ? (
          <div className="flex items-center gap-3">
            <StarRating value={log.rating} />
            <span className="text-sm font-semibold tabular-nums text-rating">{log.rating}/10</span>
          </div>
        ) : status.rated ? (
          <p className="text-sm text-muted-foreground">Not rated</p>
        ) : null}

        <div className="rounded-xl border border-border bg-secondary/40 p-3">
          {log.review ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{log.review}</p>
          ) : (
            <button
              type="button"
              onClick={() => onEdit(log)}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              No review yet. Write one…
            </button>
          )}
        </div>

        {log.url && (
          <a
            href={log.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-fit items-center gap-1.5 text-sm text-rating hover:text-rating-hover"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {(() => {
              try {
                return new URL(log.url).hostname.replace(/^www\./, "");
              } catch {
                return "Open link";
              }
            })()}
          </a>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <Button size="sm" onClick={() => onEdit(log)}>
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            aria-pressed={log.favorite}
            onClick={() => onToggleFavorite(log._id)}
          >
            <Heart className={cn("h-3.5 w-3.5", log.favorite && "fill-rating text-rating")} />
            {log.favorite ? "Favorite" : "Add to favorites"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto text-destructive hover:text-destructive"
            onClick={() => onDelete(log)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

export default MediaLogDetail;
