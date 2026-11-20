import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Archive,
  ArchiveRestore,
  Copy,
  FileText,
  MoreHorizontal,
  Pin,
  PinOff,
  RotateCcw,
  Shredder,
  Trash2,
} from "lucide-react";
import { ActionSheet, type SheetAction } from "@components/ui/action-sheet";
import { useLongPress } from "@lib/hooks/useLongPress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import { Button } from "@components/ui/button";
import { cn } from "@lib/utils";
import { relativeDate } from "@lib/date/relative";
import { daysUntilPurge } from "../note-utils";
import {
  TRASH_RETENTION_DAYS,
  type NoteSummary,
  type NotesView,
} from "../types/note-types";

export interface NoteCardActions {
  onPin: (id: string, pinned: boolean) => void;
  onDuplicate: (id: string) => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
  onTrash: (id: string) => void;
  onRestore: (id: string) => void;
  onDeleteForever: (note: NoteSummary) => void;
  onTagClick: (tag: string) => void;
}

interface NoteCardProps extends NoteCardActions {
  note: NoteSummary;
  layout: "list" | "grid";
  /** The view the card is shown in; decides its menu and whether it opens. */
  view: NotesView;
  /** Highlighted tag filter, if any. */
  activeTag?: string;
}

const MAX_VISIBLE_TAGS = 3;

function NoteCard({
  note,
  layout,
  view,
  activeTag,
  onPin,
  onDuplicate,
  onArchive,
  onUnarchive,
  onTrash,
  onRestore,
  onDeleteForever,
  onTagClick,
}: NoteCardProps) {
  const isGrid = layout === "grid";
  const inTrash = view === "trash";
  const title = note.title.trim() || "Untitled";

  const dateLine =
    inTrash && note.deletedAt
      ? `Deleted ${relativeDate(note.deletedAt).toLowerCase()} · ${daysUntilPurge(
          note.deletedAt,
          TRASH_RETENTION_DAYS,
        )} days left`
      : relativeDate(note.updatedAt);

  // Phones: press and hold the card for its actions (the same as the menu).
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);
  const longPress = useLongPress(() => setSheetOpen(true));
  const sheetActions: SheetAction[] = inTrash
    ? [
        { key: "restore", label: "Restore", icon: RotateCcw, onSelect: () => onRestore(note._id) },
        {
          key: "delete",
          label: "Delete forever",
          icon: Shredder,
          destructive: true,
          // Asks in its own dialog.
          confirm: false,
          onSelect: () => onDeleteForever(note),
        },
      ]
    : [
        { key: "open", label: "Open", icon: FileText, onSelect: () => navigate(`/notes/${note._id}`) },
        ...(!note.archived
          ? [
              {
                key: "pin",
                label: note.pinned ? "Unpin" : "Pin",
                icon: note.pinned ? PinOff : Pin,
                onSelect: () => onPin(note._id, !note.pinned),
              },
            ]
          : []),
        { key: "duplicate", label: "Duplicate", icon: Copy, onSelect: () => onDuplicate(note._id) },
        {
          key: "archive",
          label: note.archived ? "Unarchive" : "Archive",
          icon: note.archived ? ArchiveRestore : Archive,
          onSelect: () => (note.archived ? onUnarchive(note._id) : onArchive(note._id)),
        },
        {
          key: "trash",
          label: "Move to trash",
          icon: Trash2,
          destructive: true,
          // The trash keeps it for a while; no second tap needed.
          confirm: false,
          onSelect: () => onTrash(note._id),
        },
      ];

  return (
    // Stretched link: the title link covers the whole card, and the tag and
    // menu buttons sit above it, so no interactive element is nested in another.
    <div
      {...longPress}
      className={cn(
        "group relative select-none transition-colors [-webkit-touch-callout:none] has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring",
        isGrid
          ? "flex min-h-[10rem] flex-col rounded-3xl border border-border bg-card p-5 hover:border-muted-foreground/50"
          : "flex items-start gap-3 border-t border-border py-4",
        inTrash && "opacity-75",
      )}
    >
      {note.pinned && !inTrash && (
        <Pin
          className={cn("h-3.5 w-3.5 shrink-0 text-rating", isGrid ? "mb-2" : "mt-1")}
          aria-label="Pinned"
        />
      )}

      <div className={cn("min-w-0 flex-1", isGrid && "flex flex-col pr-6")}>
        <Link
          to={`/notes/${note._id}`}
          className={cn(
            "block truncate font-serif text-xl leading-snug text-foreground transition-colors outline-none before:absolute before:inset-0 group-hover:text-rating",
            !note.title.trim() && "italic text-soft",
          )}
        >
          {title}
        </Link>

        {isGrid && (
          <p className="mt-2 line-clamp-3 flex-1 text-[13px] leading-relaxed text-muted-foreground">
            {note.excerpt || "No content"}
          </p>
        )}

        {note.tags.length > 0 && (
          <div className="relative z-10 mt-2 flex w-fit flex-wrap gap-1">
            {note.tags.slice(0, MAX_VISIBLE_TAGS).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onTagClick(tag);
                }}
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] transition-colors",
                  tag === activeTag
                    ? "bg-rating/15 text-rating"
                    : "bg-secondary text-muted-foreground hover:text-foreground",
                )}
              >
                #{tag}
              </button>
            ))}
            {note.tags.length > MAX_VISIBLE_TAGS && (
              <span className="px-1 text-[10px] text-muted-foreground">
                +{note.tags.length - MAX_VISIBLE_TAGS}
              </span>
            )}
          </div>
        )}

        <p className={cn("text-xs text-muted-foreground", isGrid ? "mt-3" : "mt-1")}>
          {dateLine}
        </p>
      </div>

      <div
        className={cn(
          "relative z-10",
          // Hover reveals the menu on desktop; keyboard focus, an open menu and
          // touch screens (no hover) keep it visible.
          "shrink-0 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 has-[[data-state=open]]:opacity-100 touch:opacity-100",
          isGrid && "absolute right-3 top-3",
        )}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Actions for ${title}`}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {inTrash ? (
              <>
                <DropdownMenuItem onClick={() => onRestore(note._id)}>
                  Restore
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDeleteForever(note)}
                >
                  Delete forever
                </DropdownMenuItem>
              </>
            ) : (
              <>
                {!note.archived && (
                  <DropdownMenuItem onClick={() => onPin(note._id, !note.pinned)}>
                    {note.pinned ? "Unpin" : "Pin"}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onDuplicate(note._id)}>
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    note.archived ? onUnarchive(note._id) : onArchive(note._id)
                  }
                >
                  {note.archived ? "Unarchive" : "Archive"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onTrash(note._id)}
                >
                  Move to trash
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <ActionSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={title}
        description={dateLine}
        actions={sheetActions}
      />
    </div>
  );
}

export default NoteCard;
