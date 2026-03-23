import { SignOutButton } from "@clerk/clerk-react";
import { NavLink } from "react-router-dom";
import logo from "../assets/logo.png";
import { Button } from "./ui/button";

const navItems = [
  { to: "/todos", label: "Todos" },
  { to: "/media", label: "Media" },
  { to: "/notes", label: "Notes" },
  { to: "/calendar", label: "Calendar" },
  { to: "/workouts", label: "Workouts" },
];

function Header() {
  return (
    <header
      className="w-full sticky top-0 z-40 border-b border-border"
      style={{ backgroundColor: "var(--navbar)" }}
    >
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center">
        <img src={logo} alt="App Logo" className="w-40 object-contain shrink-0" />
        <nav className="flex-1 flex justify-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-4 py-2 rounded-xl transition-colors text-sm font-medium ${
                  isActive
                    ? "bg-[#5bb8e8] text-[#141414]"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="shrink-0">
          <SignOutButton>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              Sign Out
            </Button>
          </SignOutButton>
        </div>
      </div>
    </header>
  );
}

export default Header;
