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
import type { Note } from "../types/note-types";

interface NoteCardProps {
  note: Note;
  view: "list" | "grid";
  onPin: (id: string, pinned: boolean) => void;
  onDuplicate: (note: Note) => void;
  onToggleArchive: (note: Note) => void;
  onDelete: (note: Note) => void;
}

/** Plain-text preview of a note's Tiptap HTML. */
const stripHtml = (html: string): string =>
  html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function NoteCard({
  note,
  view,
  onPin,
  onDuplicate,
  onToggleArchive,
  onDelete,
}: NoteCardProps) {
  const navigate = useNavigate();
  const isGrid = view === "grid";

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => navigate(`/notes/${note._id}`)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          navigate(`/notes/${note._id}`);
        }
      }}
      className={cn(
        "group relative cursor-pointer rounded-lg border border-border bg-card transition-colors hover:border-rating/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        isGrid ? "flex flex-col p-4" : "flex items-start gap-3 p-3",
      )}
    >
      {note.pinned && (
        <Pin
          className={cn("h-3.5 w-3.5 shrink-0 text-rating", isGrid ? "mb-2" : "mt-1")}
          aria-label="Pinned"
        />
      )}

      <div className={cn("min-w-0 flex-1", isGrid && "flex flex-col")}>
        <p className="truncate text-sm font-medium text-foreground">
          {note.title.trim() || "Untitled"}
        </p>

        {isGrid && (
          <p className="mt-1 line-clamp-3 flex-1 text-xs text-muted-foreground">
            {stripHtml(note.content) || "No content"}
          </p>
        )}

        <p
          className={cn("text-xs text-muted-foreground", isGrid ? "mt-2" : "mt-0.5")}
        >
          {relativeDate(note.updatedAt)}
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
              aria-label={`Actions for ${note.title.trim() || "Untitled"}`}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!note.archived && (
              <DropdownMenuItem onClick={() => onPin(note._id, !note.pinned)}>
                {note.pinned ? "Unpin" : "Pin"}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onDuplicate(note)}>
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onToggleArchive(note)}>
              {note.archived ? "Unarchive" : "Archive"}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(note)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default NoteCard;
