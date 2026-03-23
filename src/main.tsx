import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { ClerkProvider } from "@clerk/clerk-react";
import { TooltipProvider } from "@components/ui/tooltip";
import { Toaster } from "@components/ui/sonner";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key from .env");
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element with id 'root' not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/todos"
      afterSignUpUrl="/todos"
    >
      <TooltipProvider>
        <App />
        <Toaster position="bottom-right" />
      </TooltipProvider>
    </ClerkProvider>
  </StrictMode>
);

