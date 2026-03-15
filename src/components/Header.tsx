import { useUser, SignOutButton, SignInButton } from "@clerk/clerk-react";
import logo from "../assets/logo.png";

function Header() {
  const { isSignedIn } = useUser();

  return (
    <header className="w-full bg-surface sticky top-0 z-40 border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between">
        <img
          src={logo}
          alt="App Logo"
          className="w-48 object-contain"
        />
        <div>
          {isSignedIn ? (
            <SignOutButton>
              <button className="text-sm font-medium text-text-muted hover:text-text transition-colors px-3 py-1.5 rounded-md hover:bg-surface-hover">
                Sign Out
              </button>
            </SignOutButton>
          ) : (
            <SignInButton mode="modal">
              <button className="btn-primary text-sm px-4 py-2 rounded-md">
                Sign In
              </button>
            </SignInButton>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;

