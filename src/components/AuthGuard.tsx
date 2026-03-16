import { type ReactNode } from "react";
import { useUser, SignInButton } from "@clerk/clerk-react";
import { Button } from "./ui/button";

interface AuthGuardProps {
  children: ReactNode;
  description?: string;
}

function AuthGuard({ children, description }: AuthGuardProps) {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-[400px] flex justify-center items-center rounded-sm border border-border bg-card">
        <span className="text-muted-foreground text-sm">Loading...</span>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center mt-20 text-center">
        <div className="bg-card border border-border rounded-sm p-8 max-w-sm w-full space-y-5">
          <h2 className="font-sans text-xl font-semibold text-foreground">Welcome Back</h2>
          <p className="text-muted-foreground text-sm">
            {description ?? "Sign in to continue."}
          </p>
          <SignInButton mode="modal">
            <Button className="w-full">Sign In to Continue</Button>
          </SignInButton>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default AuthGuard;
