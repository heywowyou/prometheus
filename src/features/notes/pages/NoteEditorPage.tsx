import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import type { Content } from "@tiptap/react";
import { useNotesApi } from "../api/notes-api";
import { useApiClient } from "../../../lib/api/api-client";
import { Button } from "../../../components/ui/button";
import { MinimalTiptapEditor } from "../../../components/ui/minimal-tiptap";
import type { Note } from "../types/note-types";

type SaveStatus = "idle" | "pending" | "saving" | "saved";
type FontFamily = "sans" | "serif";

function NoteEditorPageInner() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchNote, updateNote } = useNotesApi();
  const client = useApiClient();

  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [fontFamily, setFontFamily] = useState<FontFamily>("sans");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fontTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestTitleRef = useRef(title);
  const latestContentRef = useRef("");
  const latestFontFamilyRef = useRef<FontFamily>("sans");

  const uploadImage = useCallback(
    async (file: File): Promise<string> => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await client.post<{ url: string; publicId: string }>(
        "/images/upload",
        formData
      );
      return response.data.url;
    },
    [client]
  );

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

  const triggerFontSave = useCallback(() => {
    if (!id) return;
    setSaveStatus("pending");
    if (fontTimerRef.current) clearTimeout(fontTimerRef.current);
    fontTimerRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        await updateNote(id, { fontFamily: latestFontFamilyRef.current });
        setSaveStatus("saved");
      } catch {
        setSaveStatus("idle");
      }
    }, 400);
  }, [id, updateNote]);

  // Load note
  useEffect(() => {
    if (!id) return;
    fetchNote(id)
      .then((data) => {
        setNote(data);
        setTitle(data.title);
        setFontFamily(data.fontFamily ?? "sans");
        latestTitleRef.current = data.title;
        latestContentRef.current = data.content;
        latestFontFamilyRef.current = data.fontFamily ?? "sans";
      })
      .catch(() => navigate("/notes"));
  }, [id, fetchNote, navigate]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (fontTimerRef.current) clearTimeout(fontTimerRef.current);
    };
  }, []);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    latestTitleRef.current = val;
    triggerSave();
  };

  const handleEditorChange = useCallback(
    (value: Content) => {
      latestContentRef.current = value as string;
      triggerSave();
    },
    [triggerSave]
  );

  const handleFontFamilyChange = (value: FontFamily) => {
    setFontFamily(value);
    latestFontFamilyRef.current = value;
    triggerFontSave();
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
        className="w-full bg-transparent text-2xl font-semibold text-foreground placeholder:text-muted-foreground outline-none border-none mb-4"
      />

      {/* Editor */}
      {note && (
        <MinimalTiptapEditor
          value={note.content || ""}
          onChange={handleEditorChange}
          uploader={uploadImage}
          output="html"
          placeholder="Start writing…"
          className="flex-1 min-h-0"
          editorContentClassName={`overflow-y-auto p-4 ${fontFamily === "serif" ? "font-serif" : "font-sans"}`}
          fontFamily={fontFamily}
          onFontFamilyChange={handleFontFamilyChange}
        />
      )}
    </div>
  );
}

function NoteEditorPage() {
  return <NoteEditorPageInner />;
}

export default NoteEditorPage;
