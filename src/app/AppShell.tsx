import { ReactNode } from "react";
import Header from "../components/Header";
import { NavLink } from "react-router-dom";

interface AppShellProps {
  children: ReactNode;
}

function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-powder-900 text-gray-100 font-sans">
      <Header />
      <div className="max-w-7xl mx-auto px-6 py-6">
        <nav className="mb-8 flex gap-4 border-b border-gray-800 pb-3 text-sm">
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
                `px-3 py-1.5 rounded-md transition-colors ${
                  isActive
                    ? "bg-cyan-500 text-gray-900 font-semibold"
                    : "text-cloud-400 hover:text-white hover:bg-gray-800"
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

