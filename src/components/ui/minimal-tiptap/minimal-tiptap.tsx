import "./styles/index.css"

import type { Content, Editor } from "@tiptap/react"
import type { UseMinimalTiptapEditorProps } from "./hooks/use-minimal-tiptap"
import { EditorContent, EditorContext } from "@tiptap/react"
import { Separator } from "@components/ui/separator"
import { cn } from "@lib/utils"
import { AlignLeft, AlignCenter, AlignRight, AlignJustify } from "lucide-react"
import { SectionOne } from "./components/section/one"
import { SectionTwo } from "./components/section/two"
import { SectionThree } from "./components/section/three"
import { SectionFour } from "./components/section/four"
import { SectionFive } from "./components/section/five"
import { SectionThreeHighlight } from "./components/section/three-highlight"
import { LinkBubbleMenu } from "./components/bubble-menu/link-bubble-menu"
import { SelectionBubbleMenu } from "./components/bubble-menu/selection-bubble-menu"
import { useMinimalTiptapEditor } from "./hooks/use-minimal-tiptap"
import { MeasuredContainer } from "./components/measured-container"
import { useTiptapEditor } from "./hooks/use-tiptap-editor"
import { ToolbarButton } from "./components/toolbar-button"

type FontFamily = "sans" | "serif"
type TextAlign = "left" | "center" | "right" | "justify"

const ALIGN_OPTIONS: { value: TextAlign; Icon: React.ElementType; label: string }[] = [
  { value: "left", Icon: AlignLeft, label: "Align left" },
  { value: "center", Icon: AlignCenter, label: "Align center" },
  { value: "right", Icon: AlignRight, label: "Align right" },
  { value: "justify", Icon: AlignJustify, label: "Justify" },
]

export interface MinimalTiptapProps extends Omit<
  UseMinimalTiptapEditorProps,
  "onUpdate"
> {
  value?: Content
  onChange?: (value: Content) => void
  className?: string
  editorContentClassName?: string
  fontFamily?: FontFamily
  onFontFamilyChange?: (value: FontFamily) => void
}

const Toolbar = ({
  editor,
  fontFamily,
  onFontFamilyChange,
}: {
  editor: Editor
  fontFamily?: FontFamily
  onFontFamilyChange?: (value: FontFamily) => void
}) => (
  <div className="border-border flex h-12 shrink-0 overflow-x-auto border-b p-2">
    <div className="flex w-max items-center gap-px">
      {/* Font family */}
      <div className="flex items-center gap-px">
        <ToolbarButton
          tooltip="Sans-serif"
          isActive={fontFamily === "sans" || fontFamily === undefined}
          onClick={() => onFontFamilyChange?.("sans")}
          className="font-sans text-sm px-2"
        >
          Aa
        </ToolbarButton>
        <ToolbarButton
          tooltip="Serif"
          isActive={fontFamily === "serif"}
          onClick={() => onFontFamilyChange?.("serif")}
          className="font-serif text-sm px-2"
        >
          Aa
        </ToolbarButton>
      </div>

      <Separator orientation="vertical" className="mx-2" />

      {/* Text alignment */}
      <div className="flex items-center gap-px">
        {ALIGN_OPTIONS.map(({ value, Icon, label }) => (
          <ToolbarButton
            key={value}
            tooltip={label}
            isActive={editor.isActive({ textAlign: value })}
            onClick={() =>
              editor.chain().focus().setTextAlign(value).run()
            }
          >
            <Icon className="size-4" />
          </ToolbarButton>
        ))}
      </div>

      <Separator orientation="vertical" className="mx-2" />

      <SectionOne editor={editor} activeLevels={[1, 2, 3, 4, 5, 6]} />

      <Separator orientation="vertical" className="mx-2" />

      <SectionTwo
        editor={editor}
        activeActions={[
          "bold",
          "italic",
          "underline",
          "strikethrough",
          "code",
          "clearFormatting",
        ]}
        mainActionCount={3}
      />

      <Separator orientation="vertical" className="mx-2" />

      <SectionThree editor={editor} />
      <SectionThreeHighlight editor={editor} />

      <Separator orientation="vertical" className="mx-2" />

      <SectionFour
        editor={editor}
        activeActions={["orderedList", "bulletList", "taskList"]}
        mainActionCount={0}
      />

      <Separator orientation="vertical" className="mx-2" />

      <SectionFive
        editor={editor}
        activeActions={["codeBlock", "blockquote", "horizontalRule"]}
        mainActionCount={0}
      />
    </div>
  </div>
)

export const MinimalTiptapEditor = ({
  value,
  onChange,
  className,
  editorContentClassName,
  fontFamily,
  onFontFamilyChange,
  ...props
}: MinimalTiptapProps) => {
  const editor = useMinimalTiptapEditor({
    value,
    onUpdate: onChange,
    ...props,
  })

  if (!editor) {
    return null
  }

  return (
    <EditorContext.Provider value={{ editor }}>
      <MainMinimalTiptapEditor
        editor={editor}
        className={className}
        editorContentClassName={editorContentClassName}
        fontFamily={fontFamily}
        onFontFamilyChange={onFontFamilyChange}
      />
    </EditorContext.Provider>
  )
}

MinimalTiptapEditor.displayName = "MinimalTiptapEditor"

export default MinimalTiptapEditor

export const MainMinimalTiptapEditor = ({
  editor: providedEditor,
  className,
  editorContentClassName,
  fontFamily,
  onFontFamilyChange,
}: MinimalTiptapProps & { editor: Editor }) => {
  const { editor } = useTiptapEditor(providedEditor)

  if (!editor) {
    return null
  }

  return (
    <MeasuredContainer
      as="div"
      name="editor"
      className={cn(
        "border-input min-data-[orientation=vertical]:h-72 flex h-auto w-full flex-col rounded-md border shadow-xs",
        className
      )}
    >
      <Toolbar
        editor={editor}
        fontFamily={fontFamily}
        onFontFamilyChange={onFontFamilyChange}
      />
      <EditorContent
        editor={editor}
        className={cn("minimal-tiptap-editor", editorContentClassName)}
      />
      <LinkBubbleMenu editor={editor} />
      <SelectionBubbleMenu editor={editor} />
    </MeasuredContainer>
  )
}
