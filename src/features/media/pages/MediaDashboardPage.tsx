import { NavLink, Outlet } from "react-router-dom";

function MediaDashboardPage() {
  const tabs = [
    { to: "/media/movies", label: "Movies" },
    { to: "/media/tv", label: "TV Shows" },
    { to: "/media/books", label: "Books" },
    { to: "/media/music", label: "Music" },
    { to: "/media/games", label: "Games" },
  ];

  return (
    <div>
      <h2 className="page-title mb-4">Media log</h2>
      <nav className="mb-6 flex flex-wrap gap-1 border-b border-border pb-3 text-sm">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `px-4 py-2 rounded-xl transition-colors font-medium ${
                isActive
                  ? "bg-[#5bb8e8] text-[#141414]"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}

export default MediaDashboardPage;
