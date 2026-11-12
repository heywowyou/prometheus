import { useId, useState, type KeyboardEvent } from "react";
import { Hash, X } from "lucide-react";
import { MAX_TAGS, normaliseTag } from "../note-utils";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  /** Existing tags, offered as completions. */
  suggestions?: string[];
  disabled?: boolean;
}

/** Tag chips plus a free-text input: Enter or comma adds, Backspace removes. */
function TagInput({ value, onChange, suggestions = [], disabled }: TagInputProps) {
  const listId = useId();
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const tag = normaliseTag(raw);
    setDraft("");
    if (!tag || value.includes(tag) || value.length >= MAX_TAGS) return;
    onChange([...value, tag]);
  };

  const remove = (tag: string) => onChange(value.filter((t) => t !== tag));

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      add(draft);
    } else if (event.key === "Backspace" && draft === "" && value.length > 0) {
      remove(value[value.length - 1] as string);
    }
  };

  const available = suggestions.filter((tag) => !value.includes(tag));

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {value.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-0.5 rounded-full border border-border bg-secondary px-2 py-0.5 text-xs text-muted-foreground"
        >
          <Hash className="h-3 w-3" />
          {tag}
          {!disabled && (
            <button
              type="button"
              onClick={() => remove(tag)}
              aria-label={`Remove tag ${tag}`}
              className="ml-0.5 rounded-full hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}
      {!disabled && value.length < MAX_TAGS && (
        <>
          <input
            type="text"
            value={draft}
            onChange={(event) => {
              // Picking a datalist completion fires a replacement input (or a
              // plain Event in Firefox), not typed text. Only then add at once:
              // typing "art" must not commit an existing "art" on the way to
              // "artist".
              const next = event.target.value;
              const inputType = (event.nativeEvent as InputEvent).inputType;
              const picked =
                inputType === undefined || inputType === "insertReplacementText";
              if (picked && available.includes(next)) add(next);
              else setDraft(next);
            }}
            onKeyDown={handleKeyDown}
            onBlur={() => draft.trim() && add(draft)}
            list={listId}
            placeholder={value.length === 0 ? "Add tags…" : "Add tag"}
            aria-label="Add tag"
            className="min-w-[6rem] flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
          />
          <datalist id={listId}>
            {available.map((tag) => (
              <option key={tag} value={tag} />
            ))}
          </datalist>
        </>
      )}
    </div>
  );
}

export default TagInput;
