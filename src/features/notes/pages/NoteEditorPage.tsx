import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { FontFamily } from "@tiptap/extension-font-family";
import { TextStyle, FontSize } from "@tiptap/extension-text-style";
import { useNotesApi } from "../api/notes-api";
import NoteToolbar from "../components/NoteToolbar";
import { Button } from "../../../components/ui/button";
import AuthGuard from "../../../components/AuthGuard";
import type { Note } from "../types/note-types";

type SaveStatus = "idle" | "pending" | "saving" | "saved";

function NoteEditorPageInner() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchNote, updateNote } = useNotesApi();

  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestTitleRef = useRef(title);
  const latestContentRef = useRef("");

  const editor = useEditor({
    extensions: [StarterKit, TextStyle, FontFamily, FontSize],
    content: "",
    editorProps: {
      attributes: {
        class: "outline-none min-h-full text-foreground font-sans text-sm leading-relaxed px-1",
      },
    },
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML();
      latestContentRef.current = html;
      triggerSave();
    },
  });

  const triggerSave = useCallback(() => {
    if (!id) return;
    setSaveStatus("pending");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        await updateNote(id, {
          title: latestTitleRef.current,
          content: latestContentRef.current,
        });
        setSaveStatus("saved");
      } catch {
        setSaveStatus("idle");
      }
    }, 800);
  }, [id, updateNote]);

  // Load note
  useEffect(() => {
    if (!id) return;
    fetchNote(id).then((data) => {
      setNote(data);
      setTitle(data.title);
      latestTitleRef.current = data.title;
      latestContentRef.current = data.content;
    }).catch(() => navigate("/notes"));
  }, [id, fetchNote, navigate]);

  // Populate editor once note loads
  useEffect(() => {
    if (editor && note) {
      editor.commands.setContent(note.content || "");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, note?._id]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    latestTitleRef.current = val;
    triggerSave();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground gap-1.5"
          onClick={() => navigate("/notes")}
        >
          <ArrowLeft className="w-4 h-4" />
          Notes
        </Button>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-[70px] justify-end">
          {saveStatus === "pending" || saveStatus === "saving" ? (
            <span>Saving…</span>
          ) : saveStatus === "saved" ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Saved</span>
            </>
          ) : null}
        </div>
      </div>

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={handleTitleChange}
        placeholder="Untitled"
        className="w-full bg-transparent text-2xl font-semibold text-foreground placeholder:text-muted-foreground outline-none border-none mb-2"
      />

      {/* Toolbar */}
      <NoteToolbar editor={editor} />

      {/* Editor */}
      <div className="flex-1 overflow-y-auto mt-3">
        <EditorContent
          editor={editor}
          className="min-h-full [&_.ProseMirror]:min-h-[300px] [&_.ProseMirror]:outline-none"
        />
      </div>
    </div>
  );
}

function NoteEditorPage() {
  return (
    <AuthGuard>
      <NoteEditorPageInner />
    </AuthGuard>
  );
}

export default NoteEditorPage;
