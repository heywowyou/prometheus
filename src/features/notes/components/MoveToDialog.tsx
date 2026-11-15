import { useMemo, useState } from "react";
import { CornerLeftUp, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@components/ui/dialog";
import { cn } from "@lib/utils";
import { useNoteActions, useNoteIndex } from "../hooks/useNotes";
import { titleOf } from "../note-tree";
import { NoteIcon } from "./PageDecor";

/** Picks a new parent for a page: any page outside its own subtree, or the top level. */
export default function MoveToDialog({ noteId, onClose }: { noteId: string | null; onClose: () => void }) {
  const { tree } = useNoteIndex();
  const actions = useNoteActions();
  const [query, setQuery] = useState("");
  const entry = noteId ? tree.byId.get(noteId) : undefined;

  const targets = useMemo(() => {
    if (!noteId) return [];
    const blocked = tree.descendantsOf(noteId);
    blocked.add(noteId);
    const q = query.trim().toLowerCase();
    return [...tree.byId.values()]
      .filter((page) => !page.isTemplate && !blocked.has(page._id))
      .filter((page) => !q || titleOf(page).toLowerCase().includes(q))
      .sort((a, b) => titleOf(a).localeCompare(titleOf(b)))
      .slice(0, 50);
  }, [noteId, query, tree]);

  const move = async (parentId: string | null) => {
    if (!noteId) return;
    await actions.movePage(noteId, parentId);
    setQuery("");
    onClose();
  };

  return (
    <Dialog
      open={Boolean(noteId)}
      onOpenChange={(open) => {
        if (!open) {
          setQuery("");
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Move “{titleOf(entry)}”</DialogTitle>
          <DialogDescription>Pick the page it should live in.</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search pages"
            aria-label="Search pages"
            className="h-10 w-full rounded-full border border-border bg-background/40 pl-9 pr-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <ul className="-mx-2 max-h-80 overflow-y-auto">
          {entry?.parentId && (
            <li>
              <button
                type="button"
                onClick={() => void move(null)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-secondary"
              >
                <CornerLeftUp className="h-4 w-4 text-muted-foreground" />
                Top level
              </button>
            </li>
          )}
          {targets.map((page) => {
            const path = tree.pathTo(page._id).map(titleOf).join(" / ");
            const current = entry?.parentId === page._id;
            return (
              <li key={page._id}>
                <button
                  type="button"
                  disabled={current}
                  onClick={() => void move(page._id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-secondary disabled:opacity-50",
                  )}
                >
                  <NoteIcon icon={page.icon} className="h-4 w-4" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm">{titleOf(page)}</span>
                    {path && <span className="block truncate text-xs text-muted-foreground">{path}</span>}
                  </span>
                  {current && <span className="ml-auto text-xs text-muted-foreground">Current</span>}
                </button>
              </li>
            );
          })}
          {targets.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">No other pages match.</li>
          )}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
