import { useAuth } from "@clerk/clerk-react";
import { Navigate, Outlet } from "react-router-dom";

function ProtectedRoute() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-muted-foreground text-sm">Loading...</span>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
