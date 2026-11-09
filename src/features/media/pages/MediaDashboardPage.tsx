import { NavLink, Outlet } from "react-router-dom";
import { cn } from "@lib/utils";
import { MEDIA_TYPE_CONFIGS } from "../media-config";

function MediaDashboardPage() {
  return (
    <div>
      <h2 className="page-title mb-4">Media log</h2>
      <nav className="mb-6 flex flex-wrap gap-1 border-b border-border pb-3 text-sm">
        {MEDIA_TYPE_CONFIGS.map((config) => (
          <NavLink
            key={config.slug}
            to={`/media/${config.slug}`}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 font-medium transition-colors",
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
