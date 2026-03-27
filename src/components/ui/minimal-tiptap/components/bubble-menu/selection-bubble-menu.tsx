import * as React from "react"
import type { Editor } from "@tiptap/react"
import type { ShouldShowProps } from "../../types"
import { BubbleMenu } from "@tiptap/react/menus"
import {
  FontBoldIcon,
  FontItalicIcon,
  StrikethroughIcon,
  UnderlineIcon,
  CodeIcon,
} from "@radix-ui/react-icons"
import { Separator } from "@components/ui/separator"
import { ToolbarButton } from "../toolbar-button"
import { SectionThree } from "../section/three"
import { SectionThreeHighlight } from "../section/three-highlight"
import { LinkEditPopover } from "../link/link-edit-popover"

interface SelectionBubbleMenuProps {
  editor: Editor
}

const FORMATTING_ACTIONS = [
  {
    key: "bold",
    tooltip: "Bold",
    icon: <FontBoldIcon className="size-4" />,
    isActive: (e: Editor) => e.isActive("bold"),
    run: (e: Editor) => e.chain().focus().toggleBold().run(),
    canRun: (e: Editor) => e.can().toggleBold() && !e.isActive("codeBlock"),
  },
  {
    key: "italic",
    tooltip: "Italic",
    icon: <FontItalicIcon className="size-4" />,
    isActive: (e: Editor) => e.isActive("italic"),
    run: (e: Editor) => e.chain().focus().toggleItalic().run(),
    canRun: (e: Editor) => e.can().toggleItalic() && !e.isActive("codeBlock"),
  },
  {
    key: "underline",
    tooltip: "Underline",
    icon: <UnderlineIcon className="size-4" />,
    isActive: (e: Editor) => e.isActive("underline"),
    run: (e: Editor) => e.chain().focus().toggleUnderline().run(),
    canRun: (e: Editor) =>
      e.can().toggleUnderline() && !e.isActive("codeBlock"),
  },
  {
    key: "strike",
    tooltip: "Strikethrough",
    icon: <StrikethroughIcon className="size-4" />,
    isActive: (e: Editor) => e.isActive("strike"),
    run: (e: Editor) => e.chain().focus().toggleStrike().run(),
    canRun: (e: Editor) => e.can().toggleStrike() && !e.isActive("codeBlock"),
  },
  {
    key: "code",
    tooltip: "Inline code",
    icon: <CodeIcon className="size-4" />,
    isActive: (e: Editor) => e.isActive("code"),
    run: (e: Editor) => e.chain().focus().toggleCode().run(),
    canRun: (e: Editor) => e.can().toggleCode() && !e.isActive("codeBlock"),
  },
] as const

export const SelectionBubbleMenu: React.FC<SelectionBubbleMenuProps> = ({
  editor,
}) => {
  const shouldShow = React.useCallback(
    ({ editor, from, to }: ShouldShowProps) => {
      if (from === to) return false
      if (!editor.isEditable) return false
      if (editor.isActive("codeBlock")) return false
      if (editor.isActive("link")) return false
      return true
    },
    []
  )

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={shouldShow}
      options={{ placement: "top-start" }}
    >
      <div className="bg-popover border-border flex items-center gap-px rounded-md border px-1 py-1 shadow-md">
        {FORMATTING_ACTIONS.map((action) => (
          <ToolbarButton
            key={action.key}
            tooltip={action.tooltip}
            isActive={action.isActive(editor)}
            disabled={!action.canRun(editor)}
            onClick={() => action.run(editor)}
            size="sm"
          >
            {action.icon}
          </ToolbarButton>
        ))}

        <Separator orientation="vertical" className="mx-1 h-5" />

        <SectionThree editor={editor} size="sm" />
        <SectionThreeHighlight editor={editor} size="sm" />

        <Separator orientation="vertical" className="mx-1 h-5" />

        <LinkEditPopover editor={editor} size="sm" />
      </div>
    </BubbleMenu>
  )
}

SelectionBubbleMenu.displayName = "SelectionBubbleMenu"

export default SelectionBubbleMenu
