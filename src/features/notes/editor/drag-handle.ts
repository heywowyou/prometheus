import { Extension } from "@tiptap/react";
import { NodeSelection, Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";

const HANDLE_WIDTH = 22;

/** The top-level block under a point, with its position in the document. */
const blockAt = (view: EditorView, x: number, y: number) => {
  const rect = view.dom.getBoundingClientRect();
  const found = view.posAtCoords({ left: Math.max(rect.left + 1, Math.min(x, rect.right - 1)), top: y });
  if (!found) return null;
  const $pos = view.state.doc.resolve(found.inside >= 0 ? found.inside : found.pos);
  if ($pos.depth < 1) {
    const node = view.state.doc.nodeAt(found.pos);
    return node ? { pos: found.pos, node } : null;
  }
  const pos = $pos.before(1);
  const node = view.state.doc.nodeAt(pos);
  return node ? { pos, node } : null;
};

/**
 * A grip beside the block under the pointer: drag it to move the block, click
 * it to select the block. Pointer devices only; on touch, blocks are moved by
 * cut and paste.
 */
export const DragHandle = Extension.create({
  name: "noteDragHandle",

  addProseMirrorPlugins() {
    let handle: HTMLButtonElement | null = null;
    let current: { pos: number } | null = null;

    const hide = () => {
      if (handle) handle.style.opacity = "0";
      current = null;
    };

    return [
      new Plugin({
        key: new PluginKey("noteDragHandle"),
        view: (view) => {
          handle = document.createElement("button");
          handle.type = "button";
          handle.className = "note-drag-handle";
          handle.draggable = true;
          handle.setAttribute("aria-label", "Drag to move this block");
          handle.innerHTML =
            '<svg viewBox="0 0 10 16" width="10" height="16" aria-hidden="true"><circle cx="2.5" cy="3" r="1.4"/><circle cx="7.5" cy="3" r="1.4"/><circle cx="2.5" cy="8" r="1.4"/><circle cx="7.5" cy="8" r="1.4"/><circle cx="2.5" cy="13" r="1.4"/><circle cx="7.5" cy="13" r="1.4"/></svg>';
          document.body.appendChild(handle);

          handle.addEventListener("mousedown", () => {
            if (!current) return;
            view.dispatch(
              view.state.tr.setSelection(NodeSelection.create(view.state.doc, current.pos)),
            );
          });

          handle.addEventListener("dragstart", (event) => {
            if (!current || !event.dataTransfer) return;
            const selection = NodeSelection.create(view.state.doc, current.pos);
            view.dispatch(view.state.tr.setSelection(selection));
            const slice = selection.content();
            const { dom, text } = view.serializeForClipboard(slice);
            event.dataTransfer.clearData();
            event.dataTransfer.setData("text/html", dom.innerHTML);
            event.dataTransfer.setData("text/plain", text);
            event.dataTransfer.effectAllowed = "copyMove";
            const blockDom = view.nodeDOM(current.pos);
            if (blockDom instanceof HTMLElement) event.dataTransfer.setDragImage(blockDom, 0, 0);
            (view as unknown as { dragging: { slice: typeof slice; move: boolean } }).dragging = {
              slice,
              move: true,
            };
          });

          handle.addEventListener("dragend", hide);

          const onScroll = () => hide();
          window.addEventListener("scroll", onScroll, true);

          return {
            destroy: () => {
              window.removeEventListener("scroll", onScroll, true);
              handle?.remove();
              handle = null;
            },
          };
        },
        props: {
          handleDOMEvents: {
            mousemove: (view, event) => {
              if (!handle || !view.editable) return false;
              const found = blockAt(view, event.clientX, event.clientY);
              if (!found) return false;
              const dom = view.nodeDOM(found.pos);
              if (!(dom instanceof HTMLElement)) return false;
              current = { pos: found.pos };
              const rect = dom.getBoundingClientRect();
              const styles = window.getComputedStyle(dom);
              const lineHeight = Number.parseFloat(styles.lineHeight) || 24;
              const paddingTop = Number.parseFloat(styles.paddingTop) || 0;
              const top = rect.top + paddingTop + Math.max(0, (lineHeight - 24) / 2);
              handle.style.left = `${rect.left - HANDLE_WIDTH - 8}px`;
              handle.style.top = `${top}px`;
              handle.style.opacity = "1";
              return false;
            },
            keydown: () => {
              hide();
              return false;
            },
            mouseleave: (_view, event) => {
              if (event.relatedTarget !== handle) hide();
              return false;
            },
          },
        },
      }),
    ];
  },
});
