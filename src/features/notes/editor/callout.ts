import { mergeAttributes, Node } from "@tiptap/react";
import type { DOMOutputSpec } from "@tiptap/pm/model";
import { CALLOUT_ICON_NODES } from "./callout-icons";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      /** Wraps the current block in a callout. */
      setCallout: (attrs?: { icon?: string }) => ReturnType;
    };
  }
}

/** The Lucide icons a callout cycles through when its icon is clicked. */
export const CALLOUT_ICONS = ["lightbulb", "pin", "triangle-alert", "circle-check", "circle-question-mark", "flame"];
const DEFAULT_ICON = "lightbulb";

/** Callouts saved before icons were Lucide carried an emoji. */
const FROM_EMOJI: Record<string, string> = {
  "💡": "lightbulb",
  "📌": "pin",
  "⚠️": "triangle-alert",
  "✅": "circle-check",
  "❓": "circle-question-mark",
  "🔥": "flame",
};

const iconOf = (value: unknown): string => {
  const name = String(value ?? "");
  return CALLOUT_ICON_NODES[name] ? name : (FROM_EMOJI[name] ?? DEFAULT_ICON);
};

const SVG_NS = "http://www.w3.org/2000/svg";
const SVG_ATTRS = {
  width: "18",
  height: "18",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": "1.75",
  "stroke-linecap": "round",
  "stroke-linejoin": "round",
  "aria-hidden": "true",
};

/** The icon as a ProseMirror output spec, for saved HTML and read-only views. */
const iconSpec = (name: string): DOMOutputSpec =>
  [
    `${SVG_NS} svg`,
    SVG_ATTRS,
    ...(CALLOUT_ICON_NODES[name] ?? []).map(([tag, attrs]) => [`${SVG_NS} ${tag}`, attrs] as DOMOutputSpec),
  ] as unknown as DOMOutputSpec;

/** The icon as live DOM, for the editor's node view. */
const iconElement = (name: string): SVGSVGElement => {
  const svg = document.createElementNS(SVG_NS, "svg");
  for (const [key, value] of Object.entries(SVG_ATTRS)) svg.setAttribute(key, value);
  for (const [tag, attrs] of CALLOUT_ICON_NODES[name] ?? []) {
    const child = document.createElementNS(SVG_NS, tag);
    for (const [key, value] of Object.entries(attrs)) child.setAttribute(key, value);
    svg.append(child);
  }
  return svg;
};

/**
 * A highlighted box with a Lucide icon, holding any blocks. Clicking the
 * icon cycles through a few common ones.
 */
export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      icon: {
        default: DEFAULT_ICON,
        parseHTML: (element) => iconOf(element.getAttribute("data-icon") ?? element.getAttribute("data-emoji")),
        renderHTML: (attributes) => ({ "data-icon": iconOf(attributes.icon) }),
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
      ["span", { class: "callout-icon", contenteditable: "false" }, iconSpec(iconOf(node.attrs.icon))],
      ["div", { class: "callout-content" }, 0],
    ];
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement("div");
      dom.className = "callout";
      dom.dataset.type = "callout";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "callout-icon";
      button.contentEditable = "false";
      button.setAttribute("aria-label", "Change callout icon");
      let shown = iconOf(node.attrs.icon);
      button.append(iconElement(shown));
      button.addEventListener("mousedown", (event) => {
        event.preventDefault();
        if (!editor.isEditable || typeof getPos !== "function") return;
        const position = getPos();
        if (position === undefined) return;
        const current = editor.state.doc.nodeAt(position);
        const index = CALLOUT_ICONS.indexOf(iconOf(current?.attrs.icon));
        const next = CALLOUT_ICONS[(index + 1) % CALLOUT_ICONS.length];
        editor.view.dispatch(editor.state.tr.setNodeMarkup(position, undefined, { ...current?.attrs, icon: next }));
      });
      const content = document.createElement("div");
      content.className = "callout-content";
      dom.append(button, content);
      return {
        dom,
        contentDOM: content,
        update: (updated) => {
          if (updated.type.name !== "callout") return false;
          const next = iconOf(updated.attrs.icon);
          if (next !== shown) {
            shown = next;
            button.replaceChildren(iconElement(next));
          }
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
