import { Extension, type Editor, type Range } from "@tiptap/react";
import Suggestion from "@tiptap/suggestion";
import { PluginKey } from "@tiptap/pm/state";
import {
  AtSign,
  CalendarDays,
  ChevronRight,
  Code2,
  FilePlus2,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  Lightbulb,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Quote,
  Table,
  Type,
} from "lucide-react";
import { matches, suggestionRenderer, type SuggestionItem } from "./suggestion-list";

export interface SlashActions {
  /** Creates a sub-page of the current note; resolves to its id and title. */
  createSubPage: () => Promise<{ id: string; title: string } | null>;
  /** Opens the file picker; the chosen image is inserted at the cursor. */
  pickImage: () => void;
}

export interface SlashCommandOptions {
  getActions: () => SlashActions;
}

interface Command {
  title: string;
  subtitle: string;
  keywords: string;
  group: string;
  icon: SuggestionItem["icon"];
  run: (editor: Editor, range: Range, actions: SlashActions) => void;
}

const start = (editor: Editor, range: Range) => editor.chain().focus().deleteRange(range);

const COMMANDS: Command[] = [
  { title: "Text", subtitle: "Plain paragraph", keywords: "paragraph p", group: "Basic", icon: <Type className="h-4 w-4" />, run: (e, r) => start(e, r).setParagraph().run() },
  { title: "Heading 1", subtitle: "Big section title", keywords: "h1 title", group: "Basic", icon: <Heading1 className="h-4 w-4" />, run: (e, r) => start(e, r).setHeading({ level: 1 }).run() },
  { title: "Heading 2", subtitle: "Medium section title", keywords: "h2 subtitle", group: "Basic", icon: <Heading2 className="h-4 w-4" />, run: (e, r) => start(e, r).setHeading({ level: 2 }).run() },
  { title: "Heading 3", subtitle: "Small section title", keywords: "h3", group: "Basic", icon: <Heading3 className="h-4 w-4" />, run: (e, r) => start(e, r).setHeading({ level: 3 }).run() },
  { title: "To-do list", subtitle: "Track tasks with checkboxes", keywords: "todo task checkbox check", group: "Basic", icon: <ListChecks className="h-4 w-4" />, run: (e, r) => start(e, r).toggleTaskList().run() },
  { title: "Bulleted list", subtitle: "A simple list", keywords: "ul bullet unordered", group: "Basic", icon: <List className="h-4 w-4" />, run: (e, r) => start(e, r).toggleBulletList().run() },
  { title: "Numbered list", subtitle: "A list with numbers", keywords: "ol ordered number", group: "Basic", icon: <ListOrdered className="h-4 w-4" />, run: (e, r) => start(e, r).toggleOrderedList().run() },
  { title: "Toggle", subtitle: "Content you can fold away", keywords: "details collapse fold accordion", group: "Basic", icon: <ChevronRight className="h-4 w-4" />, run: (e, r) => start(e, r).setDetails().run() },
  { title: "Quote", subtitle: "A quotation", keywords: "blockquote citation", group: "Basic", icon: <Quote className="h-4 w-4" />, run: (e, r) => start(e, r).toggleBlockquote().run() },
  { title: "Callout", subtitle: "Make something stand out", keywords: "note info warning tip box", group: "Basic", icon: <Lightbulb className="h-4 w-4" />, run: (e, r) => start(e, r).setCallout().run() },
  { title: "Divider", subtitle: "A line between sections", keywords: "hr rule separator line", group: "Basic", icon: <Minus className="h-4 w-4" />, run: (e, r) => start(e, r).setHorizontalRule().run() },
  { title: "Table", subtitle: "Rows and columns", keywords: "grid spreadsheet", group: "Basic", icon: <Table className="h-4 w-4" />, run: (e, r) => start(e, r).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
  { title: "Code", subtitle: "A block of code", keywords: "codeblock snippet pre", group: "Basic", icon: <Code2 className="h-4 w-4" />, run: (e, r) => start(e, r).toggleCodeBlock().run() },
  { title: "Image", subtitle: "Upload a picture", keywords: "photo picture upload img", group: "Media", icon: <ImageIcon className="h-4 w-4" />, run: (e, r, a) => { start(e, r).run(); a.pickImage(); } },
  { title: "Page", subtitle: "A new page inside this one", keywords: "subpage sub page child new", group: "Link", icon: <FilePlus2 className="h-4 w-4" />, run: (e, r, a) => {
    start(e, r).run();
    void a.createSubPage().then((page) => {
      if (!page) return;
      e.chain().focus().insertContent([{ type: "noteLink", attrs: { id: page.id, label: page.title } }, { type: "text", text: " " }]).run();
    });
  } },
  { title: "Link to page", subtitle: "Link an existing page", keywords: "wiki link reference [[", group: "Link", icon: <Link2 className="h-4 w-4" />, run: (e, r) => start(e, r).insertContent("[[").run() },
  { title: "Mention", subtitle: "A task, a movie, a routine…", keywords: "@ mention media task todo workout", group: "Link", icon: <AtSign className="h-4 w-4" />, run: (e, r) => start(e, r).insertContent("@").run() },
  { title: "Today's date", subtitle: "Insert the date", keywords: "date today now", group: "Link", icon: <CalendarDays className="h-4 w-4" />, run: (e, r) => start(e, r).insertContent(new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })).run() },
];

/** The `/` menu: insert any block type, a sub-page, a link or a mention. */
export const SlashCommand = Extension.create<SlashCommandOptions>({
  name: "slashCommand",

  addOptions() {
    return {
      getActions: () => ({ createSubPage: async () => null, pickImage: () => undefined }),
    };
  },

  addProseMirrorPlugins() {
    const options = this.options;
    return [
      Suggestion<SuggestionItem>({
        editor: this.editor,
        pluginKey: new PluginKey("slashCommand"),
        char: "/",
        // Not inside code, where "/" is just a character.
        allow: ({ editor }) => !editor.isActive("codeBlock"),
        items: ({ query }) =>
          COMMANDS.filter((command) => matches(`${command.title} ${command.keywords}`, query)).map(
            (command) => ({
              key: command.title,
              title: command.title,
              subtitle: command.subtitle,
              group: command.group,
              icon: command.icon,
              run: (editor, range) => command.run(editor, range, options.getActions()),
            }),
          ),
        command: ({ editor, range, props }) => props.run(editor, range),
        render: suggestionRenderer("No block matches"),
      }),
    ];
  },
});
