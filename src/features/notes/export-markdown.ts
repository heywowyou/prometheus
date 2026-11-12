/** A filesystem-safe name from the note title: "Trip ideas: Japan" → "trip-ideas-japan". */
const fileNameFor = (title: string): string =>
  title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "note";

/** Converts a note's Tiptap HTML to Markdown. */
export const noteToMarkdown = async (title: string, html: string): Promise<string> => {
  // Loaded on demand: only the export action needs it.
  const { default: TurndownService } = await import("turndown");

  const service = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
    emDelimiter: "*",
    hr: "---",
  });

  // One rule for every list item — turndown tries the most recently added rule
  // first, so separate checklist and list rules would shadow each other.
  // Output is "- item" / "1. item" (turndown's default pads to "-   item"),
  // and Tiptap checklist items (<ul data-type="taskList"><li data-checked>)
  // become "- [x] item".
  service.addRule("listItem", {
    filter: "li",
    replacement: (content, node, options) => {
      const element = node as HTMLElement;
      const parent = node.parentNode as HTMLElement | null;
      const ordered = parent?.nodeName === "OL";
      const index = ordered
        ? Number(parent?.getAttribute("start") ?? 1) +
          Array.prototype.indexOf.call(parent?.children ?? [], node)
        : 0;
      const task = parent?.getAttribute("data-type") === "taskList";
      const checkbox = element.getAttribute("data-checked") === "true" ? "[x] " : "[ ] ";
      const prefix = ordered
        ? `${index}. `
        : `${options.bulletListMarker} ${task ? checkbox : ""}`;
      const body = content
        .replace(/^\n+/, "")
        .replace(/\s+$/, "")
        .replace(/\n/g, `\n${" ".repeat(prefix.length)}`);
      return `${prefix}${body}\n`;
    },
  });
  // Highlights use the widely supported ==mark== extension; underline has no
  // Markdown form, so it is kept as plain text.
  service.addRule("highlight", {
    filter: "mark",
    replacement: (content) => `==${content}==`,
  });
  service.addRule("underline", {
    filter: "u",
    replacement: (content) => content,
  });

  const body = service.turndown(html).trim();
  return `# ${title.trim() || "Untitled"}\n\n${body}\n`;
};

/** Downloads the note as a `.md` file. */
export const downloadNoteAsMarkdown = async (
  title: string,
  html: string,
): Promise<void> => {
  const markdown = await noteToMarkdown(title, html);
  const url = URL.createObjectURL(
    new Blob([markdown], { type: "text/markdown;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileNameFor(title)}.md`;
  link.click();
  // Give the browser a moment to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
};
