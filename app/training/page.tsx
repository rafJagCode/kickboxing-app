import { supabaseAdmin } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import TrainingTypeManager from "./TrainingTypeManager";
import type { TrainingType } from "@/types/database";

export const instant = false;

export default async function TrainingPage() {
  const { data } = await supabaseAdmin.from("training_types").select("*").order("name");

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 pb-24 p-4 max-w-md mx-auto">
      <header className="py-3 mb-3 border-b border-neutral-900">
        <h1 className="text-xl font-bold tracking-tight">Training Groups</h1>
        <p className="text-xs text-neutral-500">Manage Saturday kickboxing groups and categories</p>
      </header>

      <TrainingTypeManager initialGroups={(data as TrainingType[]) || []} />

      <Navbar />
    </main>
  );
}
