import { supabaseAdmin } from "@/lib/supabase";
import { logoutAction } from "./actions";
import { ShieldCheck, LogOut, CheckCircle2, AlertTriangle } from "lucide-react";
import type { TrainingType } from "@/types/database";

export default async function HomePage() {
  let trainingTypes: TrainingType[] = [];
  let connectionError: string | null = null;

  try {
    const { data, error } = await supabaseAdmin.from("training_types").select("*").order("name");

    if (error) {
      connectionError = error.message;
    } else {
      trainingTypes = data || [];
    }
  } catch (err) {
    connectionError = err instanceof Error ? err.message : "Unknown connection error";
  }

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

      <section className="py-8 space-y-4">
        <div>
          <h2 className="text-xl font-bold">Supabase Status</h2>
          <p className="text-xs text-neutral-400">Verifying database and storage configuration</p>
        </div>

        {connectionError ? (
          <div className="p-4 bg-red-950/40 border border-red-900/60 rounded-xl space-y-1">
            <div className="flex items-center gap-2 text-red-400 font-medium text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Connection Failed</span>
            </div>
            <p className="text-xs text-red-300">{connectionError}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium p-3 bg-emerald-950/30 border border-emerald-900/40 rounded-xl">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Connected to Supabase PostgreSQL</span>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Default Training Groups ({trainingTypes.length})</span>
              <ul className="space-y-1.5">
                {trainingTypes.map((t) => (
                  <li key={t.id} className="text-sm px-3 py-2 bg-neutral-950 border border-neutral-800/80 rounded-lg text-neutral-200">
                    {t.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      <footer className="py-4 text-center text-xs text-neutral-600 border-t border-neutral-900">Phase 2 Verification</footer>
    </main>
  );
}
