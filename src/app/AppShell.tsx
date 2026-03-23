import { Outlet } from "react-router-dom";
import Header from "../components/Header";

function AppShell() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Header />
      <div className="max-w-7xl mx-auto px-6 py-6">
        <main className="py-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppShell;
