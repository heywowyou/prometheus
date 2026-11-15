import { NavLink, Outlet } from "react-router-dom";
import { cn } from "@lib/utils";
import { MEDIA_TYPE_CONFIGS } from "../media-config";

function MediaDashboardPage() {
  return (
    <div>
      <h1 className="page-title mb-8 pt-2 sm:pt-6">Media log</h1>
      <nav
        aria-label="Media type"
        className="-mx-5 mb-10 flex overflow-x-auto px-5 sm:mx-0 sm:px-0"
      >
        <div className="flex shrink-0 gap-0.5 rounded-full border border-border bg-card p-1">
        {MEDIA_TYPE_CONFIGS.map((config) => (
          <NavLink
            key={config.slug}
            to={`/media/${config.slug}`}
            className={({ isActive }) =>
              cn(
                "flex h-9 shrink-0 items-center gap-2 rounded-full px-4 text-[13px] transition-colors",
                isActive
                  ? "bg-primary font-semibold text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )
            }
          >
            <config.icon className="h-4 w-4" strokeWidth={1.8} />
            {config.plural}
          </NavLink>
        ))}
        </div>
      </nav>

      <Outlet />
    </div>
  );
}

export default MediaDashboardPage;
