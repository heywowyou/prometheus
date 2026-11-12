import { useState } from "react";
import { ImageIcon, Loader2, PenLine, Search } from "lucide-react";
import { cn } from "@lib/utils";
import { useDebouncedValue } from "@lib/hooks/useDebouncedValue";
import {
  MIN_SEARCH_LENGTH,
  useMetadataDetails,
  useMetadataSearch,
} from "../hooks/useMetadata";
import type { MediaTypeConfig } from "../media-config";
import type { MetadataCandidate, MetadataDetails } from "../types/metadata-types";

interface MetadataSearchStepProps {
  config: MediaTypeConfig;
  /** Pre-filled query, e.g. the current title when re-linking. */
  initialQuery?: string;
  onPick: (details: MetadataDetails) => void;
  /** Skip the catalogue; the query (if any) becomes the title. */
  onManual: (title: string) => void;
}

/**
 * Step one of logging: search the type's catalogue and pick a cover from a
 * grid. Enter picks the top result.
 */
function MetadataSearchStep({ config, initialQuery = "", onPick, onManual }: MetadataSearchStepProps) {
  const [query, setQuery] = useState(initialQuery);
  const [picking, setPicking] = useState<string | null>(null);

  const debounced = useDebouncedValue(query.trim(), 300);
  const { results, isFetching, isError } = useMetadataSearch(config.type, debounced, true);
  const fetchDetails = useMetadataDetails();

  const searching = debounced.length >= MIN_SEARCH_LENGTH;
  const showResults = searching && results.length > 0;

  const pick = async (candidate: MetadataCandidate) => {
    if (picking) return;
    setPicking(candidate.externalId);
    try {
      onPick(await fetchDetails(candidate.provider, candidate.externalId));
    } catch {
      // Toasted by the query client; stay on the grid to try another.
    } finally {
      setPicking(null);
    }
  };

  return (
    <div className="space-y-4">
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
            const top = showResults ? results[0] : undefined;
            if (top) void pick(top);
            else if (query.trim()) onManual(query.trim());
          }}
          placeholder={`Search ${config.metadataSource} for a ${config.singular}…`}
          aria-label={`Search ${config.metadataSource}`}
          className="h-11 w-full rounded-xl border border-border bg-secondary pl-10 pr-10 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
        />
        {isFetching && searching && (
          <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      <div className="min-h-[240px]">
        {!searching ? (
          <p className="pt-16 text-center text-sm text-muted-foreground">
            Type a title to search {config.metadataSource}.
          </p>
        ) : isError ? (
          <p className="pt-16 text-center text-sm text-muted-foreground">
            {config.metadataSource} search is unavailable right now.
          </p>
        ) : !showResults ? (
          <p className="pt-16 text-center text-sm text-muted-foreground">
            {isFetching ? "Searching…" : `No ${config.metadataSource} results for “${debounced}”.`}
          </p>
        ) : (
          <ul
            className={cn(
              "grid max-h-[50vh] grid-cols-3 gap-3 overflow-y-auto pr-1 sm:grid-cols-4",
              isFetching && "opacity-60",
            )}
          >
            {results.map((candidate, index) => (
              <li key={`${candidate.provider}:${candidate.externalId}`}>
                <button
                  type="button"
                  onClick={() => void pick(candidate)}
                  disabled={picking !== null}
                  className="group w-full text-left focus-visible:outline-none"
                >
                  <div
                    className={cn(
                      config.coverAspect,
                      "relative flex w-full items-center justify-center overflow-hidden rounded-lg border bg-secondary transition-colors group-hover:border-rating group-focus-visible:border-rating",
                      index === 0 ? "border-rating/60" : "border-border",
                    )}
                  >
                    {candidate.thumbnailUrl ? (
                      <img
                        src={candidate.thumbnailUrl}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-muted-foreground opacity-30" />
                    )}
                    {picking === candidate.externalId && (
                      <div className="absolute inset-0 flex items-center justify-center bg-overlay/60">
                        <Loader2 className="h-5 w-5 animate-spin text-foreground" />
                      </div>
                    )}
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-xs font-medium leading-tight text-foreground">
                    {candidate.title}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {[candidate.year, candidate.subtitle].filter(Boolean).join(" · ") || " "}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3">
        <p className="text-[11px] text-muted-foreground">
          {showResults ? `Results from ${config.metadataSource} · Enter picks the first` : " "}
        </p>
        <button
          type="button"
          onClick={() => onManual(query.trim())}
          className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <PenLine className="h-3.5 w-3.5" />
          Enter details manually
        </button>
      </div>
    </div>
  );
}

export default MetadataSearchStep;
