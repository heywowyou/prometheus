import { useAuth } from "@clerk/clerk-react";
import { Navigate, Link } from "react-router-dom";
import { Button } from "@components/ui/button";
import PageLoader from "@components/feedback/PageLoader";
import { DEFAULT_ROUTE } from "@app/navigation";

function LandingPage() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <PageLoader />
      </div>
    );
  }

  if (isSignedIn) return <Navigate to={DEFAULT_ROUTE} replace />;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-10 text-center">
        <div>
          <h1 className="font-serif text-6xl font-normal leading-none sm:text-7xl">Prometheus</h1>
          <p className="mt-5 font-serif text-xl italic text-soft">Your days, kept in one place.</p>
        </div>
        <div className="flex w-full flex-col gap-3">
          <Button asChild size="lg" className="w-full">
            <Link to="/sign-in">Sign in</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full">
            <Link to="/sign-up">Create account</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
