import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@components/ui/dialog";
import { Button } from "@components/ui/button";
import { partsToIso } from "@lib/date/date-parts";
import MediaLogForm from "./MediaLogForm";
import {
  initialFormValues,
  type MediaLogFormValues,
} from "./media-form-values";
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
  /** Fixes the type when creating from a specific panel. */
  presetType?: MediaLogType;
  onCreate?: (payload: CreateMediaLogPayload) => Promise<unknown>;
  onUpdate?: (id: string, payload: UpdateMediaLogPayload) => Promise<unknown>;
}

const optional = (value: string): string | undefined => value.trim() || undefined;

const toPayload = (values: MediaLogFormValues, date: string) => ({
  title: values.title.trim(),
  rating: values.rating,
  date,
  status: values.status,
  url: optional(values.url),
  review: optional(values.review),
  director: optional(values.director),
  author: optional(values.author),
  pages: values.pages.trim() ? Number(values.pages) : undefined,
  artist: optional(values.artist),
});

const releaseYear = (values: MediaLogFormValues): number | null =>
  values.releaseYear.trim() ? Number(values.releaseYear) : null;

/** True when Escape was pressed inside an open autocomplete list. */
const isInOpenCombobox = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  target.getAttribute("role") === "combobox" &&
  target.getAttribute("aria-expanded") === "true";

type BodyProps = Omit<MediaLogModalProps, "isOpen">;

/**
 * Mounted only while the dialog is open, and keyed on the log being edited, so
 * its state is seeded from props on mount instead of reset by an effect.
 */
function MediaLogModalBody({
  onClose,
  log = null,
  presetType,
  onCreate,
  onUpdate,
}: BodyProps) {
  const isEdit = log !== null;
  const [values, setValues] = useState<MediaLogFormValues>(() =>
    initialFormValues(log, presetType),
  );
  const [submitting, setSubmitting] = useState(false);

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
          ...toPayload(values, date),
          cover: values.cover,
          releaseYear: releaseYear(values),
          external: values.external,
        });
      } else if (onCreate) {
        await onCreate({
          ...toPayload(values, date),
          type: values.type,
          cover: values.cover ?? undefined,
          releaseYear: releaseYear(values) ?? undefined,
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

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit log" : "Log something"}</DialogTitle>
      </DialogHeader>

      <MediaLogForm
        values={values}
        onChange={setValues}
        lockedType={isEdit || presetType !== undefined}
        onSubmit={() => void handleSubmit()}
      />

      <DialogFooter>
        <Button variant="ghost" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={() => void handleSubmit()}
          disabled={!values.title.trim() || submitting}
        >
          {submitting
            ? isEdit
              ? "Saving…"
              : "Adding…"
            : isEdit
              ? "Save changes"
              : "Add log"}
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
      <DialogContent
        className="max-h-[90vh] max-w-md overflow-y-auto"
        // Escape in the title search closes its suggestions, not the form.
        onEscapeKeyDown={(event) => {
          if (isInOpenCombobox(event.target)) event.preventDefault();
        }}
      >
        {isOpen && (
          <MediaLogModalBody key={rest.log?._id ?? "new"} {...rest} />
        )}
      </DialogContent>
    </Dialog>
  );
}

export default MediaLogModal;
