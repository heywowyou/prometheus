import type { Dispatch, KeyboardEvent, SetStateAction } from "react";
import { Link2, Search, X } from "lucide-react";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Textarea } from "@components/ui/textarea";
import { StarRating } from "@components/ui/star-rating";
import { dateToParts } from "@lib/date/date-parts";
import { cn } from "@lib/utils";
import CoverImageInput from "./CoverImageInput";
import DateFieldInput from "./DateFieldInput";
import type { MediaLogFormValues } from "./media-form-values";
import { MEDIA_LOG_STATUSES } from "../types/media-types";
import { STATUS_META } from "../media-status";
import { configForType, type CreditField } from "../media-config";

interface MediaLogFormProps {
  values: MediaLogFormValues;
  onChange: Dispatch<SetStateAction<MediaLogFormValues>>;
  /** Opens the catalogue search (to fill in or re-link this log). */
  onSearch: () => void;
  onSubmit: () => void;
}

const CREDIT_LABELS: Record<CreditField, string> = {
  director: "Director",
  author: "Author",
  pages: "Pages",
  artist: "Artist",
};

const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return dateToParts(date);
};

const sameParts = (a: MediaLogFormValues["date"], b: MediaLogFormValues["date"]) =>
  Number(a.day) === Number(b.day) && Number(a.month) === Number(b.month) && a.year === b.year;

/**
 * The media log form: cover on the left, everything else on the right (stacked
 * on phones). Shared by create and edit.
 */
function MediaLogForm({ values, onChange, onSearch, onSubmit }: MediaLogFormProps) {
  const config = configForType(values.type);
  const status = STATUS_META[values.status];

  const set = <K extends keyof MediaLogFormValues>(key: K, value: MediaLogFormValues[K]) =>
    onChange((previous) => ({ ...previous, [key]: value }));

  const submitOnEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onSubmit();
    }
  };

  const today = daysAgo(0);
  const yesterday = daysAgo(1);

  return (
    <div className="grid gap-5 py-1 sm:grid-cols-[168px_1fr]">
      <div className="mx-auto w-36 sm:w-full">
        <CoverImageInput
          value={values.cover}
          onChange={(cover) => set("cover", cover)}
          coverAspect={config.coverAspect}
        />
      </div>

      <div className="min-w-0 space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="media-title">Title</Label>
            <button
              type="button"
              onClick={onSearch}
              className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <Search className="h-3 w-3" />
              Search {config.metadataSource}
            </button>
          </div>
          <Input
            id="media-title"
            value={values.title}
            onChange={(event) => set("title", event.target.value)}
            onKeyDown={submitOnEnter}
            placeholder={`${config.singular[0]?.toUpperCase()}${config.singular.slice(1)} title`}
            autoFocus={!values.title}
          />
          {values.external && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Link2 className="h-3 w-3 text-rating" />
              Linked to {config.metadataSource}
              <button
                type="button"
                onClick={() => set("external", null)}
                className="ml-1 flex items-center gap-0.5 hover:text-foreground"
              >
                <X className="h-3 w-3" />
                Unlink
              </button>
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Status</Label>
          <div role="radiogroup" aria-label="Status" className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {MEDIA_LOG_STATUSES.map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={values.status === value}
                onClick={() => set("status", value)}
                className={cn(
                  "rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  values.status === value
                    ? STATUS_META[value].badge
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {STATUS_META[value].label}
              </button>
            ))}
          </div>
        </div>

        {status.rated && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Rating</Label>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                {values.rating !== null ? (
                  <>
                    <span className="text-sm font-semibold tabular-nums text-rating">
                      {values.rating}/10
                    </span>
                    <button type="button" onClick={() => set("rating", null)} className="hover:text-foreground">
                      Clear
                    </button>
                  </>
                ) : (
                  "Not rated"
                )}
              </span>
            </div>
            <StarRating value={values.rating ?? 0} onChange={(rating) => set("rating", rating)} />
          </div>
        )}

        <div className="space-y-1.5">
          <DateFieldInput
            label={`${status.dateLabel} on`}
            value={values.date}
            onChange={(date) => set("date", date)}
          />
          <div className="flex gap-1.5">
            {[
              { label: "Today", parts: today },
              { label: "Yesterday", parts: yesterday },
            ].map(({ label, parts }) => (
              <button
                key={label}
                type="button"
                onClick={() => set("date", parts)}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-xs transition-colors",
                  sameParts(values.date, parts)
                    ? "border-rating bg-rating/10 text-rating"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {config.credits.map((credit) => (
            <div key={credit} className="space-y-1.5">
              <Label htmlFor={`media-${credit}`}>{CREDIT_LABELS[credit]}</Label>
              <Input
                id={`media-${credit}`}
                type={credit === "pages" ? "number" : "text"}
                inputMode={credit === "pages" ? "numeric" : undefined}
                min={credit === "pages" ? 1 : undefined}
                value={values[credit]}
                onChange={(event) => set(credit, event.target.value)}
                onKeyDown={submitOnEnter}
              />
            </div>
          ))}
          <div className="space-y-1.5">
            <Label htmlFor="media-release-year">Released</Label>
            <Input
              id="media-release-year"
              inputMode="numeric"
              maxLength={4}
              placeholder="YYYY"
              value={values.releaseYear}
              onChange={(event) => set("releaseYear", event.target.value.replace(/\D/g, ""))}
              onKeyDown={submitOnEnter}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="media-review">Review</Label>
          <Textarea
            id="media-review"
            placeholder="What did you think?"
            rows={3}
            value={values.review}
            onChange={(event) => set("review", event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="media-url">Link</Label>
          <Input
            id="media-url"
            type="url"
            placeholder="https://…"
            value={values.url}
            onChange={(event) => set("url", event.target.value)}
            onKeyDown={submitOnEnter}
          />
        </div>
      </div>
    </div>
  );
}

export default MediaLogForm;
