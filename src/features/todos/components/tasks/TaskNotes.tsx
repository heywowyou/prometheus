import { useEffect, useMemo, useRef, type RefObject } from "react";
import { EditorContent, type Content } from "@tiptap/react";
import { useMinimalTiptapEditor } from "@components/ui/minimal-tiptap";
import { cn } from "@lib/utils";
import { NoteLink } from "@features/notes/editor/note-link";
import { useNoteActions, useNoteIndex } from "@features/notes/hooks/useNotes";
import type { NoteIndexEntry } from "@features/notes/types/note-types";
import "@components/ui/minimal-tiptap/styles/index.css";
import "@features/notes/editor/note-editor.css";

type CreateNote = ReturnType<typeof useNoteActions>["createNote"];

/** `[[` page links that read the live notes index through refs. */
const noteLinks = (index: RefObject<NoteIndexEntry[]>, create: RefObject<CreateNote>) =>
  NoteLink.configure({
    getIndex: () => index.current,
    currentId: "",
    createPage: async (title: string) => (await create.current({ title }))._id,
  });

/**
 * A task's notes: the notes editor without the page chrome. `[[` links a
 * page (or creates one), so a task can point at the note it comes from.
 * Loaded on demand, only once a task is opened.
 */
export default function TaskNotes({
  value,
  readOnly,
  onChange,
  autoFocus,
  className,
}: {
  value: string;
  readOnly?: boolean;
  onChange: (html: string) => void;
  autoFocus?: boolean;
  className?: string;
}) {
  const { entries } = useNoteIndex();
  const notes = useNoteActions();
  const indexRef = useRef<NoteIndexEntry[]>(entries);
  useEffect(() => {
    indexRef.current = entries;
  }, [entries]);
  const createRef = useRef(notes.createNote);
  useEffect(() => {
    createRef.current = notes.createNote;
  }, [notes.createNote]);

  // The refs are only read inside the editor's callbacks, after render.
  // eslint-disable-next-line react-hooks/refs
  const extensions = useMemo(() => [noteLinks(indexRef, createRef)], []);
  const lastRef = useRef(value);
  const editor = useMinimalTiptapEditor({
    value,
    editable: !readOnly,
    output: "html",
    placeholder: "Notes",
    autofocus: autoFocus ? "end" : false,
    extraExtensions: extensions,
    onUpdate: (content: Content) => {
      const html = String(content ?? "");
      // An empty editor still holds a paragraph; store it as empty.
      const normalised = html === "<p></p>" ? "" : html;
      if (normalised === lastRef.current) return;
      lastRef.current = normalised;
      onChange(normalised);
    },
  });

  return (
    <div className={cn("note-editor minimal-tiptap-editor task-notes", className)}>
      {editor ? <EditorContent editor={editor} /> : <div className="h-6" />}
    </div>
  );
}
