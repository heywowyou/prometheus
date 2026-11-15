import { useMemo } from "react";
import { EditorContent } from "@tiptap/react";
import { useMinimalTiptapEditor } from "@components/ui/minimal-tiptap";
import { cn } from "@lib/utils";
import { createNoteExtensions } from "../editor/note-extensions";
import "@components/ui/minimal-tiptap/styles/index.css";
import "../editor/note-editor.css";

const noop = () => undefined;

/** A note body shown read-only with the same blocks as the editor (version previews). */
export default function NoteRender({ html, serif, className }: { html: string; serif?: boolean; className?: string }) {
  const extensions = useMemo(
    () =>
      createNoteExtensions({
        readOnly: true,
        currentNoteId: "",
        getIndex: () => [],
        getMentionSources: () => ({ media: [], todos: [], routines: [], notes: [] }),
        getSlashActions: () => ({ createSubPage: async () => null, pickImage: noop }),
        createLinkedPage: async () => "",
      }),
    [],
  );
  const editor = useMinimalTiptapEditor({
    value: html,
    editable: false,
    extraExtensions: extensions,
  });

  return (
    <div className={cn("note-render", serif && "is-serif", className)}>
      {editor && <EditorContent editor={editor} className="minimal-tiptap-editor" />}
    </div>
  );
}
