"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";
import { Lock, ShieldAlert } from "lucide-react";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-200">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Coach Access</h1>
          <p className="text-sm text-neutral-400">Enter master key to manage training and passes</p>
        </div>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter master password"
              required
              autoFocus
              className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100 placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
            />
          </div>

          {state?.error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-400 bg-red-950/40 border border-red-900/50 rounded-xl">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{state.error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50 text-neutral-950 font-semibold rounded-xl text-sm transition-colors cursor-pointer shadow-md"
          >
            {isPending ? "Verifying..." : "Unlock System"}
          </button>
        </form>
      </div>
    </div>
  );
}
