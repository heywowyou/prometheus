import type { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import {
  ArrowDownToLine,
  ArrowRightToLine,
  Columns3,
  Heading,
  Rows3,
  Trash2,
} from "lucide-react";
import { cn } from "@lib/utils";

const ACTIONS = [
  { label: "Row below", icon: ArrowDownToLine, run: (e: Editor) => e.chain().focus().addRowAfter().run() },
  { label: "Column right", icon: ArrowRightToLine, run: (e: Editor) => e.chain().focus().addColumnAfter().run() },
  { label: "Header row", icon: Heading, run: (e: Editor) => e.chain().focus().toggleHeaderRow().run() },
  { label: "Delete row", icon: Rows3, run: (e: Editor) => e.chain().focus().deleteRow().run(), danger: true },
  { label: "Delete column", icon: Columns3, run: (e: Editor) => e.chain().focus().deleteColumn().run(), danger: true },
  { label: "Delete table", icon: Trash2, run: (e: Editor) => e.chain().focus().deleteTable().run(), danger: true },
] as const;

/** Row and column controls while the cursor is in a table. */
export default function TableBubbleMenu({ editor }: { editor: Editor }) {
  return (
    <BubbleMenu
      editor={editor}
      pluginKey="tableBubbleMenu"
      shouldShow={({ editor: current }) => current.isEditable && current.isActive("table")}
      // Anchored under the whole table, so it never covers the cells.
      getReferencedVirtualElement={() => {
        const { $from } = editor.state.selection;
        let dom: Element | null = editor.view.domAtPos($from.pos).node as Element;
        if (dom && dom.nodeType !== 1) dom = dom.parentElement;
        const table = dom?.closest("table");
        return table ? { getBoundingClientRect: () => table.getBoundingClientRect() } : null;
      }}
      options={{ placement: "bottom-start", offset: 8 }}
    >
      <div className="flex items-center gap-px rounded-xl border border-border bg-popover p-1 shadow-lg">
        {ACTIONS.map((action) => (
          <button
            key={action.label}
            type="button"
            title={action.label}
            aria-label={action.label}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => action.run(editor)}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs transition-colors hover:bg-secondary",
              "danger" in action ? "text-destructive" : "text-soft hover:text-foreground",
            )}
          >
            <action.icon className="h-3.5 w-3.5" />
            <span className="hidden md:inline">{action.label}</span>
          </button>
        ))}
      </div>
    </BubbleMenu>
  );
}
