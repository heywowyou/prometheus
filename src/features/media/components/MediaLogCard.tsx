import { Pencil, Trash2, ImageIcon, Heart } from "lucide-react";
import { StarRating } from "@components/ui/star-rating";
import { cn } from "@lib/utils";
import { resolveCoverUrl, type MediaLog } from "../types/media-types";

interface MediaLogCardProps {
  log: MediaLog;
  /** Tailwind aspect ratio for the cover, from the type's config. */
  coverAspect: string;
  onEdit?: (log: MediaLog) => void;
  onDelete?: (log: MediaLog) => void;
  onToggleFavorite?: (id: string) => void;
}

const formatDate = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString();
};

/** The type-specific credit line under the title, if the log has one. */
const creditLine = (log: MediaLog): string | null => {
  switch (log.type) {
    case "movie":
      return log.director ? `Directed by ${log.director}` : null;
    case "book":
      return (
        [log.author, log.pages ? `${log.pages} pages` : null]
          .filter(Boolean)
          .join(" · ") || null
      );
    case "music_album":
      return log.artist || null;
    default:
      return null;
  }
};

function MediaLogCard({
  log,
  coverAspect,
  onEdit,
  onDelete,
  onToggleFavorite,
}: MediaLogCardProps) {
  const coverUrl = resolveCoverUrl(log.cover);
  const dateLabel = formatDate(log.date);
  // "2021 · Directed by Denis Villeneuve" — the year tells remakes apart.
  const credit =
    [log.releaseYear, creditLine(log)].filter(Boolean).join(" · ") || null;
  const isFinished = log.status === "finished";

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-muted">
      <div
        className={cn(
          coverAspect,
          "relative flex w-full flex-shrink-0 items-center justify-center overflow-hidden bg-secondary",
        )}
      >
        {coverUrl ? (
          <img
            src={coverUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <ImageIcon className="h-8 w-8 text-muted-foreground opacity-20" />
        )}

        {(onEdit || onDelete) && (
          // Hover/focus overlay on desktop; on touch screens the buttons sit
          // permanently in the cover's bottom-left corner instead.
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 touch:inset-auto touch:bottom-2 touch:left-2 touch:bg-transparent touch:opacity-100">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(log)}
                aria-label={`Edit ${log.title}`}
                className="rounded-xl bg-card/80 p-2 text-foreground transition-colors hover:bg-card"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(log)}
                aria-label={`Delete ${log.title}`}
                className="rounded-xl bg-card/80 p-2 text-destructive transition-colors hover:bg-card"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        {onToggleFavorite && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleFavorite(log._id);
            }}
            aria-label={log.favorite ? "Remove from favorites" : "Add to favorites"}
            aria-pressed={log.favorite}
            className="absolute right-2.5 top-2.5 z-10 rounded-2xl bg-black/40 p-1.5 transition-colors hover:bg-black/60"
          >
            <Heart
              className={cn(
                "h-4 w-4",
                log.favorite
                  ? "fill-rating text-rating"
                  : "fill-transparent text-muted-foreground",
              )}
            />
          </button>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3">
        <div className="flex min-w-0 items-start justify-between gap-1">
          <div className="min-w-0 flex-1">
            {log.url ? (
              <a
                href={log.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block truncate text-sm font-semibold leading-tight text-foreground hover:text-muted-foreground"
              >
                {log.title}
              </a>
            ) : (
              <span className="block truncate text-sm font-semibold leading-tight text-foreground">
                {log.title}
              </span>
            )}
            {credit && (
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                {credit}
              </span>
            )}
          </div>
          {dateLabel && (
            <span className="mt-0.5 flex-shrink-0 text-[10px] tabular-nums text-muted-foreground">
              {dateLabel}
            </span>
          )}
        </div>

        <div>
          <span
            className={cn(
              "rounded-xl border px-1.5 py-0.5 text-[10px] uppercase tracking-wide",
              isFinished
                ? "border-emerald-700/60 bg-emerald-600/20 text-emerald-300"
                : "border-amber-700/60 bg-amber-600/20 text-amber-300",
            )}
          >
            {isFinished ? "Done" : "In progress"}
          </span>
        </div>

        <StarRating value={log.rating} size="sm" className="mt-auto pt-1" />
      </div>
    </article>
  );
}

export default MediaLogCard;
