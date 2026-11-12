import { useId, useState, type KeyboardEvent } from "react";
import { ImageIcon, Link2, Loader2, X } from "lucide-react";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { cn } from "@lib/utils";
import { useDebouncedValue } from "@lib/hooks/useDebouncedValue";
import {
  MIN_SEARCH_LENGTH,
  useMetadataDetails,
  useMetadataSearch,
} from "../hooks/useMetadata";
import type { MediaLogType } from "../types/media-types";
import type {
  ExternalRef,
  MetadataCandidate,
  MetadataDetails,
} from "../types/metadata-types";

interface MetadataTitleFieldProps {
  type: MediaLogType;
  value: string;
  onChange: (title: string) => void;
  /** Called with the full details of the result the user picked. */
  onPick: (details: MetadataDetails) => void;
  /** The catalogue entry the log is currently linked to, if any. */
  linked: ExternalRef | null;
  onUnlink: () => void;
  /** Attribution, e.g. "TMDB". */
  sourceLabel: string;
  /** Enter with no highlighted suggestion submits the form. */
  onSubmit: () => void;
}

/**
 * The title input, doubling as a catalogue search.
 *
 * Typing still sets the title directly, so anything missing from the
 * catalogue can be logged by hand; picking a suggestion fills the rest of the
 * form. Searching only starts once the user types, so opening an existing log
 * for editing doesn't pop a dropdown.
 */
function MetadataTitleField({
  type,
  value,
  onChange,
  onPick,
  linked,
  onUnlink,
  sourceLabel,
  onSubmit,
}: MetadataTitleFieldProps) {
  const listId = useId();
  const [touched, setTouched] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [picking, setPicking] = useState<string | null>(null);

  const query = useDebouncedValue(value.trim(), 350);
  const { results, isFetching, isError } = useMetadataSearch(type, query, touched);
  const fetchDetails = useMetadataDetails();

  const showList = open && touched && query.length >= MIN_SEARCH_LENGTH;
  const optionId = (index: number) => `${listId}-option-${index}`;

  const pick = async (candidate: MetadataCandidate) => {
    setPicking(candidate.externalId);
    try {
      onPick(await fetchDetails(candidate.provider, candidate.externalId));
      setOpen(false);
      setTouched(false);
    } catch {
      // Toasted by the query client; the list stays open to try another.
    } finally {
      setPicking(null);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case "ArrowDown":
        if (results.length === 0) return;
        event.preventDefault();
        setOpen(true);
        setActive((index) => Math.min(index + 1, results.length - 1));
        break;
      case "ArrowUp":
        if (!showList) return;
        event.preventDefault();
        setActive((index) => Math.max(index - 1, -1));
        break;
      case "Enter": {
        event.preventDefault();
        const candidate = showList && active >= 0 ? results[active] : undefined;
        if (candidate) void pick(candidate);
        else onSubmit();
        break;
      }
      case "Escape":
        // The dialog ignores Escape while the list is open (see MediaLogModal).
        if (showList) setOpen(false);
        break;
    }
  };

  const status = (() => {
    if (isError) return "Search is unavailable right now. You can still type the title.";
    if (results.length === 0) {
      return isFetching
        ? `Searching ${sourceLabel}…`
        : "No matches. Keep typing to log it by hand.";
    }
    return null;
  })();

  return (
    <div className="space-y-1.5">
      <Label htmlFor="media-title">Title *</Label>
      <div className="relative">
        <Input
          id="media-title"
          type="text"
          role="combobox"
          autoComplete="off"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && active >= 0 ? optionId(active) : undefined}
          placeholder={`Search ${sourceLabel} or type a title`}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setTouched(true);
            setOpen(true);
            setActive(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          className="pr-8"
          autoFocus
        />
        {showList && isFetching && (
          <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {showList && (
        <div className="overflow-hidden rounded-xl border border-border bg-popover">
          {results.length > 0 && (
            <ul
              id={listId}
              role="listbox"
              aria-label={`${sourceLabel} results`}
              className={cn(
                "max-h-72 overflow-y-auto py-1 transition-opacity",
                isFetching && "opacity-60",
              )}
            >
              {results.map((candidate, index) => (
                <li
                  key={`${candidate.provider}:${candidate.externalId}`}
                  id={optionId(index)}
                  role="option"
                  aria-selected={index === active}
                  // Keep focus in the input so blur doesn't close the list first.
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => void pick(candidate)}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 px-3 py-2",
                    index === active && "bg-accent",
                  )}
                >
                  <div className="flex h-12 w-8 shrink-0 items-center justify-center overflow-hidden rounded bg-secondary">
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
                      <ImageIcon className="h-3.5 w-3.5 text-muted-foreground opacity-40" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">
                      {candidate.title}
                      {candidate.year && (
                        <span className="text-muted-foreground"> ({candidate.year})</span>
                      )}
                    </p>
                    {candidate.subtitle && (
                      <p className="truncate text-xs text-muted-foreground">
                        {candidate.subtitle}
                      </p>
                    )}
                  </div>
                  {picking === candidate.externalId && (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                  )}
                </li>
              ))}
            </ul>
          )}
          <p className="border-t border-border px-3 py-1.5 text-[11px] text-muted-foreground first:border-t-0">
            {status ?? `Results from ${sourceLabel}`}
          </p>
        </div>
      )}

      {linked && !showList && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link2 className="h-3 w-3 text-rating" />
          <span>Filled from {sourceLabel}</span>
          <button
            type="button"
            onClick={onUnlink}
            className="ml-1 flex items-center gap-0.5 rounded hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <X className="h-3 w-3" />
            Unlink
          </button>
        </div>
      )}
    </div>
  );
}

export default MetadataTitleField;
