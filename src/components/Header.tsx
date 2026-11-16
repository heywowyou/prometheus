import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { Link, NavLink, useLocation, useMatch } from "react-router-dom";
import { Ellipsis, Search, UserRound } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@components/ui/sheet";
import { DEFAULT_ROUTE, MORE_ITEMS, NAV_ITEMS, PHONE_TABS } from "@app/navigation";
import { useCommandPalette } from "@app/command-palette";
import { cn } from "@lib/utils";
import FocusPill from "@features/focus/components/FocusPill";

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

/** Search and quick add, everywhere: a pill on desktop, an icon on phones. */
function SearchButton() {
  const palette = useCommandPalette();
  return (
    <button
      type="button"
      onClick={() => palette.open()}
      aria-label="Search or add (Ctrl K)"
      className="flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-border bg-card px-3 text-sm text-muted-foreground transition-colors hover:border-muted-foreground/60 hover:text-foreground xl:w-40"
    >
      <Search className="h-4 w-4 shrink-0" />
      <span className="hidden xl:inline">Search</span>
      <kbd className="ml-auto hidden rounded border border-border px-1 font-sans text-[10px] xl:inline">Ctrl K</kbd>
    </button>
  );
}

function TabLink({ to, label, icon: Icon }: { to: string; label: string; icon: typeof Search }) {
  return (
    <NavLink
      to={to}
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
            <Icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2.2 : 1.8} />
          </span>
          <span className="truncate">{label}</span>
        </>
      )}
    </NavLink>
  );
}

/**
 * Top bar plus, below `lg`, a bottom tab bar: the labelled tabs don't fit
 * next to the wordmark on a phone, and the bottom of the screen is where thumbs are.
 */
function Header({ wide = false }: { wide?: boolean }) {
  const { pathname } = useLocation();
  const palette = useCommandPalette();
  const [moreOpen, setMoreOpen] = useState(false);
  const [moreFor, setMoreFor] = useState(pathname);
  // The workout screen has its own bottom action bar; tabs would sit under thumbs.
  const immersive = useMatch("/workouts/session/:id") !== null;
  const inMore = MORE_ITEMS.some((item) => pathname.startsWith(item.to));

  // Navigating closes the More sheet.
  if (moreFor !== pathname) {
    setMoreFor(pathname);
    setMoreOpen(false);
  }

  return (
    <>
      {/* Top padding clears the iPhone status bar in standalone mode. */}
      <header data-app-chrome className="sticky top-0 z-40 w-full bg-navbar/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div
          className={cn(
            "mx-auto flex h-16 items-center justify-between gap-4 px-5 sm:px-8 lg:h-20",
            wide ? "max-w-[1480px]" : "max-w-6xl",
          )}
        >
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
                    "flex h-9 items-center rounded-full px-3.5 text-[13px] transition-colors",
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
          <div className="flex items-center gap-2">
            <FocusPill />
            <SearchButton />
            <ProfileLink />
          </div>
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
        {PHONE_TABS.map((item) => (
          <TabLink key={item.to} {...item} />
        ))}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-label="More: calendar, workouts, media and profile"
          className={cn(
            "group flex min-w-0 flex-1 flex-col items-center gap-1 pb-2 pt-2.5 text-[11px] font-medium transition-colors",
            inMore ? "text-foreground" : "text-muted-foreground",
          )}
        >
          <span
            className={cn(
              "flex h-8 w-14 items-center justify-center rounded-full transition-colors",
              inMore ? "bg-raised" : "group-hover:bg-secondary",
            )}
          >
            <Ellipsis className="h-[18px] w-[18px]" strokeWidth={inMore ? 2.2 : 1.8} />
          </span>
          <span>{inMore ? (MORE_ITEMS.find((item) => pathname.startsWith(item.to))?.label ?? "More") : "More"}</span>
        </button>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent className="gap-3">
          <SheetTitle className="px-1 font-serif text-2xl font-normal">More</SheetTitle>
          <SheetDescription className="sr-only">Calendar, workouts, media and profile</SheetDescription>
          <div className="grid grid-cols-2 gap-2">
            {MORE_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col gap-3 rounded-2xl border p-4 transition-colors",
                    isActive ? "border-rating/50 bg-rating/10" : "border-border bg-secondary/40 hover:bg-secondary",
                  )
                }
              >
                <item.icon className="h-5 w-5 text-soft" />
                <span className="text-[15px] text-foreground">{item.label}</span>
              </NavLink>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setMoreOpen(false);
              palette.open();
            }}
            className="flex h-12 items-center gap-3 rounded-2xl border border-border px-4 text-sm text-muted-foreground"
          >
            <Search className="h-4 w-4" /> Search or add anything
          </button>
        </SheetContent>
      </Sheet>
    </>
  );
}

export default Header;
