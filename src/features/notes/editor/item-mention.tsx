/* Tiptap extension module: node definitions and helpers ship next to their node views. */
/* eslint-disable react-refresh/only-export-components */
import { mergeAttributes, Node } from "@tiptap/react";
import { NodeViewWrapper, ReactNodeViewRenderer, type ReactNodeViewProps } from "@tiptap/react";
import Suggestion from "@tiptap/suggestion";
import { PluginKey } from "@tiptap/pm/state";
import { useNavigate } from "react-router-dom";
import { Check, CheckSquare, Dumbbell, FileText, ImageIcon, Play } from "lucide-react";
import { cn } from "@lib/utils";
import { useMediaLogs } from "@features/media/hooks/useMediaLogs";
import { configForType } from "@features/media/media-config";
import { STATUS_META } from "@features/media/media-status";
import { resolveCoverUrl, type MediaLog } from "@features/media/types/media-types";
import { useTodos } from "@features/todos/hooks/useTodos";
import type { Todo } from "@features/todos/types/todo-types";
import { useRoutines, useStartSession } from "@features/workouts/hooks/useWorkouts";
import type { Routine } from "@features/workouts/types/workout-types";
import { titleOf } from "../note-tree";
import type { NoteIndexEntry } from "../types/note-types";
import { insertNoteLink } from "./note-link";
import { matches, suggestionRenderer, type SuggestionItem } from "./suggestion-list";

export const MENTION_KINDS = ["media", "todo", "routine"] as const;
export type MentionKind = (typeof MENTION_KINDS)[number];

/** What the `@` menu can offer, read from the app's query cache when it opens. */
export interface MentionSources {
  media: MediaLog[];
  todos: Todo[];
  routines: Routine[];
  notes: NoteIndexEntry[];
}

export interface ItemMentionOptions {
  getSources: () => MentionSources;
  currentNoteId: string;
}

const MediaCard = ({ id, label }: { id: string; label: string }) => {
  const navigate = useNavigate();
  const { logs } = useMediaLogs();
  const log = logs.find((item) => item._id === id);
  if (!log) return <MissingCard label={label} />;
  const config = configForType(log.type);
  const cover = resolveCoverUrl(log.cover);
  return (
    <button
      type="button"
      className="mention-card"
      onClick={() => navigate(`/media/${config.slug}`)}
      title={`${config.singular} · ${STATUS_META[log.status].label}`}
    >
      <span className="mention-thumb">
        {cover ? <img src={cover} alt="" /> : <ImageIcon className="h-3 w-3" />}
      </span>
      <span className="mention-title">{log.title}</span>
      <span className={cn("mention-badge", STATUS_META[log.status].badge)}>
        {log.rating && log.status === "finished" ? `${log.rating}/10` : STATUS_META[log.status].label}
      </span>
    </button>
  );
};

const TodoCard = ({ id, label }: { id: string; label: string }) => {
  const navigate = useNavigate();
  const { todos, toggleTodo } = useTodos();
  const todo = todos.find((item) => item._id === id);
  if (!todo) return <MissingCard label={label} />;
  return (
    <span className={cn("mention-card", todo.completed && "is-done")}>
      <button
        type="button"
        aria-label={todo.completed ? `Mark ${todo.text} not done` : `Mark ${todo.text} done`}
        aria-pressed={todo.completed}
        onClick={() => toggleTodo(todo._id)}
        className="mention-check"
      >
        {todo.completed && <Check className="h-2.5 w-2.5" strokeWidth={3.5} />}
      </button>
      <button type="button" className="mention-title" onClick={() => navigate("/todos")}>
        {todo.text}
      </button>
    </span>
  );
};

const RoutineCard = ({ id, label }: { id: string; label: string }) => {
  const navigate = useNavigate();
  const { routines } = useRoutines();
  const { startSession, starting } = useStartSession();
  const routine = routines.find((item) => item._id === id);
  if (!routine) return <MissingCard label={label} />;
  return (
    <span className="mention-card">
      <Dumbbell className="mention-icon h-3.5 w-3.5" />
      <button
        type="button"
        className="mention-title"
        onClick={() => navigate(`/workouts/routines/${routine._id}`)}
      >
        {routine.name}
      </button>
      <button
        type="button"
        disabled={starting}
        onClick={() => startSession(routine._id)}
        className="mention-action"
      >
        <Play className="h-2.5 w-2.5 fill-current" />
        Start
      </button>
    </span>
  );
};

const MissingCard = ({ label }: { label: string }) => (
  <span className="mention-card is-missing" title="This item no longer exists">
    <span className="mention-title">{label || "Deleted item"}</span>
  </span>
);

function ItemMentionView({ node }: ReactNodeViewProps) {
  const kind = String(node.attrs.kind) as MentionKind;
  const id = String(node.attrs.id ?? "");
  const label = String(node.attrs.label ?? "");
  return (
    <NodeViewWrapper as="span" className="item-mention" contentEditable={false}>
      {kind === "media" ? (
        <MediaCard id={id} label={label} />
      ) : kind === "todo" ? (
        <TodoCard id={id} label={label} />
      ) : kind === "routine" ? (
        <RoutineCard id={id} label={label} />
      ) : (
        <MissingCard label={label} />
      )}
    </NodeViewWrapper>
  );
}

const MAX_PER_GROUP = 5;

/**
 * A live card for a media log, task or routine inside a note. Saved as a
 * `<span data-mention-kind data-mention-id>` holding the label at the time,
 * shown live (status, checkbox, start button) from the app's data.
 * Typing `@` opens a picker that also offers pages.
 */
export const ItemMention = Node.create<ItemMentionOptions>({
  name: "itemMention",
  inline: true,
  group: "inline",
  atom: true,
  selectable: true,

  addOptions() {
    return {
      getSources: () => ({ media: [], todos: [], routines: [], notes: [] }),
      currentNoteId: "",
    };
  },

  addAttributes() {
    return {
      kind: {
        default: "media",
        parseHTML: (element) => element.getAttribute("data-mention-kind"),
      },
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-mention-id"),
      },
      label: {
        default: "",
        parseHTML: (element) => element.textContent ?? "",
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-mention-kind]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(
        {
          class: "item-mention",
          "data-mention-kind": node.attrs.kind,
          "data-mention-id": node.attrs.id,
        },
        { ...HTMLAttributes, kind: undefined, id: undefined, label: undefined },
      ),
      String(node.attrs.label ?? ""),
    ];
  },

  renderText({ node }) {
    return `@${String(node.attrs.label ?? "")}`;
  },

  addNodeView() {
    return ReactNodeViewRenderer(ItemMentionView, { as: "span" });
  },

  addProseMirrorPlugins() {
    const options = this.options;
    return [
      Suggestion<SuggestionItem>({
        editor: this.editor,
        pluginKey: new PluginKey("itemMentionSuggestion"),
        char: "@",
        allowSpaces: true,
        items: ({ query }) => {
          const { media, todos, routines, notes } = options.getSources();
          const mention =
            (kind: MentionKind, id: string, label: string): SuggestionItem["run"] =>
            (editor, range) =>
              editor
                .chain()
                .focus()
                .insertContentAt(range, [
                  { type: "itemMention", attrs: { kind, id, label } },
                  { type: "text", text: " " },
                ])
                .run();

          const items: SuggestionItem[] = [
            ...todos
              .filter((todo) => matches(todo.text, query))
              .sort((a, b) => Number(a.completed) - Number(b.completed))
              .slice(0, MAX_PER_GROUP)
              .map((todo) => ({
                key: `todo:${todo._id}`,
                group: "Tasks",
                title: todo.text,
                subtitle: todo.recurrenceType === "none" ? "Task" : `${todo.recurrenceType} habit`,
                icon: <CheckSquare className="h-4 w-4" />,
                run: mention("todo", todo._id, todo.text),
              })),
            ...media
              .filter((log) => matches(log.title, query))
              .slice(0, MAX_PER_GROUP)
              .map((log) => ({
                key: `media:${log._id}`,
                group: "Media",
                title: log.title,
                subtitle: `${configForType(log.type).singular} · ${STATUS_META[log.status].label}`,
                icon: (() => {
                  const Icon = configForType(log.type).icon;
                  return <Icon className="h-4 w-4" />;
                })(),
                run: mention("media", log._id, log.title),
              })),
            ...routines
              .filter((routine) => matches(routine.name, query))
              .slice(0, MAX_PER_GROUP)
              .map((routine) => ({
                key: `routine:${routine._id}`,
                group: "Workouts",
                title: routine.name,
                subtitle: `${routine.exercises.length} exercises`,
                icon: <Dumbbell className="h-4 w-4" />,
                run: mention("routine", routine._id, routine.name),
              })),
            ...notes
              .filter((entry) => !entry.isTemplate && entry._id !== options.currentNoteId)
              .filter((entry) => matches(titleOf(entry), query))
              .slice(0, MAX_PER_GROUP)
              .map((entry) => ({
                key: `note:${entry._id}`,
                group: "Pages",
                title: titleOf(entry),
                icon: entry.icon ? <span>{entry.icon}</span> : <FileText className="h-4 w-4" />,
                run: (editor: Parameters<SuggestionItem["run"]>[0], range: Parameters<SuggestionItem["run"]>[1]) =>
                  insertNoteLink(editor, range, entry._id, titleOf(entry)),
              })),
          ];
          return items;
        },
        command: ({ editor, range, props }) => props.run(editor, range),
        render: suggestionRenderer("Nothing matches"),
      }),
    ];
  },
});
