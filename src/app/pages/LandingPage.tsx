import { useAuth } from "@clerk/clerk-react";
import { Navigate, Link } from "react-router-dom";
import { Button } from "@components/ui/button";
import logo from "../../assets/logo.png";

function LandingPage() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-muted-foreground text-sm">Loading...</span>
      </div>
    );
  }

  if (isSignedIn) {
    return <Navigate to="/todos" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center gap-8 max-w-sm w-full text-center">
        <img src={logo} alt="Prometheus" className="w-52 object-contain" />
        <div className="flex flex-col gap-3 w-full">
          <Button asChild size="lg" className="w-full">
            <Link to="/sign-in">Sign In</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full">
            <Link to="/sign-up">Create Account</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
