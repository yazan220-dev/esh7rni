"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

export default function SignOutPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    await signOut({ callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-6 bg-card rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-bold mb-6">Sign Out</h2>
        <p className="mb-6">
          Are you sure you want to sign out of your account?
        </p>
        <div className="flex space-x-4 justify-center">
          <a
            href="/"
            className="py-2 px-4 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
          >
            Cancel
          </a>
          <button
            onClick={handleSignOut}
            disabled={isLoading}
            className="py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isLoading ? "Signing out..." : "Sign Out"}
          </button>
        </div>
      </div>
    </div>
  );
}
