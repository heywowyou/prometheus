import * as React from "react"
import type { Editor } from "@tiptap/react"
import type { VariantProps } from "class-variance-authority"
import type { toggleVariants } from "@components/ui/toggle"
import { CaretDownIcon } from "@radix-ui/react-icons"
import { Highlighter } from "lucide-react"
import { ToolbarButton } from "../toolbar-button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@components/ui/tooltip"

interface HighlightColor {
  cssVar: string
  label: string
}

const HIGHLIGHT_COLORS: HighlightColor[] = [
  { cssVar: "var(--mt-accent-yellow-subtler)", label: "Yellow" },
  { cssVar: "var(--mt-accent-green-subtler)", label: "Green" },
  { cssVar: "var(--mt-accent-blue-subtler)", label: "Blue" },
  { cssVar: "var(--mt-accent-red-subtler)", label: "Pink" },
  { cssVar: "var(--mt-accent-purple-subtler)", label: "Purple" },
]

interface SectionThreeHighlightProps extends VariantProps<typeof toggleVariants> {
  editor: Editor
}

export const SectionThreeHighlight: React.FC<SectionThreeHighlightProps> = ({
  editor,
  size,
  variant,
}) => {
  const activeColor = editor.getAttributes("highlight")?.color as string | undefined
  const isActive = editor.isActive("highlight")

  const handleColorClick = React.useCallback(
    (color: string) => {
      if (activeColor === color) {
        editor.chain().focus().unsetHighlight().run()
      } else {
        editor.chain().focus().setHighlight({ color }).run()
      }
    },
    [editor, activeColor]
  )

  const handleRemove = React.useCallback(() => {
    editor.chain().focus().unsetHighlight().run()
  }, [editor])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <ToolbarButton
          tooltip="Highlight color"
          aria-label="Highlight color"
          isActive={isActive}
          className="gap-0"
          size={size}
          variant={variant}
        >
          <Highlighter
            className="size-5"
            style={isActive && activeColor ? { color: activeColor } : undefined}
          />
          <CaretDownIcon className="size-5" />
        </ToolbarButton>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-full">
        <div className="space-y-2">
          <div className="flex gap-1.5">
            {HIGHLIGHT_COLORS.map((color) => (
              <Tooltip key={color.label}>
                <TooltipTrigger asChild>
                  <button
                    tabIndex={0}
                    aria-label={color.label}
                    className="relative size-7 rounded-md border border-transparent transition-colors hover:border-border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    style={{ backgroundColor: color.cssVar }}
                    onClick={() => handleColorClick(color.cssVar)}
                  >
                    {activeColor === color.cssVar && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <svg
                          viewBox="0 0 16 16"
                          className="size-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="2.5,8 6,11.5 13.5,4.5" />
                        </svg>
                      </span>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{color.label}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
          {isActive && (
            <button
              className="text-muted-foreground hover:text-foreground text-xs transition-colors"
              onClick={handleRemove}
            >
              Remove highlight
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

SectionThreeHighlight.displayName = "SectionThreeHighlight"

export default SectionThreeHighlight
