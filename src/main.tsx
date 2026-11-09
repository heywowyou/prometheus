import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@components/ui/tooltip";
import { Toaster } from "@components/ui/sonner";
import { createQueryClient } from "@lib/query/queryClient";
import { DEFAULT_ROUTE } from "@app/navigation";
import App from "./App";
import "./index.css";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env");
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element with id 'root' not found");
}

const queryClient = createQueryClient();

createRoot(rootElement).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl={DEFAULT_ROUTE}
      signUpFallbackRedirectUrl={DEFAULT_ROUTE}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <App />
          <Toaster position="bottom-right" />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  </StrictMode>,
);
