import { NavLink, Outlet } from "react-router-dom";
import AuthGuard from "../../../components/AuthGuard";

function MediaDashboardPage() {
  const tabs = [
    { to: "/media/movies", label: "Movies" },
    { to: "/media/tv", label: "TV Shows" },
    { to: "/media/books", label: "Books" },
    { to: "/media/music", label: "Music" },
    { to: "/media/games", label: "Games" },
  ];

  return (
    <AuthGuard description="Sign in to log movies, shows, books, music, and games.">
    <div>
      <h2 className="page-title mb-4">Media log</h2>
      <nav className="mb-6 flex flex-wrap gap-1 border-b border-border pb-3 text-sm">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `px-4 py-2 rounded-md transition-colors ${
                isActive
                  ? "bg-accent text-background font-semibold"
                  : "text-text-muted hover:text-text hover:bg-surface"
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
    </AuthGuard>
  );
}

export default MediaDashboardPage;
