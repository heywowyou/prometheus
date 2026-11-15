import type { AnyExtension } from "@tiptap/react";
import { Details, DetailsContent, DetailsSummary } from "@tiptap/extension-details";
import { TableKit } from "@tiptap/extension-table";
import {
  TableOfContents,
  getHierarchicalIndexes,
  type TableOfContentData,
} from "@tiptap/extension-table-of-contents";
import { Callout } from "./callout";
import { DragHandle } from "./drag-handle";
import { ItemMention, type MentionSources } from "./item-mention";
import { NoteLink } from "./note-link";
import { SlashCommand, type SlashActions } from "./slash-command";
import type { NoteIndexEntry } from "../types/note-types";

export interface NoteExtensionOptions {
  currentNoteId: string;
  getIndex: () => NoteIndexEntry[];
  getMentionSources: () => MentionSources;
  getSlashActions: () => SlashActions;
  /** Creates a sub-page called `title`; resolves to its id. */
  createLinkedPage: (title: string) => Promise<string>;
  onOutline?: (items: TableOfContentData) => void;
  /** Read-only views skip the menus and the drag handle. */
  readOnly?: boolean;
}

/** Everything the notes editor adds on top of the shared rich-text setup. */
export const createNoteExtensions = (options: NoteExtensionOptions): AnyExtension[] => {
  const blocks: AnyExtension[] = [
    Callout,
    Details.configure({ persist: true, HTMLAttributes: { class: "details" } }),
    DetailsSummary,
    DetailsContent,
    TableKit.configure({ table: { resizable: false } }),
    NoteLink.configure({
      getIndex: options.getIndex,
      currentId: options.currentNoteId,
      createPage: options.createLinkedPage,
    }),
    ItemMention.configure({
      getSources: options.getMentionSources,
      currentNoteId: options.currentNoteId,
    }),
  ];
  if (options.readOnly) return blocks;

  return [
    ...blocks,
    TableOfContents.configure({
      getIndex: getHierarchicalIndexes,
      onUpdate: (items) => options.onOutline?.(items),
    }),
    SlashCommand.configure({ getActions: options.getSlashActions }),
    DragHandle,
  ];
};
