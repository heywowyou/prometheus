import Header from "../components/Header";
import { NavLink } from "react-router-dom";

function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-powder-900 text-gray-100 font-sans">
      <Header />
      <div className="max-w-7xl mx-auto px-6 py-6">
        <nav className="mb-8 flex gap-4 border-b border-gray-800 pb-3 text-sm">
          <NavLink
            to="/todos"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-md transition-colors ${
                isActive
                  ? "bg-cyan-500 text-gray-900 font-semibold"
                  : "text-cloud-400 hover:text-white hover:bg-gray-800"
              }`
            }
          >
            Todos
          </NavLink>
          <NavLink
            to="/media"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-md transition-colors ${
                isActive
                  ? "bg-cyan-500 text-gray-900 font-semibold"
                  : "text-cloud-400 hover:text-white hover:bg-gray-800"
              }`
            }
          >
            Media
          </NavLink>
          <NavLink
            to="/notes"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-md transition-colors ${
                isActive
                  ? "bg-cyan-500 text-gray-900 font-semibold"
                  : "text-cloud-400 hover:text-white hover:bg-gray-800"
              }`
            }
          >
            Notes
          </NavLink>
          <NavLink
            to="/calendar"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-md transition-colors ${
                isActive
                  ? "bg-cyan-500 text-gray-900 font-semibold"
                  : "text-cloud-400 hover:text-white hover:bg-gray-800"
              }`
            }
          >
            Calendar
          </NavLink>
          <NavLink
            to="/workouts"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-md transition-colors ${
                isActive
                  ? "bg-cyan-500 text-gray-900 font-semibold"
                  : "text-cloud-400 hover:text-white hover:bg-gray-800"
              }`
            }
          >
            Workouts
          </NavLink>
        </nav>
        <main className="py-4">{children}</main>
      </div>
    </div>
  );
}

export default AppShell;

