import { useState, type KeyboardEvent } from "react";
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
import type { MediaLogFormValues } from "./media-form-values";
import {
  MEDIA_LOG_TYPES,
  MEDIA_TYPE_LABELS,
  type MediaLogStatus,
  type MediaLogType,
} from "../types/media-types";
import { configForType, type CreditField } from "../media-config";

interface MediaLogFormProps {
  values: MediaLogFormValues;
  onChange: (values: MediaLogFormValues) => void;
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
 * The media log form body, shared by the create and edit modals.
 *
 * Both modals previously carried their own ~300-line copy of these fields,
 * which is how the two drifted apart.
 */
function MediaLogForm({
  values,
  onChange,
  lockedType = false,
  onSubmit,
}: MediaLogFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const credits = configForType(values.type).credits;

  const set = <K extends keyof MediaLogFormValues>(
    key: K,
    value: MediaLogFormValues[K],
  ) => onChange({ ...values, [key]: value });

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onSubmit();
    }
  };

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

      <div className="space-y-1.5">
        <Label htmlFor="media-title">Title *</Label>
        <Input
          id="media-title"
          type="text"
          placeholder="Title"
          value={values.title}
          onChange={(event) => set("title", event.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      </div>

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
          {showAdvanced ? "Hide advanced options" : "Show advanced options"}
        </CollapsibleTrigger>

        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
          <div className="space-y-4 pt-4">
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

            {credits.length > 0 && (
              <div
                className={cn(
                  "gap-3",
                  credits.length > 1 ? "grid grid-cols-2" : "space-y-1.5",
                )}
              >
                {credits.map((credit) => (
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

            <CoverImageInput
              value={values.cover}
              onChange={(cover) => set("cover", cover)}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export default MediaLogForm;
