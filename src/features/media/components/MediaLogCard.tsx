import { Pencil, Trash2, Star, ImageIcon } from "lucide-react";
import type { MediaLog, MediaLogType } from "../types/media-types";
import { resolveCoverUrl } from "../types/media-types";

const COVER_ASPECT: Record<MediaLogType, string> = {
  movie: "aspect-[2/3]",
  tvshow: "aspect-[2/3]",
  book: "aspect-[2/3]",
  game: "aspect-[2/3]",
  music_album: "aspect-square",
};

interface MediaLogCardProps {
  log: MediaLog;
  onEdit?: (log: MediaLog) => void;
  onDelete?: (id: string) => void;
}

function MediaLogCard({ log, onEdit, onDelete }: MediaLogCardProps) {
  const displayTitle = log.title;
  const coverUrl = resolveCoverUrl(log.cover);
  const linkUrl = log.url || null;
  const dateLabel = (() => {
    if (!log.date) return null;
    const d = new Date(log.date);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString();
  })();

  const secondaryLine = (() => {
    if (log.type === "movie" && log.director) {
      return `Directed by ${log.director}`;
    }
    if (log.type === "book") {
      if (log.author && log.pages) {
        return `${log.author} · ${log.pages} pages`;
      }
      if (log.author) return log.author;
      if (log.pages) return `${log.pages} pages`;
    }
    if (log.type === "music_album" && log.artist) {
      return log.artist;
    }
    return null;
  })();

  return (
    <article className="bg-card rounded-xl border border-border overflow-hidden hover:border-muted transition-colors flex flex-col group">
      {/* Cover poster */}
      <div
        className={`${COVER_ASPECT[log.type]} w-full flex-shrink-0 bg-secondary flex items-center justify-center overflow-hidden relative`}
      >
        {coverUrl ? (
          <img
            src={coverUrl}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <ImageIcon className="w-8 h-8 text-muted-foreground opacity-20" />
        )}
        {/* Hover actions overlay */}
        {(onEdit || onDelete) && (
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(log)}
                className="p-2 rounded-xl bg-card/80 text-foreground hover:bg-card transition-colors"
                aria-label="Edit"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(log._id)}
                className="p-2 rounded-xl bg-card/80 text-red-400 hover:bg-card transition-colors"
                aria-label="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col flex-1 min-w-0 gap-1.5">
        {/* Row 1: Title + Date */}
        <div className="flex items-start justify-between gap-1 min-w-0">
          <div className="min-w-0 flex-1">
            {linkUrl ? (
              <a
                href={linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-sm text-foreground hover:text-muted-foreground truncate block leading-tight"
              >
                {displayTitle}
              </a>
            ) : (
              <span className="font-semibold text-sm text-foreground truncate block leading-tight">
                {displayTitle}
              </span>
            )}
            {secondaryLine && (
              <span className="text-xs text-muted-foreground truncate block mt-0.5">
                {secondaryLine}
              </span>
            )}
          </div>
          {dateLabel && (
            <span className="text-[10px] text-muted-foreground tabular-nums flex-shrink-0 mt-0.5">
              {dateLabel}
            </span>
          )}
        </div>

        {/* Row 2: Status badge */}
        {log.status && (
          <div>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-xl uppercase tracking-wide ${
                log.status === "finished"
                  ? "bg-emerald-600/20 text-emerald-300 border border-emerald-700/60"
                  : "bg-amber-600/20 text-amber-300 border border-amber-700/60"
              }`}
            >
              {log.status === "finished" ? "Done" : "In progress"}
            </span>
          </div>
        )}

        {/* Row 3: Star rating */}
        <div className="flex items-center gap-0.5 mt-auto pt-1">
          {Array.from({ length: 10 }, (_, i) => (
            <Star
              key={i}
              className="w-3 h-3 rounded-sm"
              style={{
                fill: i < log.rating ? "#5bb8e8" : "#2a2a2a",
                color: i < log.rating ? "#5bb8e8" : "#2a2a2a",
              }}
            />
          ))}
        </div>
      </div>
    </article>
  );
}

export default MediaLogCard;
