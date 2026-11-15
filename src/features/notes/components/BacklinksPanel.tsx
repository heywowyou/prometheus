import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Link2 } from "lucide-react";
import { cn } from "@lib/utils";
import { useBacklinks } from "../hooks/useNotes";
import type { BacklinkEntry } from "../types/note-types";
import { NoteIcon } from "./PageDecor";

/** Wraps each case-insensitive occurrence of `needle` in a <mark>. */
function Highlighted({ text, needle }: { text: string; needle?: string }) {
  if (!needle) return <>{text}</>;
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === needle.toLowerCase() ? (
          <mark key={index} className="rounded bg-rating/20 px-0.5 text-foreground">
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

function Group({
  title,
  entries,
  needle,
  defaultOpen,
  empty,
}: {
  title: string;
  entries: BacklinkEntry[];
  needle?: string;
  defaultOpen: boolean;
  empty: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-1.5 py-1.5 text-sm text-soft hover:text-foreground"
      >
        <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-90")} />
        {title}
        <span className="text-muted-foreground">{entries.length}</span>
      </button>
      {open && (
        <ul className="mt-1 space-y-1.5 pl-5">
          {entries.length === 0 && <li className="text-sm text-muted-foreground">{empty}</li>}
          {entries.map((entry) => (
            <li key={entry._id}>
              <Link
                to={`/notes/${entry._id}`}
                className="block rounded-xl border border-border bg-card px-3.5 py-2.5 transition-colors hover:border-rating/40"
              >
                <span className="flex items-center gap-2 text-sm text-foreground">
                  <NoteIcon icon={entry.icon} className="h-3.5 w-3.5" />
                  <span className="truncate">{entry.title || "Untitled"}</span>
                </span>
                {entry.snippet && (
                  <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-muted-foreground">
                    <Highlighted text={entry.snippet} needle={needle} />
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Pages linking here, and pages naming this one without a link (Obsidian-style). */
export default function BacklinksPanel({ noteId, title }: { noteId: string; title: string }) {
  const { data, isPending } = useBacklinks(noteId);
  if (isPending || !data) return null;
  if (data.linked.length === 0 && data.unlinked.length === 0) return null;

  return (
    <section className="mt-14 border-t border-border pt-5" aria-label="Backlinks">
      <h2 className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        <Link2 className="h-3.5 w-3.5" /> Backlinks
      </h2>
      <Group
        title="Linked mentions"
        entries={data.linked}
        defaultOpen
        empty="No page links here yet. Type [[ in another page to link it."
      />
      <Group
        title="Unlinked mentions"
        entries={data.unlinked}
        needle={title.trim() || undefined}
        defaultOpen={data.linked.length === 0}
        empty="No other page mentions this title."
      />
    </section>
  );
}
