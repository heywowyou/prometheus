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

// Keeps the reminder worker registered once notifications were turned on.
if ("serviceWorker" in navigator && "Notification" in window && Notification.permission === "granted") {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  });
}

createRoot(rootElement).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl={DEFAULT_ROUTE}
      signUpFallbackRedirectUrl={DEFAULT_ROUTE}
      appearance={{
        variables: {
          colorPrimary: "var(--rating)",
          colorBackground: "var(--card)",
          colorInputBackground: "var(--secondary)",
          colorInputText: "var(--foreground)",
          colorText: "var(--foreground)",
          colorTextSecondary: "var(--muted-foreground)",
          colorDanger: "var(--destructive)",
          colorNeutral: "var(--foreground)",
          colorShimmer: "var(--border)",
          borderRadius: "1rem",
          fontFamily: "Inter, system-ui, sans-serif",
        },
        elements: {
          rootBox: "w-full",
          formButtonPrimary:
            "rounded-full bg-rating text-rating-foreground shadow-none hover:bg-rating-hover",
          card: "shadow-none border border-border bg-card rounded-3xl",
          headerTitle: "font-serif text-3xl font-normal text-foreground",
          headerSubtitle: "text-muted-foreground",
          socialButtonsBlockButton:
            "border border-border bg-secondary text-foreground hover:bg-accent",
          dividerLine: "bg-border",
          dividerText: "text-muted-foreground",
          formFieldLabel: "text-foreground",
          formFieldInput: "border border-border bg-transparent text-foreground",
          footerActionText: "text-muted-foreground",
          footerActionLink: "text-rating hover:text-rating-hover",
          identityPreviewText: "text-foreground",
          identityPreviewEditButtonIcon: "text-muted-foreground",
          userButtonPopoverCard: "border border-border bg-popover",
          userButtonPopoverActionButtonText: "text-foreground",
          userButtonPopoverFooter: "hidden",
        },
      }}
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
