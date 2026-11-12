import { Heart, ImageIcon, Star } from "lucide-react";
import { cn } from "@lib/utils";
import { STATUS_META, creditLine } from "../media-status";
import { resolveCoverUrl, type MediaLog } from "../types/media-types";

export type CardDensity = "comfortable" | "compact";

interface MediaLogCardProps {
  log: MediaLog;
  /** Tailwind aspect ratio for the cover, from the type's config. */
  coverAspect: string;
  density: CardDensity;
  onOpen: (log: MediaLog) => void;
  onToggleFavorite: (id: string) => void;
}

/**
 * A cover tile. Clicking opens the detail view, which holds every action;
 * only "favorite" stays on the tile, as the one-tap action people repeat.
 */
function MediaLogCard({ log, coverAspect, density, onOpen, onToggleFavorite }: MediaLogCardProps) {
  const cover = resolveCoverUrl(log.cover);
  const compact = density === "compact";
  const status = log.status && log.status !== "finished" ? STATUS_META[log.status] : null;
  const meta = [log.releaseYear, creditLine(log)].filter(Boolean).join(" · ");

  return (
    <article className="group relative">
      <button
        type="button"
        onClick={() => onOpen(log)}
        aria-label={`Open ${log.title}`}
        className="block w-full text-left focus-visible:outline-none"
      >
        <div
          className={cn(
            coverAspect,
            "relative flex w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-secondary transition-all group-hover:border-rating/60 group-focus-visible:ring-2 group-focus-visible:ring-ring",
          )}
        >
          {cover ? (
            <img
              src={cover}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="flex flex-col items-center gap-1 px-2 text-center">
              <ImageIcon className="h-6 w-6 text-muted-foreground opacity-30" />
              {compact && (
                <span className="line-clamp-3 text-[10px] text-muted-foreground">{log.title}</span>
              )}
            </div>
          )}

          {status && (
            <span
              className={cn(
                "absolute bottom-1.5 left-1.5 rounded-full border px-1.5 py-0.5 text-[10px] font-medium backdrop-blur-sm",
                status.badge,
              )}
            >
              {status.label}
            </span>
          )}

          {log.rating && compact ? (
            <span className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 rounded-full bg-overlay/60 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-foreground">
              <Star className="h-2.5 w-2.5 fill-rating text-rating" />
              {log.rating}
            </span>
          ) : null}
        </div>

        {!compact && (
          <div className="mt-2 min-w-0 px-0.5">
            <p className="truncate text-sm font-medium leading-tight text-foreground">{log.title}</p>
            <div className="mt-0.5 flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="truncate">{meta || " "}</span>
              {log.rating ? (
                <span className="flex shrink-0 items-center gap-0.5 tabular-nums">
                  <Star className="h-3 w-3 fill-rating text-rating" />
                  {log.rating}
                </span>
              ) : null}
            </div>
          </div>
        )}
      </button>

      <button
        type="button"
        onClick={() => onToggleFavorite(log._id)}
        aria-label={log.favorite ? `Remove ${log.title} from favorites` : `Add ${log.title} to favorites`}
        aria-pressed={log.favorite}
        className={cn(
          "absolute right-1.5 top-1.5 rounded-full bg-overlay/50 p-1.5 transition-opacity hover:bg-overlay/70 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          log.favorite ? "opacity-100" : "opacity-0 group-hover:opacity-100 touch:opacity-100",
        )}
      >
        <Heart
          className={cn(
            "h-3.5 w-3.5",
            log.favorite ? "fill-rating text-rating" : "fill-transparent text-foreground",
          )}
        />
      </button>
    </article>
  );
}

export default MediaLogCard;
