import { type ReactNode } from "react";
import { useUser, SignInButton } from "@clerk/clerk-react";

interface AuthGuardProps {
  children: ReactNode;
  description?: string;
}

function AuthGuard({ children, description }: AuthGuardProps) {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-[400px] bg-surface flex justify-center items-center rounded-2xl border border-border">
        <span className="text-text-muted">Loading...</span>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center mt-20 text-center space-y-6">
        <div className="bg-surface p-8 rounded-2xl shadow-xl border border-border max-w-md w-full">
          <h2 className="font-sans text-2xl font-bold text-text mb-3">
            Welcome Back
          </h2>
          <p className="text-text-muted mb-8">
            {description ?? "Sign in to continue."}
          </p>
          <SignInButton mode="modal">
            <button className="btn-primary w-full py-3 px-4">
              Sign In to Continue
            </button>
          </SignInButton>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default AuthGuard;
