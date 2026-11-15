import { useAuth, SignIn, SignUp } from "@clerk/clerk-react";
import { Link, Navigate } from "react-router-dom";
import PageLoader from "@components/feedback/PageLoader";
import { DEFAULT_ROUTE } from "@app/navigation";

interface AuthPageProps {
  mode: "sign-in" | "sign-up";
}

/** Hosts Clerk's sign-in and sign-up widgets on their own routes. */
function AuthPage({ mode }: AuthPageProps) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-background px-4 py-10">
      <Link to="/" className="font-serif text-4xl text-foreground">
        Prometheus
      </Link>
        <PageLoader />
      </div>
    );
  }

  if (isSignedIn) return <Navigate to={DEFAULT_ROUTE} replace />;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-background px-4 py-10">
      <Link to="/" className="font-serif text-4xl text-foreground">
        Prometheus
      </Link>
      {mode === "sign-in" ? (
        <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
      ) : (
        <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
      )}
    </div>
  );
}

export default AuthPage;
