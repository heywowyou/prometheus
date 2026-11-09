import { SignOutButton } from "@clerk/clerk-react";
import { NavLink } from "react-router-dom";
import { Button } from "@components/ui/button";
import { NAV_ITEMS } from "@app/navigation";
import { cn } from "@lib/utils";
import logo from "../assets/logo.png";

function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-[--navbar]">
      <div className="mx-auto flex h-14 max-w-7xl items-center px-6">
        <img
          src={logo}
          alt="Prometheus"
          className="w-40 shrink-0 object-contain"
        />
        <nav className="flex flex-1 justify-center gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-rating text-rating-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="shrink-0">
          <SignOutButton>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              Sign out
            </Button>
          </SignOutButton>
        </div>
      </div>
    </header>
  );
}

export default Header;
