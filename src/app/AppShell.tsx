import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "@components/Header";
import CommandPalette from "@components/CommandPalette";
import ErrorBoundary from "@components/feedback/ErrorBoundary";
import PageLoader from "@components/feedback/PageLoader";
import { cn } from "@lib/utils";
import { isWidePath } from "./navigation";
import { CommandPaletteContext } from "./command-palette";
import { useFocusAlerts } from "@features/focus/useFocusAlerts";

/**
 * Layout for every signed-in route: header, the routed page, and the
 * app-wide search and quick-add palette (Ctrl/Cmd+K).
 *
 * The error boundary is keyed on the pathname so navigating away from a page
 * that threw clears the error instead of stranding the user on the fallback.
 */
function AppShell() {
  const { pathname } = useLocation();
  const wide = isWidePath(pathname);
  useFocusAlerts();
  const [palette, setPalette] = useState<{ open: boolean; query: string }>({ open: false, query: "" });

  const open = useCallback((query = "") => setPalette({ open: true, query }), []);
  const api = useMemo(() => ({ open }), [open]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPalette((current) => ({ open: !current.open, query: "" }));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <CommandPaletteContext.Provider value={api}>
      <div className="min-h-dvh bg-background font-sans text-foreground">
        <Header wide={wide} />
        {/* Bottom padding clears the phone tab bar rendered by Header. */}
        <div
          className={cn(
            "mx-auto px-5 pb-32 pt-6 sm:px-8 lg:pb-20 lg:pt-8",
            wide ? "max-w-[1480px]" : "max-w-6xl",
          )}
        >
          <main>
            <ErrorBoundary resetKey={pathname}>
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
            </ErrorBoundary>
          </main>
        </div>
        <CommandPalette
          open={palette.open}
          initialQuery={palette.query}
          onOpenChange={(next) => setPalette((current) => ({ ...current, open: next }))}
        />
      </div>
    </CommandPaletteContext.Provider>
  );
}

export default AppShell;
