import { useAuth } from "@clerk/clerk-react";
import { Navigate, Link } from "react-router-dom";
import { Button } from "@components/ui/button";
import PageLoader from "@components/feedback/PageLoader";
import { DEFAULT_ROUTE } from "@app/navigation";
import logo from "../../assets/logo.png";

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-8 text-center">
        <img src={logo} alt="Prometheus" className="w-52 object-contain" />
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
