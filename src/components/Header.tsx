import { useUser, SignOutButton, SignInButton } from "@clerk/clerk-react";
import logo from "../assets/logo.png";
import { Button } from "./ui/button";

function Header() {
  const { isSignedIn } = useUser();

  return (
    <header
      className="w-full sticky top-0 z-40 border-b border-border"
      style={{ backgroundColor: "var(--navbar)" }}
    >
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <img src={logo} alt="App Logo" className="w-40 object-contain" />
        <div>
          {isSignedIn ? (
            <SignOutButton>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Sign Out
              </Button>
            </SignOutButton>
          ) : (
            <SignInButton mode="modal">
              <Button size="sm">Sign In</Button>
            </SignInButton>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
