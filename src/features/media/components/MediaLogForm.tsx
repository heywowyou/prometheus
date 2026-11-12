import { useState, type Dispatch, type SetStateAction } from "react";
import { ChevronDown } from "lucide-react";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Textarea } from "@components/ui/textarea";
import { StarRating } from "@components/ui/star-rating";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { cn } from "@lib/utils";
import CoverImageInput from "./CoverImageInput";
import DateFieldInput from "./DateFieldInput";
import MetadataTitleField from "./MetadataTitleField";
import type { MediaLogFormValues } from "./media-form-values";
import {
  MEDIA_LOG_TYPES,
  MEDIA_TYPE_LABELS,
  type MediaLogStatus,
  type MediaLogType,
} from "../types/media-types";
import type { MetadataDetails } from "../types/metadata-types";
import { configForType, type CreditField } from "../media-config";

interface MediaLogFormProps {
  values: MediaLogFormValues;
  onChange: Dispatch<SetStateAction<MediaLogFormValues>>;
  /** When true, the type is fixed and shown as read-only text. */
  lockedType?: boolean;
  onSubmit: () => void;
}

const CREDIT_LABELS: Record<CreditField, string> = {
  director: "Director",
  author: "Author",
  pages: "Pages",
  artist: "Artist",
};

/**
 * Overlays catalogue details onto the form. Only fields the catalogue knows
 * are replaced, so a rating, date or review already entered is kept.
 */
const applyDetails = (
  values: MediaLogFormValues,
  details: MetadataDetails,
): MediaLogFormValues => ({
  ...values,
  title: details.title,
  releaseYear: details.year ? String(details.year) : values.releaseYear,
  url: details.url ?? values.url,
  cover: details.coverUrl
    ? { url: details.coverUrl, source: "external" }
    : values.cover,
  director: details.credits.director ?? values.director,
  author: details.credits.author ?? values.author,
  pages: details.credits.pages ? String(details.credits.pages) : values.pages,
  artist: details.credits.artist ?? values.artist,
  external: { provider: details.provider, id: details.externalId },
});

/** The media log form body, shared by the create and edit modals. */
function MediaLogForm({
  values,
  onChange,
  lockedType = false,
  onSubmit,
}: MediaLogFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const config = configForType(values.type);

  // Functional updates: a picked search result lands asynchronously and must
  // not overwrite keystrokes made while its details were loading.
  const set = <K extends keyof MediaLogFormValues>(
    key: K,
    value: MediaLogFormValues[K],
  ) => onChange((previous) => ({ ...previous, [key]: value }));

  return (
    <div className="space-y-4 py-2">
      <div className="space-y-1.5">
        <Label>Type</Label>
        {lockedType ? (
          <div className="flex h-9 w-full items-center rounded-xl border border-border bg-secondary px-3 text-sm text-muted-foreground">
            {MEDIA_TYPE_LABELS[values.type]}
          </div>
        ) : (
          <Select
            value={values.type}
            onValueChange={(value) => set("type", value as MediaLogType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MEDIA_LOG_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {MEDIA_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <MetadataTitleField
        type={values.type}
        value={values.title}
        onChange={(title) => set("title", title)}
        onPick={(details) => onChange((previous) => applyDetails(previous, details))}
        linked={values.external}
        onUnlink={() => set("external", null)}
        sourceLabel={config.metadataSource}
        onSubmit={onSubmit}
      />

      <CoverImageInput
        value={values.cover}
        onChange={(cover) => set("cover", cover)}
        coverAspect={config.coverAspect}
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Rating</Label>
          <span className="text-sm font-semibold tabular-nums text-rating">
            {values.rating}/10
          </span>
        </div>
        <StarRating value={values.rating} onChange={(v) => set("rating", v)} />
      </div>

      <DateFieldInput value={values.date} onChange={(v) => set("date", v)} />

      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
          <ChevronDown
            className={cn(
              "h-3 w-3 transition-transform",
              showAdvanced && "rotate-180",
            )}
          />
          {showAdvanced ? "Hide details" : "More details"}
        </CollapsibleTrigger>

        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={values.status}
                  onValueChange={(value) => set("status", value as MediaLogStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="finished">Finished</SelectItem>
                    <SelectItem value="in_progress">In progress</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="media-release-year">Release year</Label>
                <Input
                  id="media-release-year"
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="YYYY"
                  value={values.releaseYear}
                  onChange={(event) =>
                    set("releaseYear", event.target.value.replace(/\D/g, ""))
                  }
                />
              </div>
            </div>

            {config.credits.length > 0 && (
              <div
                className={cn(
                  "gap-3",
                  config.credits.length > 1 ? "grid grid-cols-2" : "space-y-1.5",
                )}
              >
                {config.credits.map((credit) => (
                  <div key={credit} className="space-y-1.5">
                    <Label htmlFor={`media-${credit}`}>
                      {CREDIT_LABELS[credit]}
                    </Label>
                    <Input
                      id={`media-${credit}`}
                      type={credit === "pages" ? "number" : "text"}
                      min={credit === "pages" ? 1 : undefined}
                      value={values[credit]}
                      onChange={(event) => set(credit, event.target.value)}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="media-review">Review</Label>
              <Textarea
                id="media-review"
                placeholder="What did you think?"
                value={values.review}
                onChange={(event) => set("review", event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="media-url">URL</Label>
              <Input
                id="media-url"
                type="url"
                placeholder="https://..."
                value={values.url}
                onChange={(event) => set("url", event.target.value)}
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export default MediaLogForm;
