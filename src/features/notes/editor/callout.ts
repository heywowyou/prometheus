import { mergeAttributes, Node } from "@tiptap/react";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      /** Wraps the current block in a callout. */
      setCallout: (attrs?: { emoji?: string }) => ReturnType;
    };
  }
}

export const CALLOUT_EMOJIS = ["💡", "📌", "⚠️", "✅", "❓", "🔥"];

/**
 * A highlighted box with an emoji, holding any blocks. Clicking the emoji
 * cycles through a few common ones.
 */
export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      emoji: {
        default: "💡",
        parseHTML: (element) => element.getAttribute("data-emoji") ?? "💡",
        renderHTML: (attributes) => ({ "data-emoji": attributes.emoji }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="callout"]', contentElement: ".callout-content" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "callout", class: "callout" }),
      ["span", { class: "callout-emoji", contenteditable: "false" }, String(node.attrs.emoji)],
      ["div", { class: "callout-content" }, 0],
    ];
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement("div");
      dom.className = "callout";
      dom.dataset.type = "callout";
      const emoji = document.createElement("button");
      emoji.type = "button";
      emoji.className = "callout-emoji";
      emoji.contentEditable = "false";
      emoji.textContent = String(node.attrs.emoji);
      emoji.setAttribute("aria-label", "Change callout icon");
      emoji.addEventListener("mousedown", (event) => {
        event.preventDefault();
        if (!editor.isEditable || typeof getPos !== "function") return;
        const position = getPos();
        if (position === undefined) return;
        const current = editor.state.doc.nodeAt(position);
        const index = CALLOUT_EMOJIS.indexOf(String(current?.attrs.emoji));
        const next = CALLOUT_EMOJIS[(index + 1) % CALLOUT_EMOJIS.length];
        editor.view.dispatch(
          editor.state.tr.setNodeMarkup(position, undefined, { ...current?.attrs, emoji: next }),
        );
      });
      const content = document.createElement("div");
      content.className = "callout-content";
      dom.append(emoji, content);
      return {
        dom,
        contentDOM: content,
        update: (updated) => {
          if (updated.type.name !== "callout") return false;
          emoji.textContent = String(updated.attrs.emoji);
          return true;
        },
      };
    };
  },

  addCommands() {
    return {
      setCallout:
        (attrs) =>
        ({ commands }) =>
          commands.wrapIn(this.name, attrs),
    };
  },
});
