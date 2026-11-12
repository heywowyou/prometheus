import { useNavigate } from "react-router-dom";
import { Pin, MoreHorizontal } from "lucide-react";
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
  const navigate = useNavigate();
  const isGrid = layout === "grid";
  const inTrash = view === "trash";
  const title = note.title.trim() || "Untitled";
  const open = () => navigate(`/notes/${note._id}`);

  const dateLine =
    inTrash && note.deletedAt
      ? `Deleted ${relativeDate(note.deletedAt).toLowerCase()} · ${daysUntilPurge(
          note.deletedAt,
          TRASH_RETENTION_DAYS,
        )} days left`
      : relativeDate(note.updatedAt);

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={open}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      }}
      className={cn(
        "group relative cursor-pointer rounded-lg border border-border bg-card transition-colors hover:border-rating/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        isGrid ? "flex flex-col p-4" : "flex items-start gap-3 p-3",
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
        <p
          className={cn(
            "truncate text-sm font-medium text-foreground",
            note.fontFamily === "serif" && "font-serif text-base",
          )}
        >
          {title}
        </p>

        {isGrid && (
          <p className="mt-1 line-clamp-3 flex-1 text-xs text-muted-foreground">
            {note.excerpt || "No content"}
          </p>
        )}

        {note.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {note.tags.slice(0, MAX_VISIBLE_TAGS).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onTagClick(tag);
                }}
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] transition-colors",
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

        <p className={cn("text-xs text-muted-foreground", isGrid ? "mt-2" : "mt-1")}>
          {dateLine}
        </p>
      </div>

      <div
        onClick={(event) => event.stopPropagation()}
        className={cn(
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
    </div>
  );
}

export default NoteCard;
