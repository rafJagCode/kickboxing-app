import { logoutAction } from "./actions";
import { ShieldCheck, LogOut } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-4 max-w-md mx-auto flex flex-col justify-between">
      <header className="flex items-center justify-between py-4 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-500" />
          <span className="font-semibold text-sm">Kickboxing Admin</span>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-100 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </form>
      </header>

      <section className="py-12 text-center space-y-3">
        <h2 className="text-2xl font-bold">Phase 1 Complete</h2>
        <p className="text-sm text-neutral-400">Single-password gate and secure 60-day cookie authentication active.</p>
      </section>

      <footer className="py-4 text-center text-xs text-neutral-600 border-t border-neutral-900">Coach Mobile Dashboard</footer>
    </main>
  );
}
