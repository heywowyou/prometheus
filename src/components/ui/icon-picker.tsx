import { useMemo, useState, type ReactNode } from "react";
import { DynamicIcon, iconNames, type IconName } from "lucide-react/dynamic";
import { Search, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import { cn } from "@lib/utils";
import { CURATED_ICONS, ICON_ALIASES, ICON_GROUPS } from "./icon-set";
import { iconNameOf } from "./icon-names";

/**
 * Lucide icons (https://lucide.dev/icons), stored by name ("plane",
 * "book-open"). Curated ones are bundled and draw instantly; any other name
 * loads its icon on demand.
 */

/** Draws a stored icon. `fallback` is shown when there is none. */
export function AppIcon({
  name,
  className,
  strokeWidth = 1.75,
  fallback = null,
}: {
  name?: string | null;
  className?: string;
  strokeWidth?: number;
  fallback?: ReactNode;
}) {
  const resolved = iconNameOf(name);
  if (!resolved) return <>{fallback}</>;
  const Curated = CURATED_ICONS[resolved];
  if (Curated) return <Curated aria-hidden className={cn("shrink-0", className)} strokeWidth={strokeWidth} />;
  return (
    <DynamicIcon
      name={resolved as IconName}
      aria-hidden
      className={cn("shrink-0", className)}
      strokeWidth={strokeWidth}
      fallback={() => <span className={cn("inline-block shrink-0", className)} />}
    />
  );
}

const MAX_RESULTS = 96;

/** Search names: "book" finds book, book-open, notebook…; words in any order. */
const searchIcons = (query: string): string[] => {
  const words = query.toLowerCase().trim().split(/[\s-]+/).filter(Boolean);
  if (words.length === 0) return [];
  // Old alias names still match ("help" finds circle-question-mark), but each
  // drawing is listed once, under its current name. Best rank wins.
  const target = words.join("-");
  const rank = (name: string) => (name === target ? 0 : name.startsWith(words[0] ?? "") ? 1 : 2);
  const best = new Map<string, number>();
  for (const name of iconNames) {
    if (!words.every((word) => name.includes(word))) continue;
    const canonical = ICON_ALIASES[name] ?? name;
    best.set(canonical, Math.min(best.get(canonical) ?? 3, rank(name)));
  }
  return [...best.keys()]
    .sort((a, b) => best.get(a)! - best.get(b)! || a.length - b.length || a.localeCompare(b))
    .slice(0, MAX_RESULTS);
};

/** A popover to pick a Lucide icon: curated groups, or search all of them. */
export function IconPicker({
  value,
  onChange,
  children,
  align = "start",
}: {
  value?: string | null;
  onChange: (icon: string) => void;
  children: ReactNode;
  align?: "start" | "center" | "end";
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchIcons(query), [query]);
  const current = iconNameOf(value);

  const pick = (icon: string) => {
    onChange(icon);
    setOpen(false);
    setQuery("");
  };

  const cell = (name: string) => (
    <button
      key={name}
      type="button"
      onClick={() => pick(name)}
      title={name}
      aria-label={`Use ${name.replace(/-/g, " ")}`}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-lg text-soft hover:bg-secondary hover:text-foreground",
        current === name && "bg-raised text-foreground",
      )}
    >
      <AppIcon name={name} className="h-[18px] w-[18px]" />
    </button>
  );

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align={align} className="w-[22rem] p-3">
        <label className="mb-3 flex items-center gap-2 rounded-xl border border-border bg-secondary px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search all Lucide icons"
            aria-label="Search icons"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </label>
        <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
          {query.trim() ? (
            results.length === 0 ? (
              <p className="px-1 py-6 text-center text-sm text-muted-foreground">No icon called that.</p>
            ) : (
              <div className="grid grid-cols-8 gap-0.5">{results.map(cell)}</div>
            )
          ) : (
            ICON_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="mb-1.5 px-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {group.label}
                </p>
                <div className="grid grid-cols-8 gap-0.5">{group.names.map(cell)}</div>
              </div>
            ))
          )}
        </div>
        {value && (
          <button
            type="button"
            onClick={() => pick("")}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-border py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove icon
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
