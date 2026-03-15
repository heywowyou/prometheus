import type { MediaLog } from "../types/media-types";
import { MEDIA_TYPE_LABELS } from "../types/media-types";

interface MediaLogCardProps {
  log: MediaLog;
  onDelete?: (id: string) => void;
}

function MediaLogCard({ log, onDelete }: MediaLogCardProps) {
  const displayTitle = log.title;
  const typeLabel = MEDIA_TYPE_LABELS[log.type];
  const coverUrl = log.cover || null;
  const linkUrl = log.url || null;

  return (
    <article className="bg-gray-800/80 rounded-xl border border-gray-700 overflow-hidden hover:border-gray-600 transition-colors">
      <div className="flex">
        <div className="w-24 min-h-[120px] flex-shrink-0 bg-gray-900 flex items-center justify-center">
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
            <span className="text-gray-600 text-3xl">◆</span>
          )}
        </div>
        <div className="flex-1 p-4 flex flex-col min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              {linkUrl ? (
                <a
                  href={linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-gray-100 hover:text-cyan-400 truncate block"
                >
                  {displayTitle}
                </a>
              ) : (
                <span className="font-semibold text-gray-100 truncate block">
                  {displayTitle}
                </span>
              )}
              <span className="text-xs text-gray-500 uppercase tracking-wider">
                {typeLabel}
              </span>
            </div>
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(log._id)}
                className="text-gray-500 hover:text-red-400 p-1 rounded transition-colors flex-shrink-0"
                aria-label="Delete"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}
          </div>
          <div className="mt-auto pt-2 flex items-center gap-1">
            <span className="text-cyan-400 font-semibold tabular-nums">
              {log.rating}/10
            </span>
            <span className="text-gray-500 text-sm">★</span>
          </div>
        </div>
      </div>
    </article>
  );
}

export default MediaLogCard;
