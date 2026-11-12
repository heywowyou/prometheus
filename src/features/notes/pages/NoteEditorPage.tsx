import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, AlertCircle } from "lucide-react";
import type { Content } from "@tiptap/react";
import { Button } from "@components/ui/button";
import { MinimalTiptapEditor } from "@components/ui/minimal-tiptap";
import PageLoader from "@components/feedback/PageLoader";
import { useDebouncedSave, type SaveStatus } from "@lib/hooks/useDebouncedSave";
import { useUploadApi } from "@features/media/api/upload-api";
import { cn } from "@lib/utils";
import { useNote } from "../hooks/useNotes";
import type {
  Note,
  NoteFontFamily,
  UpdateNotePayload,
} from "../types/note-types";

function SaveIndicator({
  status,
  onRetry,
}: {
  status: SaveStatus;
  onRetry: () => void;
}) {
  switch (status) {
    case "pending":
    case "saving":
      return <span>Saving…</span>;
    case "saved":
      return (
        <>
          <Check className="h-3.5 w-3.5" />
          <span>Saved</span>
        </>
      );
    case "error":
      return (
        <button
          type="button"
          onClick={onRetry}
          title="Your changes are kept and retried automatically"
          className="flex items-center gap-1 text-destructive hover:underline"
        >
          <AlertCircle className="h-3.5 w-3.5" />
          Not saved · retry now
        </button>
      );
    default:
      return null;
  }
}

interface EditorProps {
  note: Note;
  save: (payload: UpdateNotePayload) => Promise<unknown>;
  onBack: () => void;
}

/** Keyed on the note id by the route component, so state seeds from the note. */
function NoteEditor({ note, save, onBack }: EditorProps) {
  const { uploadCover } = useUploadApi();
  const [title, setTitle] = useState(note.title);
  const [fontFamily, setFontFamily] = useState<NoteFontFamily>(
    note.fontFamily ?? "sans",
  );

  const { status, schedule, flush } = useDebouncedSave<UpdateNotePayload>({
    save,
  });

  const uploadImage = useCallback(
    async (file: File): Promise<string> => (await uploadCover(file)).url,
    [uploadCover],
  );

  const handleEditorChange = useCallback(
    (value: Content) => schedule({ content: String(value ?? "") }),
    [schedule],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
          Notes
        </Button>
        <div className="flex min-w-[70px] items-center justify-end gap-1.5 text-xs text-muted-foreground">
          <SaveIndicator status={status} onRetry={() => void flush()} />
        </div>
      </div>

      <input
        type="text"
        value={title}
        onChange={(event) => {
          setTitle(event.target.value);
          schedule({ title: event.target.value });
        }}
        placeholder="Untitled"
        aria-label="Note title"
        className="mb-4 w-full border-none bg-transparent text-2xl font-semibold text-foreground outline-none placeholder:text-muted-foreground"
      />

      <MinimalTiptapEditor
        value={note.content || ""}
        onChange={handleEditorChange}
        uploader={uploadImage}
        output="html"
        placeholder="Start writing…"
        className="min-h-0 flex-1"
        editorContentClassName={cn(
          "overflow-y-auto p-4",
          fontFamily === "serif" ? "font-serif" : "font-sans",
        )}
        fontFamily={fontFamily}
        onFontFamilyChange={(value: NoteFontFamily) => {
          setFontFamily(value);
          schedule({ fontFamily: value });
        }}
      />
    </div>
  );
}

function NoteEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { note, loading, error, save } = useNote(id);

  // A note that can't be loaded (deleted, or not ours) sends us back.
  useEffect(() => {
    if (error) navigate("/notes", { replace: true });
  }, [error, navigate]);

  if (loading) return <PageLoader label="Loading note…" />;
  if (!note) return null;

  return (
    <NoteEditor
      key={note._id}
      note={note}
      save={save}
      onBack={() => navigate("/notes")}
    />
  );
}

export default NoteEditorPage;
