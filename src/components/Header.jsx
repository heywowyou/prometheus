import React from "react";
import { useUser, SignOutButton, SignInButton } from "@clerk/clerk-react";
import logo from "../assets/logo.png";

function Header() {
  const { isSignedIn } = useUser();

  return (
    <header className="w-full bg-powder-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between">
        {/* Logo Section */}
        <img
          src={logo}
          alt="App Logo"
          className="w-48 object-contain" // object-contain keeps the aspect ratio
        />

        {/* User / Navigation Section */}
        <div>
          {isSignedIn ? (
            <SignOutButton>
              <button className="text-sm font-medium text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-md hover:bg-gray-800">
                Sign Out
              </button>
            </SignOutButton>
          ) : (
            <SignInButton mode="modal">
              <button className="text-sm font-medium bg-cyan-500 hover:bg-cyan-400 text-gray-900 px-4 py-2 rounded-md transition-colors shadow-lg shadow-cyan-500/20">
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
