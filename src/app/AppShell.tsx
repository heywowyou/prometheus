import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
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

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <Header />
      <div className="mx-auto max-w-7xl px-6 py-6">
        <main className="py-4">
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
