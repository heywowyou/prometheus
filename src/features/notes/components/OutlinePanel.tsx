import type { TableOfContentData } from "@tiptap/extension-table-of-contents";
import { cn } from "@lib/utils";

/** The page's headings; clicking one scrolls to it. */
export default function OutlinePanel({
  items,
  onPick,
  className,
}: {
  items: TableOfContentData;
  onPick?: () => void;
  className?: string;
}) {
  if (items.length === 0) {
    return <p className={cn("text-sm text-muted-foreground", className)}>Headings you add show up here.</p>;
  }
  return (
    <nav aria-label="Outline" className={className}>
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => {
                item.dom.scrollIntoView({ behavior: "smooth", block: "start" });
                onPick?.();
              }}
              style={{ paddingLeft: `${(item.level - 1) * 12 + 8}px` }}
              className={cn(
                "block w-full truncate rounded-md py-1 pr-2 text-left text-[13px] transition-colors hover:text-foreground",
                item.isActive ? "text-foreground" : item.isScrolledOver ? "text-muted-foreground" : "text-soft",
              )}
            >
              {item.textContent || "Untitled heading"}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
