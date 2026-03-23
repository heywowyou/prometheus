import { useAuth } from "@clerk/clerk-react";
import { SignIn } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";

function SignInPage() {
  const { isLoaded, isSignedIn } = useAuth();

  if (isLoaded && isSignedIn) {
    return <Navigate to="/todos" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
    </div>
  );
}

export default SignInPage;
