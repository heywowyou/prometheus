/* Tiptap extension module: node definitions and helpers ship next to their node views. */
/* eslint-disable react-refresh/only-export-components */
import { mergeAttributes, Node, type Editor, type Range } from "@tiptap/react";
import { NodeViewWrapper, ReactNodeViewRenderer, type ReactNodeViewProps } from "@tiptap/react";
import Suggestion from "@tiptap/suggestion";
import { PluginKey } from "@tiptap/pm/state";
import { useNavigate } from "react-router-dom";
import { FileText, Plus } from "lucide-react";
import { cn } from "@lib/utils";
import { useNoteIndex } from "../hooks/useNotes";
import { titleOf } from "../note-tree";
import type { NoteIndexEntry } from "../types/note-types";
import { matches, suggestionRenderer, type SuggestionItem } from "./suggestion-list";

export interface NoteLinkOptions {
  /** The live index, read when the `[[` menu opens. */
  getIndex: () => NoteIndexEntry[];
  /** The note being edited, left out of its own link list. */
  currentId: string;
  /** Creates a page called `title` and resolves to its id. */
  createPage: (title: string) => Promise<string>;
}

/** Inserts a link to `id`, followed by a space so typing carries on. */
export const insertNoteLink = (editor: Editor, range: Range, id: string, label: string) => {
  editor
    .chain()
    .focus()
    .insertContentAt(range, [
      { type: "noteLink", attrs: { id, label } },
      { type: "text", text: " " },
    ])
    .run();
};

function NoteLinkView({ node, selected }: ReactNodeViewProps) {
  const navigate = useNavigate();
  const { tree } = useNoteIndex();
  const id = String(node.attrs.id ?? "");
  const entry = tree.byId.get(id);
  // The live title wins, so renaming a page updates every link to it.
  const label = entry ? titleOf(entry) : String(node.attrs.label || "Untitled");

  return (
    <NodeViewWrapper
      as="span"
      className={cn("note-link", !entry && "note-link-missing", selected && "is-selected")}
      data-note-id={id}
      onClick={() => entry && navigate(`/notes/${id}`)}
      title={entry ? `Open ${label}` : "This page no longer exists"}
    >
      <span className="note-link-icon" aria-hidden>
        {entry?.icon || <FileText className="inline h-[0.9em] w-[0.9em]" />}
      </span>
      {label}
    </NodeViewWrapper>
  );
}

/**
 * An inline link to another note. Saved as `<a data-note-id>` so the API can
 * collect links for backlinks and the graph. Typing `[[` opens a page picker.
 */
export const NoteLink = Node.create<NoteLinkOptions>({
  name: "noteLink",
  inline: true,
  group: "inline",
  atom: true,
  selectable: true,

  addOptions() {
    return {
      getIndex: () => [],
      currentId: "",
      createPage: async () => "",
    };
  },

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-note-id"),
      },
      label: {
        default: "",
        parseHTML: (element) => element.textContent ?? "",
      },
    };
  },

  parseHTML() {
    return [{ tag: "a[data-note-id]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "a",
      mergeAttributes(
        { class: "note-link", "data-note-id": node.attrs.id, href: `/notes/${node.attrs.id}` },
        { ...HTMLAttributes, id: undefined, label: undefined },
      ),
      String(node.attrs.label || "Untitled"),
    ];
  },

  renderText({ node }) {
    return `[[${String(node.attrs.label || "Untitled")}]]`;
  },

  addNodeView() {
    return ReactNodeViewRenderer(NoteLinkView, { as: "span" });
  },

  addProseMirrorPlugins() {
    const options = this.options;
    return [
      Suggestion<SuggestionItem>({
        editor: this.editor,
        pluginKey: new PluginKey("noteLinkSuggestion"),
        char: "[[",
        allowSpaces: true,
        items: ({ query }) => {
          const pages = options
            .getIndex()
            .filter((entry) => !entry.isTemplate && entry._id !== options.currentId)
            .filter((entry) => matches(titleOf(entry), query))
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
            .slice(0, 8)
            .map<SuggestionItem>((entry) => ({
              key: entry._id,
              title: titleOf(entry),
              icon: entry.icon ? <span>{entry.icon}</span> : <FileText className="h-4 w-4" />,
              run: (editor, range) => insertNoteLink(editor, range, entry._id, titleOf(entry)),
            }));
          const title = query.replace(/\]+$/, "").trim();
          if (title) {
            pages.push({
              key: "__create",
              title: `New page “${title}”`,
              subtitle: "Created inside this page",
              icon: <Plus className="h-4 w-4" />,
              run: (editor, range) => {
                void options.createPage(title).then((id) => {
                  if (id) insertNoteLink(editor, range, id, title);
                });
              },
            });
          }
          return pages;
        },
        command: ({ editor, range, props }) => props.run(editor, range),
        render: suggestionRenderer("Type a page title"),
      }),
    ];
  },
});
