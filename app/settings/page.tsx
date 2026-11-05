import Navbar from "@/components/Navbar";
import { logoutAction } from "@/app/actions";
import { LogOut, ShieldCheck, KeyRound, Smartphone } from "lucide-react";

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 pb-24 p-4 max-w-md mx-auto">
      <header className="py-3 mb-4 border-b border-neutral-900">
        <h1 className="text-xl font-bold tracking-tight">System Settings</h1>
        <p className="text-xs text-neutral-500">Security and session configuration</p>
      </header>

      <div className="space-y-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-neutral-400">
            <KeyRound className="w-4 h-4 text-amber-500" />
            <span>Session Status</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-300">Access Key</span>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-900 px-2 py-0.5 rounded">Active (60d)</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-300">Device Mode</span>
            <span className="text-xs text-neutral-400 flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5" /> Mobile Coach
            </span>
          </div>
        </div>

        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-900/60 font-semibold rounded-xl text-sm transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out of Coach Dashboard
          </button>
        </form>
      </div>

      <Navbar />
    </main>
  );
}
