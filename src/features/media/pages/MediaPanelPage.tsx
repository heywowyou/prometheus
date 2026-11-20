import { useMemo, useState } from "react";
import { Grid2x2, Grid3x3, Heart, ImageOff, Plus, Search, X } from "lucide-react";
import { Button } from "@components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import EmptyState from "@components/feedback/EmptyState";
import ConfirmDialog from "@components/feedback/ConfirmDialog";
import { useLocalStorage } from "@lib/hooks/useLocalStorage";
import { cn } from "@lib/utils";
import { useMediaLogs } from "../hooks/useMediaLogs";
import MediaLogCard, { type CardDensity } from "../components/MediaLogCard";
import MediaLogModal from "../components/MediaLogModal";
import MediaLogDetail from "../components/MediaLogDetail";
import { MEDIA_LOG_STATUSES, type MediaLog } from "../types/media-types";
import type { MediaTypeConfig } from "../media-config";
import { STATUS_META } from "../media-status";
import {
  SORT_OPTIONS,
  applyMediaFilters,
  computeMediaStats,
  isSortKey,
  type SortKey,
  type StatusFilter,
} from "../media-filters";

interface MediaPanelPageProps {
  config: MediaTypeConfig;
}

const isDensity = (value: unknown): value is CardDensity =>
  value === "comfortable" || value === "compact";

const GRID: Record<CardDensity, string> = {
  comfortable: "grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-5 md:grid-cols-4 lg:grid-cols-5",
  compact: "grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8",
};

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium transition-colors",
        active
          ? "border-rating bg-rating/10 text-rating"
          : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

/** One panel of the media log (movies, books, …), driven by `config`. */
function MediaPanel({ config }: MediaPanelPageProps) {
  const { logs, loading, createLog, updateLog, deleteLog, toggleFavorite } =
    useMediaLogs(config.type);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [missingCover, setMissingCover] = useState(false);
  const [sort, setSort] = useLocalStorage<SortKey>("media-sort", "recent", isSortKey);
  const [density, setDensity] = useLocalStorage<CardDensity>(
    "media-density",
    "comfortable",
    isDensity,
  );

  const [addOpen, setAddOpen] = useState(false);
  const [editLog, setEditLog] = useState<MediaLog | null>(null);
  // An id, not a copy, so the detail view reflects cache updates (favorites).
  const [openId, setOpenId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<MediaLog | null>(null);
  const [now] = useState(() => new Date());

  const stats = useMemo(() => computeMediaStats(logs, now), [logs, now]);
  const visible = useMemo(
    () => applyMediaFilters(logs, { query, status, favoritesOnly, missingCover, sort }),
    [logs, query, status, favoritesOnly, missingCover, sort],
  );
  const openLog = logs.find((log) => log._id === openId) ?? null;
  const filtering = query.trim() !== "" || status !== "all" || favoritesOnly || missingCover;

  const clearFilters = () => {
    setQuery("");
    setStatus("all");
    setFavoritesOnly(false);
    setMissingCover(false);
  };

  const statsLine = [
    `${stats.total} logged`,
    stats.thisYear ? `${stats.thisYear} finished in ${now.getFullYear()}` : null,
    stats.averageRating ? `★ ${stats.averageRating.toFixed(1)} average` : null,
    config.type === "book" && stats.pagesThisYear
      ? `${stats.pagesThisYear.toLocaleString()} pages this year`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="section-title sm:text-[2rem]">{config.plural}</h2>
          {!loading && stats.total > 0 && (
            <p className="mt-1.5 text-[13px] text-muted-foreground">{statsLine}</p>
          )}
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Add {config.singular}
        </Button>
      </div>

      {stats.total > 0 && (
        <div className="mb-8 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[12rem] flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Search ${config.plural.toLowerCase()}`}
                aria-label={`Search ${config.plural.toLowerCase()}`}
                className="h-10 w-full rounded-full border border-border bg-card pl-9 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <Select value={sort} onValueChange={(value) => isSortKey(value) && setSort(value)}>
              <SelectTrigger className="h-10 w-[170px] rounded-full bg-card" aria-label="Sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-0.5 rounded-full border border-border bg-card p-1">
              {(
                [
                  ["comfortable", Grid2x2, "Large covers"],
                  ["compact", Grid3x3, "Small covers"],
                ] as const
              ).map(([value, Icon, label]) => (
                <button
                  key={value}
                  type="button"
                  title={label}
                  aria-label={label}
                  aria-pressed={density === value}
                  onClick={() => setDensity(value)}
                  className={cn(
                    "rounded-full p-1.5",
                    density === value
                      ? "bg-raised text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            <Chip active={status === "all"} onClick={() => setStatus("all")}>
              All <span className="opacity-60">{stats.total}</span>
            </Chip>
            {MEDIA_LOG_STATUSES.filter((value) => stats.byStatus[value] > 0).map((value) => (
              <Chip
                key={value}
                active={status === value}
                onClick={() => setStatus(status === value ? "all" : value)}
              >
                {STATUS_META[value].label}
                <span className="opacity-60">{stats.byStatus[value]}</span>
              </Chip>
            ))}
            <span className="mx-1 w-px shrink-0 self-stretch bg-border" aria-hidden />
            <Chip active={favoritesOnly} onClick={() => setFavoritesOnly((on) => !on)}>
              <Heart className={cn("h-3 w-3", favoritesOnly && "fill-rating")} />
              Favorites
            </Chip>
            {stats.missingCovers > 0 && (
              <Chip active={missingCover} onClick={() => setMissingCover((on) => !on)}>
                <ImageOff className="h-3 w-3" />
                No cover <span className="opacity-60">{stats.missingCovers}</span>
              </Chip>
            )}
            {filtering && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex shrink-0 items-center gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className={cn("grid", GRID[density])}>
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index}>
              <div className={cn(config.coverAspect, "w-full animate-pulse rounded-2xl bg-card")} />
              {density === "comfortable" && (
                <div className="mt-3 h-4 w-3/4 animate-pulse rounded-full bg-card" />
              )}
            </div>
          ))}
        </div>
      ) : stats.total === 0 ? (
        <EmptyState
          icon={config.icon}
          message={`No ${config.plural.toLowerCase()} logged yet.`}
          action={{ label: `Log your first ${config.singular}`, onClick: () => setAddOpen(true) }}
        />
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border py-16 text-center">
          <p className="font-serif text-xl text-soft">Nothing matches these filters.</p>
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      ) : (
        <>
          {filtering && (
            <p className="mb-3 text-xs text-muted-foreground">
              {visible.length} of {stats.total}
            </p>
          )}
          <div className={cn("grid", GRID[density])}>
            {visible.map((log) => (
              <MediaLogCard
                key={log._id}
                log={log}
                coverAspect={config.coverAspect}
                density={density}
                onOpen={(target) => setOpenId(target._id)}
                onToggleFavorite={toggleFavorite}
                onEdit={setEditLog}
                onDelete={setPendingDelete}
              />
            ))}
          </div>
        </>
      )}

      <MediaLogDetail
        log={openLog}
        onClose={() => setOpenId(null)}
        onEdit={(log) => {
          setOpenId(null);
          setEditLog(log);
        }}
        onDelete={(log) => {
          setOpenId(null);
          setPendingDelete(log);
        }}
        onToggleFavorite={toggleFavorite}
        onChangeCover={(id, url) => updateLog(id, { cover: { url, source: "external" } })}
      />
      <MediaLogModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        presetType={config.type}
        onCreate={createLog}
      />
      <MediaLogModal
        isOpen={editLog !== null}
        onClose={() => setEditLog(null)}
        log={editLog}
        onUpdate={updateLog}
      />
      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) deleteLog(pendingDelete._id);
          setPendingDelete(null);
        }}
        title={`Delete “${pendingDelete?.title ?? ""}”?`}
        description="The log and its stored cover are removed for good."
      />
    </>
  );
}

/**
 * Keyed on the type so switching tabs (movies → books) starts with fresh
 * search and filters instead of carrying the last panel's over.
 */
function MediaPanelPage({ config }: MediaPanelPageProps) {
  return <MediaPanel key={config.type} config={config} />;
}

export default MediaPanelPage;
