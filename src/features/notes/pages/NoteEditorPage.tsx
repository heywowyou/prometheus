import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  MoreHorizontal,
  RotateCcw,
} from "lucide-react";
import type { Content } from "@tiptap/react";
import { toast } from "sonner";
import { Button } from "@components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import { MinimalTiptapEditor } from "@components/ui/minimal-tiptap";
import PageLoader from "@components/feedback/PageLoader";
import { useDebouncedSave, type SaveStatus } from "@lib/hooks/useDebouncedSave";
import { getErrorMessage } from "@lib/api/errors";
import { cn } from "@lib/utils";
import { useUploadApi } from "@features/media/api/upload-api";
import { useNote, useNoteActions, useNoteTags } from "../hooks/useNotes";
import TagInput from "../components/TagInput";
import { countWords, describeLength } from "../note-utils";
import { downloadNoteAsMarkdown } from "../export-markdown";
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
  const navigate = useNavigate();
  const { uploadCover } = useUploadApi();
  const actions = useNoteActions();
  const tagSuggestions = useNoteTags().map(({ tag }) => tag);

  const inTrash = Boolean(note.deletedAt);
  const [title, setTitle] = useState(note.title);
  const [tags, setTags] = useState<string[]>(note.tags ?? []);
  const [fontFamily, setFontFamily] = useState<NoteFontFamily>(
    note.fontFamily ?? "sans",
  );
  const [words, setWords] = useState(() => countWords(note.content ?? ""));

  // The latest body, for export; the editor owns the live document.
  const contentRef = useRef(note.content ?? "");

  const { status, schedule, flush } = useDebouncedSave<UpdateNotePayload>({
    save,
  });

  const uploadImage = useCallback(
    async (file: File): Promise<string> => (await uploadCover(file)).url,
    [uploadCover],
  );

  const handleEditorChange = useCallback(
    (value: Content) => {
      const html = String(value ?? "");
      contentRef.current = html;
      setWords(countWords(html));
      schedule({ content: html });
    },
    [schedule],
  );

  /** Saves pending edits first, so the action sees (and keeps) them. */
  const afterSaving = (action: () => void) => async () => {
    await flush();
    action();
  };

  const exportMarkdown = async () => {
    try {
      await downloadNoteAsMarkdown(title, contentRef.current);
    } catch (error) {
      toast.error(`Export failed: ${getErrorMessage(error)}`);
    }
  };

  const duplicate = async () => {
    await flush();
    try {
      const copy = await actions.duplicateNote(note._id);
      navigate(`/notes/${copy._id}`);
    } catch {
      /* already toasted by the query client */
    }
  };

  const length = describeLength(words);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
          Notes
        </Button>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {length && <span className="hidden sm:inline">{length}</span>}
          <div className="flex min-w-[70px] items-center justify-end gap-1.5">
            <SaveIndicator status={status} onRetry={() => void flush()} />
          </div>
          {!inTrash && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Note actions"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!note.archived && (
                  <DropdownMenuItem
                    onClick={() => actions.setPinned(note._id, !note.pinned)}
                  >
                    {note.pinned ? "Unpin" : "Pin"}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => void duplicate()}>
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void exportMarkdown()}>
                  Export as Markdown
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={afterSaving(() => {
                    if (note.archived) {
                      actions.unarchiveNote(note._id);
                    } else {
                      actions.archiveNote(note._id);
                      onBack();
                    }
                  })}
                >
                  {note.archived ? "Unarchive" : "Archive"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={afterSaving(() => {
                    actions.trashNote(note._id);
                    onBack();
                  })}
                >
                  Move to trash
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {inTrash && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          <span>This note is in the trash and can't be edited.</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => actions.restoreNote(note._id)}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restore
          </Button>
        </div>
      )}

      <input
        type="text"
        value={title}
        readOnly={inTrash}
        onChange={(event) => {
          setTitle(event.target.value);
          schedule({ title: event.target.value });
        }}
        placeholder="Untitled"
        aria-label="Note title"
        className={cn(
          "mb-2 w-full border-none bg-transparent text-2xl font-semibold text-foreground outline-none placeholder:text-muted-foreground",
          fontFamily === "serif" && "font-serif",
        )}
      />

      <div className="mb-4">
        <TagInput
          value={tags}
          disabled={inTrash}
          suggestions={tagSuggestions}
          onChange={(next) => {
            setTags(next);
            schedule({ tags: next });
          }}
        />
      </div>

      <MinimalTiptapEditor
        value={note.content || ""}
        onChange={handleEditorChange}
        uploader={uploadImage}
        editable={!inTrash}
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

      {length && (
        <p className="mt-2 text-right text-xs text-muted-foreground sm:hidden">
          {length}
        </p>
      )}
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
      // Restoring from the trash remounts the editor so it becomes editable.
      key={`${note._id}:${note.deletedAt ? "trash" : "live"}`}
      note={note}
      save={save}
      onBack={() => navigate("/notes")}
    />
  );
}

export default NoteEditorPage;
