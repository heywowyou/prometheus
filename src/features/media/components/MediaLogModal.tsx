import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import { Button } from "@components/ui/button";
import { partsToIso } from "@lib/date/date-parts";
import MediaLogForm from "./MediaLogForm";
import MetadataSearchStep from "./MetadataSearchStep";
import {
  applyDetails,
  initialFormValues,
  type MediaLogFormValues,
} from "./media-form-values";
import { configForType } from "../media-config";
import { STATUS_META } from "../media-status";
import type { MediaLog, MediaLogType } from "../types/media-types";
import type {
  CreateMediaLogPayload,
  UpdateMediaLogPayload,
} from "../api/media-api";

interface MediaLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pass a log to edit it; omit to create a new one. */
  log?: MediaLog | null;
  /** The panel's type, used when creating. */
  presetType?: MediaLogType;
  onCreate?: (payload: CreateMediaLogPayload) => Promise<unknown>;
  onUpdate?: (id: string, payload: UpdateMediaLogPayload) => Promise<unknown>;
}

const optional = (value: string): string | undefined => value.trim() || undefined;

/** Fields shared by create and update. Nullable ones are finished per mode. */
const basePayload = (values: MediaLogFormValues, date: string) => ({
  title: values.title.trim(),
  date,
  status: values.status,
  url: optional(values.url),
  review: optional(values.review),
  director: optional(values.director),
  author: optional(values.author),
  pages: values.pages.trim() ? Number(values.pages) : undefined,
  artist: optional(values.artist),
});

/** A planned title has no rating yet, whatever the stars said before. */
const ratingOf = (values: MediaLogFormValues): number | null =>
  STATUS_META[values.status].rated ? values.rating : null;

const releaseYearOf = (values: MediaLogFormValues): number | null =>
  values.releaseYear.trim() ? Number(values.releaseYear) : null;

type Step = "search" | "details";
type BodyProps = Omit<MediaLogModalProps, "isOpen">;

/**
 * Mounted only while open, and keyed on the log, so state seeds from props on
 * mount. New logs start at the catalogue search; edits go straight to the form
 * (with a way back to the search to re-link or fetch a missing cover).
 */
function MediaLogModalBody({ onClose, log = null, presetType, onCreate, onUpdate }: BodyProps) {
  const isEdit = log !== null;
  const [values, setValues] = useState<MediaLogFormValues>(() =>
    initialFormValues(log, presetType),
  );
  const [step, setStep] = useState<Step>(isEdit ? "details" : "search");
  const [submitting, setSubmitting] = useState(false);

  const config = configForType(values.type);

  const handleSubmit = async () => {
    if (!values.title.trim() || submitting) return;

    const date = partsToIso(values.date);
    if (!date) {
      toast.error("Enter a valid date as DD / MM / YYYY");
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit && onUpdate) {
        await onUpdate(log._id, {
          ...basePayload(values, date),
          rating: ratingOf(values),
          cover: values.cover,
          releaseYear: releaseYearOf(values),
          external: values.external,
        });
      } else if (onCreate) {
        await onCreate({
          ...basePayload(values, date),
          type: values.type,
          rating: ratingOf(values) ?? undefined,
          cover: values.cover ?? undefined,
          releaseYear: releaseYearOf(values) ?? undefined,
          external: values.external ?? undefined,
        });
      }
      onClose();
    } catch {
      // Already toasted by the query client; stay open so nothing is lost.
    } finally {
      setSubmitting(false);
    }
  };

  if (step === "search") {
    return (
      <>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEdit && (
              <button
                type="button"
                onClick={() => setStep("details")}
                aria-label="Back to the form"
                className="rounded-md p-0.5 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            {isEdit ? `Find “${log.title}”` : `Log a ${config.singular}`}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Pick the right ${config.metadataSource} entry to refresh the cover and details. Your rating, dates and review are kept.`
              : `Pick it from ${config.metadataSource} to fill in the cover and details.`}
          </DialogDescription>
        </DialogHeader>
        <MetadataSearchStep
          config={config}
          initialQuery={isEdit ? log.title : ""}
          onPick={(details) => {
            setValues((previous) => applyDetails(previous, details));
            setStep("details");
          }}
          onManual={(title) => {
            if (title) setValues((previous) => ({ ...previous, title }));
            setStep("details");
          }}
        />
      </>
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {!isEdit && (
            <button
              type="button"
              onClick={() => setStep("search")}
              aria-label="Back to search"
              className="rounded-md p-0.5 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          {isEdit ? `Edit ${config.singular}` : `Log a ${config.singular}`}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Title, status, rating, date and details for this {config.singular}.
        </DialogDescription>
      </DialogHeader>

      <MediaLogForm
        values={values}
        onChange={setValues}
        onSearch={() => setStep("search")}
        onSubmit={() => void handleSubmit()}
      />

      <DialogFooter className="gap-2 sm:gap-0">
        <Button variant="ghost" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={() => void handleSubmit()} disabled={!values.title.trim() || submitting}>
          {submitting ? "Saving…" : isEdit ? "Save changes" : `Add ${config.singular}`}
        </Button>
      </DialogFooter>
    </>
  );
}

/**
 * One modal for both creating and editing a media log.
 *
 * Cover storage is the API's job: it imports external covers on save and
 * deletes replaced Cloudinary assets, so a cancelled or failed save can't
 * orphan an image.
 */
function MediaLogModal({ isOpen, ...rest }: MediaLogModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && rest.onClose()}>
      <DialogContent className="max-h-[92dvh] max-w-2xl overflow-y-auto">
        {isOpen && <MediaLogModalBody key={rest.log?._id ?? "new"} {...rest} />}
      </DialogContent>
    </Dialog>
  );
}

export default MediaLogModal;
