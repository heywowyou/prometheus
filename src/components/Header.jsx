import React from "react";
import { useUser, SignOutButton, SignInButton } from "@clerk/clerk-react";
import { Flame } from "lucide-react";

function Header() {
  const { isSignedIn } = useUser();

  return (
    <header className="w-full bg-powder-800 sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-6 h-[72px] flex items-center justify-between">
        {/* Logo Section */}
        <div className="flex items-center gap-2">
          <div>
            <Flame
              className="w-10 h-10 text-gray-100"
              fill="currentColor"
              fillOpacity={0}
            />
          </div>
          <span className="text-3xl font-semibold tracking-wider text-gray-100"></span>
        </div>

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
