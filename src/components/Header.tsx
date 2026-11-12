import { UserButton } from "@clerk/clerk-react";
import { NavLink } from "react-router-dom";
import { NAV_ITEMS } from "@app/navigation";
import { cn } from "@lib/utils";
import logo from "../assets/logo.png";

/**
 * Top bar plus, below `lg`, a bottom tab bar: five labelled tabs don't fit
 * next to the logo on a phone, and the bottom of the screen is where thumbs are.
 */
function Header() {
  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border bg-[--navbar]/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <img
            src={logo}
            alt="Prometheus"
            className="w-32 shrink-0 object-contain sm:w-40"
          />
          <nav
            aria-label="Main"
            className="hidden flex-1 justify-center gap-1 lg:flex"
          >
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-rating text-rating-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )
                }
              >
                <item.icon className="h-4 w-4" strokeWidth={2} />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="shrink-0">
            <UserButton />
          </div>
        </div>
      </header>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-[--navbar]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      >
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors",
                isActive
                  ? "text-rating"
                  : "text-muted-foreground hover:text-foreground",
              )
            }
          >
            <item.icon className="h-5 w-5" strokeWidth={2} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}

export default Header;
