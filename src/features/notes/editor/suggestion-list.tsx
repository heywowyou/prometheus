/* Tiptap extension module: node definitions and helpers ship next to their node views. */
/* eslint-disable react-refresh/only-export-components */
import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from "react";
import { ReactRenderer, type Editor, type Range } from "@tiptap/react";
import type { SuggestionOptions, SuggestionProps } from "@tiptap/suggestion";
import { cn } from "@lib/utils";

/** One row in a suggestion popup. */
export interface SuggestionItem {
  key: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  /** Rows with the same group sit under one heading, in first-seen order. */
  group?: string;
  run: (editor: Editor, range: Range) => void;
}

export interface SuggestionListHandle {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

interface SuggestionListProps {
  items: SuggestionItem[];
  command: (item: SuggestionItem) => void;
  empty?: string;
}

/** The keyboard-driven list shown for `/`, `[[` and `@`. */
const SuggestionList = forwardRef<SuggestionListHandle, SuggestionListProps>(
  function SuggestionList({ items, command, empty = "No results" }, ref) {
    const [active, setActive] = useState(0);
    const [shownItems, setShownItems] = useState(items);
    const listRef = useRef<HTMLDivElement>(null);

    // New results start from the top (adjusted while rendering, not in an effect).
    if (shownItems !== items) {
      setShownItems(items);
      setActive(0);
    }

    useEffect(() => {
      listRef.current
        ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
        ?.scrollIntoView({ block: "nearest" });
    }, [active]);

    useImperativeHandle(ref, () => ({
      onKeyDown: (event) => {
        if (items.length === 0) return false;
        if (event.key === "ArrowDown") {
          setActive((index) => (index + 1) % items.length);
          return true;
        }
        if (event.key === "ArrowUp") {
          setActive((index) => (index - 1 + items.length) % items.length);
          return true;
        }
        if (event.key === "Enter" || event.key === "Tab") {
          const item = items[active];
          if (item) command(item);
          return true;
        }
        return false;
      },
    }));

    let lastGroup: string | undefined;

    return (
      <div
        ref={listRef}
        role="listbox"
        className="max-h-80 w-72 overflow-y-auto rounded-2xl border border-border bg-popover p-1.5 text-popover-foreground shadow-2xl shadow-overlay/50"
      >
        {items.length === 0 ? (
          <p className="px-3 py-2.5 text-sm text-muted-foreground">{empty}</p>
        ) : (
          items.map((item, index) => {
            const heading = item.group && item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            return (
              <div key={item.key}>
                {heading && (
                  <p className="px-2.5 pb-1 pt-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    {heading}
                  </p>
                )}
                <button
                  type="button"
                  role="option"
                  aria-selected={index === active}
                  data-index={index}
                  onMouseEnter={() => setActive(index)}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    command(item);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left",
                    index === active ? "bg-secondary" : "",
                  )}
                >
                  {item.icon && (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground">
                      {item.icon}
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-foreground">{item.title}</span>
                    {item.subtitle && (
                      <span className="block truncate text-xs text-muted-foreground">
                        {item.subtitle}
                      </span>
                    )}
                  </span>
                </button>
              </div>
            );
          })
        )}
      </div>
    );
  },
);

/** Places the popup under the caret, flipping above when there's no room. */
const place = (element: HTMLElement, rect: DOMRect | null | undefined) => {
  if (!rect) return;
  const gap = 8;
  const width = element.offsetWidth || 288;
  const height = element.offsetHeight || 320;
  const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
  const below = rect.bottom + gap;
  const top = below + height > window.innerHeight && rect.top - gap - height > 0 ? rect.top - gap - height : below;
  element.style.left = `${left}px`;
  element.style.top = `${top}px`;
};

/** The `render` half of a Suggestion config, mounting `SuggestionList` in a fixed popup. */
export const suggestionRenderer =
  (empty?: string): SuggestionOptions<SuggestionItem>["render"] =>
  () => {
    let renderer: ReactRenderer<SuggestionListHandle, SuggestionListProps> | null = null;
    let popup: HTMLDivElement | null = null;

    const update = (props: SuggestionProps<SuggestionItem>) => {
      renderer?.updateProps({ items: props.items, command: props.command, empty });
      if (popup) requestAnimationFrame(() => popup && place(popup, props.clientRect?.()));
    };

    return {
      onStart: (props) => {
        renderer = new ReactRenderer(SuggestionList, {
          props: { items: props.items, command: props.command, empty },
          editor: props.editor,
        });
        popup = document.createElement("div");
        popup.style.position = "fixed";
        popup.style.zIndex = "60";
        popup.appendChild(renderer.element);
        document.body.appendChild(popup);
        update(props);
      },
      onUpdate: update,
      onKeyDown: ({ event }) => {
        if (event.key === "Escape") {
          popup?.remove();
          popup = null;
          return true;
        }
        return renderer?.ref?.onKeyDown(event) ?? false;
      },
      onExit: () => {
        popup?.remove();
        popup = null;
        renderer?.destroy();
        renderer = null;
      },
    };
  };

/** Case-insensitive match of every word of `query` in `text`. */
export const matches = (text: string, query: string) => {
  const haystack = text.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
};
