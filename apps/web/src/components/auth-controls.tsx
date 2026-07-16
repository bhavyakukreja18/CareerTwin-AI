"use client";

import { SignInButton, SignUpButton, UserButton, useAuth } from "@clerk/nextjs";

export function AuthControls() {
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    return <UserButton />;
  }

  return (
    <div className="inline-flex items-center gap-2">
      <SignInButton mode="modal">
        <button
          type="button"
          className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
        >
          Sign in
        </button>
      </SignInButton>
      <SignUpButton mode="modal">
        <button type="button" className="rounded-lg bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-400">
          Sign up
        </button>
      </SignUpButton>
    </div>
  );
}
