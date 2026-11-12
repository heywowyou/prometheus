import { NavLink, Outlet } from "react-router-dom";
import { cn } from "@lib/utils";
import { MEDIA_TYPE_CONFIGS } from "../media-config";

function MediaDashboardPage() {
  return (
    <div>
      <h2 className="page-title mb-4">Media log</h2>
      <nav className="-mx-4 mb-6 flex gap-1 overflow-x-auto border-b border-border px-4 pb-3 text-sm sm:mx-0 sm:px-0">
        {MEDIA_TYPE_CONFIGS.map((config) => (
          <NavLink
            key={config.slug}
            to={`/media/${config.slug}`}
            className={({ isActive }) =>
              cn(
                "flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 font-medium transition-colors",
                isActive
                  ? "bg-rating text-rating-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )
            }
          >
            <config.icon className="h-4 w-4" strokeWidth={2} />
            {config.plural}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}

export default MediaDashboardPage;
