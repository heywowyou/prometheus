import { ReactNode } from "react";
import Header from "../components/Header";

interface AppShellProps {
  children: ReactNode;
}

function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Header />
      <div className="max-w-7xl mx-auto px-6 py-6">
        <main className="py-4">{children}</main>
      </div>
    </div>
  );
}

export default AppShell;
