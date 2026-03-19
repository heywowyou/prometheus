import { useNavigate } from "react-router-dom";
import { Pin, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import { Button } from "../../../components/ui/button";
import { cn } from "@lib/utils";
import type { Note } from "../types/note-types";

interface NoteCardProps {
  note: Note;
  view: "list" | "grid";
  onPin: (id: string, pinned: boolean) => void;
  onDuplicate: (note: Note) => void;
  onArchive: (id: string) => void;
  onDelete: (note: Note) => void;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function relativeDate(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  const opts: Intl.DateTimeFormatOptions =
    now.getFullYear() === date.getFullYear()
      ? { month: "short", day: "numeric" }
      : { month: "short", day: "numeric", year: "numeric" };
  return date.toLocaleDateString("en-US", opts);
}

function NoteCard({ note, view, onPin, onDuplicate, onArchive, onDelete }: NoteCardProps) {
  const navigate = useNavigate();
  const preview = stripHtml(note.content);

  return (
    <div
      className={cn(
        "group relative bg-surface border border-border rounded-lg cursor-pointer hover:border-accent/50 transition-colors",
        view === "list" ? "p-3 flex items-start gap-3" : "p-4 flex flex-col"
      )}
      onClick={() => navigate(`/notes/${note._id}`)}
    >
      {/* Pin indicator */}
      {note.pinned && (
        <Pin
          className={cn(
            "text-accent shrink-0",
            view === "list" ? "w-3.5 h-3.5 mt-1" : "w-3.5 h-3.5 mb-2"
          )}
        />
      )}

      <div className={cn("min-w-0", view === "list" ? "flex-1" : "flex-1 flex flex-col")}>
        {/* Title */}
        <p className="text-sm font-medium text-foreground truncate">
          {note.title.trim() || "Untitled"}
        </p>

        {/* Preview */}
        {view === "grid" && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-3 flex-1">
            {preview || "No content"}
          </p>
        )}

        {/* Date */}
        <p className={cn("text-xs text-muted-foreground", view === "grid" ? "mt-2" : "mt-0.5")}>
          {relativeDate(note.updatedAt)}
        </p>
      </div>

      {/* Action menu */}
      <div
        className={cn(
          "shrink-0",
          view === "list"
            ? "opacity-0 group-hover:opacity-100 transition-opacity"
            : "absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onPin(note._id, !note.pinned)}>
              {note.pinned ? "Unpin" : "Pin"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate(note)}>
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onArchive(note._id)}>
              Archive
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
