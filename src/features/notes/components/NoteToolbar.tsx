import type { Editor } from "@tiptap/react";
import { Bold, Italic, Underline, Strikethrough } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Separator } from "../../../components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { cn } from "@lib/utils";

interface NoteToolbarProps {
  editor: Editor | null;
}

const FONT_FAMILIES = [
  { label: "Sans", value: "Roboto, sans-serif" },
  { label: "Serif", value: "EB Garamond, serif" },
];

const FONT_SIZES = [
  { label: "Small", value: "12px" },
  { label: "Normal", value: "16px" },
  { label: "Large", value: "20px" },
  { label: "Huge", value: "28px" },
];

interface FormatButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
}

function FormatButton({ active, onClick, children, title }: FormatButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      title={title}
      onClick={onClick}
      className={cn(
        "h-8 w-8 p-0",
        active
          ? "text-accent bg-accent/10 hover:bg-accent/20"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </Button>
  );
}

function NoteToolbar({ editor }: NoteToolbarProps) {
  if (!editor) return null;

  const currentFontFamily = editor.getAttributes("textStyle").fontFamily as string | undefined;
  const currentFontSize = editor.getAttributes("textStyle").fontSize as string | undefined;

  const activeFamilyValue =
    FONT_FAMILIES.find((f) => f.value === currentFontFamily)?.value ??
    FONT_FAMILIES[0].value;

  const activeSizeValue =
    FONT_SIZES.find((s) => s.value === currentFontSize)?.value ??
    FONT_SIZES[1].value;

  return (
    <div className="flex items-center gap-1 border-b border-border px-1 py-1 flex-wrap">
      {/* Format buttons */}
      <FormatButton
        title="Bold"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="w-4 h-4" />
      </FormatButton>

      <FormatButton
        title="Italic"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="w-4 h-4" />
      </FormatButton>

      <FormatButton
        title="Underline"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <Underline className="w-4 h-4" />
      </FormatButton>

      <FormatButton
        title="Strikethrough"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="w-4 h-4" />
      </FormatButton>

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* Font family */}
      <Select
        value={activeFamilyValue}
        onValueChange={(val) => {
          editor.chain().focus().setFontFamily(val).run();
        }}
      >
        <SelectTrigger className="h-8 w-24 text-xs border-0 bg-transparent text-muted-foreground hover:text-foreground focus:ring-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FONT_FAMILIES.map((f) => (
            <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }}>
              {f.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* Font size */}
      <Select
        value={activeSizeValue}
        onValueChange={(val) => {
          editor.chain().focus().setFontSize(val).run();
        }}
      >
        <SelectTrigger className="h-8 w-24 text-xs border-0 bg-transparent text-muted-foreground hover:text-foreground focus:ring-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FONT_SIZES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default NoteToolbar;
