import { useAuth } from "@clerk/clerk-react";
import { SignUp } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";

function SignUpPage() {
  const { isLoaded, isSignedIn } = useAuth();

  if (isLoaded && isSignedIn) {
    return <Navigate to="/todos" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
    </div>
  );
}

export default SignUpPage;
