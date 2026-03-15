import { ReactNode } from "react";
import Header from "../components/Header";
import { NavLink } from "react-router-dom";

interface AppShellProps {
  children: ReactNode;
}

function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background text-text font-sans">
      <Header />
      <div className="max-w-7xl mx-auto px-6 py-6">
        <nav className="mb-8 flex gap-1 border-b border-border pb-3 text-sm">
          {[
            { to: "/todos", label: "Todos" },
            { to: "/media", label: "Media" },
            { to: "/notes", label: "Notes" },
            { to: "/calendar", label: "Calendar" },
            { to: "/workouts", label: "Workouts" },
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-4 py-2 rounded-md transition-colors ${
                  isActive
                    ? "bg-accent text-background font-semibold"
                    : "text-text-muted hover:text-text hover:bg-surface"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <main className="py-4">{children}</main>
      </div>
    </div>
  );
}

export default AppShell;

