import { useState } from "react";
import { History, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@components/ui/dialog";
import { cn } from "@lib/utils";
import { useNoteActions, useNoteVersion, useNoteVersions } from "../hooks/useNotes";
import NoteRender from "./NoteRender";

const formatWhen = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

/** Snapshots of a page (one every ten minutes of editing at most), with a preview and restore. */
export default function VersionHistoryDialog({
  noteId,
  open,
  serif,
  beforeRestore,
  onOpenChange,
  onRestored,
}: {
  noteId: string;
  open: boolean;
  serif?: boolean;
  /** Flushes pending edits, so they get snapshotted rather than lost. */
  beforeRestore: () => Promise<unknown>;
  onOpenChange: (open: boolean) => void;
  onRestored: () => void;
}) {
  const versions = useNoteVersions(noteId, open);
  const [selected, setSelected] = useState<string | null>(null);
  const current = selected ?? versions.data?.[0]?._id ?? null;
  const version = useNoteVersion(noteId, current);
  const actions = useNoteActions();
  const [restoring, setRestoring] = useState(false);

  const restore = async () => {
    if (!current) return;
    setRestoring(true);
    try {
      await beforeRestore();
      await actions.restoreVersion(noteId, current);
      toast("Version restored", { description: "The page before the restore was kept in the history." });
      onOpenChange(false);
      onRestored();
    } finally {
      setRestoring(false);
    }
  };

  const list = versions.data ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(80vh,720px)] max-w-4xl flex-col gap-0 overflow-hidden p-0">
        <div className="border-b border-border px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base font-medium">
            <History className="h-4 w-4 text-muted-foreground" /> Page history
          </DialogTitle>
          <DialogDescription className="text-xs">
            A snapshot is kept every ten minutes of editing, up to the last 50.
          </DialogDescription>
        </div>
        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
          <ul className="flex shrink-0 gap-1 overflow-x-auto border-b border-border p-2 sm:w-56 sm:flex-col sm:overflow-y-auto sm:border-b-0 sm:border-r">
            {versions.isPending && (
              <li className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
              </li>
            )}
            {!versions.isPending && list.length === 0 && (
              <li className="px-3 py-2 text-sm text-muted-foreground">No earlier versions yet.</li>
            )}
            {list.map((entry) => (
              <li key={entry._id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setSelected(entry._id)}
                  className={cn(
                    "w-full rounded-xl px-3 py-2 text-left text-sm transition-colors",
                    entry._id === current ? "bg-raised text-foreground" : "text-soft hover:bg-secondary",
                  )}
                >
                  <span className="block whitespace-nowrap">{formatWhen(entry.createdAt)}</span>
                  <span className="hidden truncate text-xs text-muted-foreground sm:block">
                    {entry.title || "Untitled"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {version.data ? (
              <>
                <h2 className="mb-4 font-serif text-3xl text-foreground">{version.data.title || "Untitled"}</h2>
                <NoteRender key={version.data._id} html={version.data.content} serif={serif} />
              </>
            ) : current ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading version…
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button disabled={!current || restoring} onClick={() => void restore()}>
            {restoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            Restore this version
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
