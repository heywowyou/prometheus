import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { cn } from "@lib/utils";
import Header from "@components/Header";
import ErrorBoundary from "@components/feedback/ErrorBoundary";
import PageLoader from "@components/feedback/PageLoader";

/**
 * Layout for every signed-in route.
 *
 * The error boundary is keyed on the pathname so navigating away from a page
 * that threw clears the error instead of stranding the user on the fallback.
 */
function AppShell() {
  const { pathname } = useLocation();
  // Notes has a page sidebar and an outline column, so it gets more width.
  const wide = pathname.startsWith("/notes");

  return (
    <div className="min-h-dvh bg-background font-sans text-foreground">
      <Header />
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
    </div>
  );
}

export default AppShell;
