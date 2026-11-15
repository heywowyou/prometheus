import { createContext, useContext, useEffect, useState, type DragEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Archive,
  ChevronRight,
  Copy,
  CornerUpRight,
  MoreHorizontal,
  Plus,
  Star,
  StarOff,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import { useLocalStorage } from "@lib/hooks/useLocalStorage";
import { cn } from "@lib/utils";
import { useNoteActions } from "../hooks/useNotes";
import { titleOf, type NoteTree } from "../note-tree";
import type { NoteIndexEntry } from "../types/note-types";
import { NoteIcon } from "./PageDecor";
import MoveToDialog from "./MoveToDialog";

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

type DropZone = "before" | "inside" | "after";

interface TreeState {
  tree: NoteTree;
  activeId?: string;
  expanded: Set<string>;
  toggle: (id: string, open?: boolean) => void;
  dragId: string | null;
  setDragId: (id: string | null) => void;
  onNavigate?: () => void;
  moveRequest: (id: string) => void;
}

const TreeContext = createContext<TreeState | null>(null);
const useTree = () => {
  const value = useContext(TreeContext);
  if (!value) throw new Error("PageTree rows must render inside PageTree");
  return value;
};

/** Where a drop would land, from the pointer's height within a row. */
const zoneOf = (event: DragEvent<HTMLElement>): DropZone => {
  const rect = event.currentTarget.getBoundingClientRect();
  const y = (event.clientY - rect.top) / rect.height;
  return y < 0.28 ? "before" : y > 0.72 ? "after" : "inside";
};

/** Row actions shared by the tree and the Favorites list. */
export function PageMenu({
  entry,
  onMove,
  onNavigate,
}: {
  entry: NoteIndexEntry;
  onMove: () => void;
  onNavigate?: () => void;
}) {
  const navigate = useNavigate();
  const actions = useNoteActions();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Actions for ${titleOf(entry)}`}
          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-raised hover:text-foreground"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuItem onClick={() => actions.setPinned(entry._id, !entry.pinned)}>
          {entry.pinned ? <StarOff className="h-4 w-4" /> : <Star className="h-4 w-4" />}
          {entry.pinned ? "Remove from favorites" : "Add to favorites"}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            void actions.duplicateNote(entry._id).then((copy) => {
              onNavigate?.();
              navigate(`/notes/${copy._id}`);
            })
          }
        >
          <Copy className="h-4 w-4" />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onMove}>
          <CornerUpRight className="h-4 w-4" />
          Move to…
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => actions.archiveNote(entry._id)}>
          <Archive className="h-4 w-4" />
          Archive
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => actions.trashNote(entry._id)}
        >
          <Trash2 className="h-4 w-4" />
          Move to trash
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TreeRow({ entry, depth }: { entry: NoteIndexEntry; depth: number }) {
  const state = useTree();
  const navigate = useNavigate();
  const actions = useNoteActions();
  const [zone, setZone] = useState<DropZone | null>(null);

  const children = state.tree.childrenOf(entry._id);
  const open = state.expanded.has(entry._id);
  const active = state.activeId === entry._id;
  const dragging = state.dragId !== null;
  const blocked =
    state.dragId === entry._id ||
    (state.dragId !== null && state.tree.descendantsOf(state.dragId).has(entry._id));

  const addChild = async () => {
    const note = await actions.createNote({ parentId: entry._id });
    state.toggle(entry._id, true);
    state.onNavigate?.();
    navigate(`/notes/${note._id}`);
  };

  const drop = async (where: DropZone) => {
    const dragId = state.dragId;
    state.setDragId(null);
    if (!dragId || blocked) return;
    const dragged = state.tree.byId.get(dragId);
    if (!dragged) return;

    if (where === "inside") {
      if (dragged.parentId !== entry._id) await actions.movePage(dragId, entry._id);
      state.toggle(entry._id, true);
      return;
    }
    const parentId = entry.parentId && state.tree.byId.has(entry.parentId) ? entry.parentId : null;
    if ((dragged.parentId ?? null) !== parentId) await actions.movePage(dragId, parentId);
    const siblings = state.tree
      .childrenOf(parentId)
      .map((sibling) => sibling._id)
      .filter((id) => id !== dragId);
    const at = siblings.indexOf(entry._id) + (where === "after" ? 1 : 0);
    siblings.splice(at, 0, dragId);
    await actions.reorderPages(parentId, siblings);
  };

  return (
    <li>
      <div
        draggable
        onDragStart={(event) => {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", titleOf(entry));
          state.setDragId(entry._id);
        }}
        onDragEnd={() => {
          state.setDragId(null);
          setZone(null);
        }}
        onDragOver={(event) => {
          if (!dragging || blocked) return;
          event.preventDefault();
          setZone(zoneOf(event));
        }}
        onDragLeave={() => setZone(null)}
        onDrop={(event) => {
          event.preventDefault();
          const where = zoneOf(event);
          setZone(null);
          void drop(where);
        }}
        className={cn(
          "group relative flex h-8 items-center gap-1 rounded-lg pr-1 text-sm transition-colors",
          active ? "bg-raised text-foreground" : "text-soft hover:bg-secondary hover:text-foreground",
          zone === "inside" && "bg-rating/15 ring-1 ring-rating/60",
          state.dragId === entry._id && "opacity-50",
        )}
        style={{ paddingLeft: `${depth * 14 + 4}px` }}
      >
        {zone === "before" && <span className="absolute inset-x-1 -top-px h-0.5 rounded bg-rating" />}
        {zone === "after" && <span className="absolute inset-x-1 -bottom-px h-0.5 rounded bg-rating" />}
        <button
          type="button"
          aria-label={open ? `Collapse ${titleOf(entry)}` : `Expand ${titleOf(entry)}`}
          aria-expanded={open}
          onClick={() => state.toggle(entry._id)}
          className={cn(
            "flex h-6 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground",
            children.length === 0 && "invisible",
          )}
        >
          <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-90")} />
        </button>
        <Link
          to={`/notes/${entry._id}`}
          onClick={state.onNavigate}
          className="flex min-w-0 flex-1 items-center gap-2 py-1"
          aria-current={active ? "page" : undefined}
        >
          <NoteIcon icon={entry.icon} className="h-4 w-4 text-[0.95rem]" />
          <span className={cn("truncate", !entry.title.trim() && "text-muted-foreground")}>
            {titleOf(entry)}
          </span>
        </Link>
        <span className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100 has-[[data-state=open]]:opacity-100 touch:opacity-100">
          <PageMenu entry={entry} onMove={() => state.moveRequest(entry._id)} onNavigate={state.onNavigate} />
          <button
            type="button"
            aria-label={`Add a page inside ${titleOf(entry)}`}
            onClick={() => void addChild()}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-raised hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
          </button>
        </span>
      </div>
      {open && children.length > 0 && (
        <ul>
          {children.map((child) => (
            <TreeRow key={child._id} entry={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

/**
 * The nested page tree. Drag a row onto another to nest it, or onto its top
 * or bottom edge to reorder; on touch screens, use "Move to…".
 */
export default function PageTree({
  tree,
  activeId,
  onNavigate,
}: {
  tree: NoteTree;
  activeId?: string;
  onNavigate?: () => void;
}) {
  const actions = useNoteActions();
  const [expandedList, setExpandedList] = useLocalStorage<string[]>("notes-expanded", [], isStringArray);
  const [dragId, setDragId] = useState<string | null>(null);
  const [rootZone, setRootZone] = useState(false);
  const [moving, setMoving] = useState<string | null>(null);
  const expanded = new Set(expandedList);

  // Opening a page reveals it in the tree.
  useEffect(() => {
    if (!activeId) return;
    const path = tree.pathTo(activeId).map((entry) => entry._id);
    if (path.some((id) => !expandedList.includes(id))) {
      setExpandedList([...new Set([...expandedList, ...path])]);
    }
  }, [activeId, tree, expandedList, setExpandedList]);

  const toggle = (id: string, open?: boolean) => {
    const next = open ?? !expanded.has(id);
    setExpandedList(next ? [...new Set([...expandedList, id])] : expandedList.filter((item) => item !== id));
  };

  const dropAtRoot = async () => {
    const id = dragId;
    setDragId(null);
    setRootZone(false);
    if (!id) return;
    const dragged = tree.byId.get(id);
    if (dragged?.parentId) await actions.movePage(id, null);
  };

  return (
    <TreeContext.Provider
      value={{
        tree,
        activeId,
        expanded,
        toggle,
        dragId,
        setDragId,
        onNavigate,
        moveRequest: setMoving,
      }}
    >
      <ul>
        {tree.roots.map((entry) => (
          <TreeRow key={entry._id} entry={entry} depth={0} />
        ))}
      </ul>
      {dragId && tree.byId.get(dragId)?.parentId && (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setRootZone(true);
          }}
          onDragLeave={() => setRootZone(false)}
          onDrop={(event) => {
            event.preventDefault();
            void dropAtRoot();
          }}
          className={cn(
            "mt-1 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground",
            rootZone && "border-rating bg-rating/10 text-foreground",
          )}
        >
          Drop here to move to the top level
        </div>
      )}
      <MoveToDialog noteId={moving} onClose={() => setMoving(null)} />
    </TreeContext.Provider>
  );
}
