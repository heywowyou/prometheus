import { useUser } from "@clerk/clerk-react";
import { Link, NavLink, useMatch } from "react-router-dom";
import { UserRound } from "lucide-react";
import { DEFAULT_ROUTE, NAV_ITEMS } from "@app/navigation";
import { cn } from "@lib/utils";

/** The serif wordmark, also the way home. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      to={DEFAULT_ROUTE}
      className={cn(
        "font-serif text-[1.625rem] font-medium leading-none text-foreground sm:text-[1.75rem]",
        className,
      )}
    >
      Prometheus
    </Link>
  );
}

/** The avatar opens the profile, which also holds the account actions. */
function ProfileLink() {
  const { user } = useUser();
  return (
    <NavLink
      to="/profile"
      aria-label="Profile"
      className={({ isActive }) =>
        cn(
          "flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-card transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isActive ? "border-rating ring-2 ring-rating/30" : "border-border hover:border-muted-foreground/60",
        )
      }
    >
      {user?.imageUrl ? (
        <img src={user.imageUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <UserRound className="h-4 w-4 text-muted-foreground" />
      )}
    </NavLink>
  );
}

/**
 * Top bar plus, below `lg`, a bottom tab bar: the labelled tabs don't fit
 * next to the wordmark on a phone, and the bottom of the screen is where thumbs are.
 */
function Header() {
  // The workout screen has its own bottom action bar; tabs would sit under thumbs.
  const immersive = useMatch("/workouts/session/:id") !== null;

  return (
    <>
      {/* Top padding clears the iPhone status bar in standalone mode. */}
      <header data-app-chrome className="sticky top-0 z-40 w-full bg-navbar/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-5 sm:px-8 lg:h-20">
          <Wordmark className="shrink-0" />
          <nav
            aria-label="Main"
            className="hidden items-center gap-0.5 rounded-full border border-border bg-card p-1 lg:flex"
          >
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex h-9 items-center rounded-full px-4 text-[13px] transition-colors",
                    isActive
                      ? "bg-primary font-semibold text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <ProfileLink />
        </div>
      </header>

      <nav
        data-app-chrome
        aria-label="Main"
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-navbar/90 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden",
          immersive && "hidden",
        )}
      >
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "group flex min-w-0 flex-1 flex-col items-center gap-1 pb-2 pt-2.5 text-[11px] font-medium transition-colors",
                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    "flex h-8 w-14 items-center justify-center rounded-full transition-colors",
                    isActive ? "bg-raised" : "group-hover:bg-secondary",
                  )}
                >
                  <item.icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2.2 : 1.8} />
                </span>
                <span className="truncate">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
}

export default Header;
