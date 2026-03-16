import { NavLink, Outlet } from "react-router-dom";
import { useUser, SignInButton } from "@clerk/clerk-react";

function MediaDashboardPage() {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-[400px] bg-surface flex justify-center items-center rounded-2xl border border-border">
        <span className="text-text-muted">Loading...</span>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center mt-20 text-center space-y-6">
        <div className="bg-surface p-8 rounded-2xl shadow-xl border border-border max-w-md w-full">
          <h2 className="font-sans text-2xl font-bold text-text mb-3">
            Welcome Back
          </h2>
          <p className="text-text-muted mb-8">
            Sign in to log movies, shows, books, music, and games.
          </p>
          <SignInButton mode="modal">
            <button className="btn-primary w-full py-3 px-4">
              Sign In to Continue
            </button>
          </SignInButton>
        </div>
      </div>
    );
  }

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
  );
}

export default MediaDashboardPage;
