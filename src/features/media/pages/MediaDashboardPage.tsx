import { NavLink, Outlet } from "react-router-dom";
import { useUser, SignInButton } from "@clerk/clerk-react";

function MediaDashboardPage() {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-[400px] bg-gray-950 text-gray-100 flex justify-center items-center rounded-2xl">
        Loading...
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center mt-20 text-center space-y-6">
        <div className="bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-800 max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-100 mb-3">
            Welcome Back
          </h2>
          <p className="text-gray-400 mb-8">
            Sign in to log movies, shows, books, music, and games.
          </p>
          <SignInButton mode="modal">
            <button className="w-full py-3 px-4 bg-cyan-500 hover:bg-cyan-400 text-gray-900 font-bold rounded-lg transition-all transform hover:scale-[1.02] shadow-lg shadow-cyan-500/20">
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
      <h2 className="text-3xl font-bold text-cloud-400 tracking-tight mb-4">
        Media log
      </h2>
      <nav className="mb-6 flex flex-wrap gap-3 border-b border-gray-800 pb-3 text-sm">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-md transition-colors ${
                isActive
                  ? "bg-cyan-500 text-gray-900 font-semibold"
                  : "text-cloud-400 hover:text-white hover:bg-gray-800"
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
