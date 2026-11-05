import { supabaseAdmin } from "@/lib/supabase";
import MemberManager from "@/components/MemberManager";
import Navbar from "@/components/Navbar";
import type { Member } from "@/types/database";

export default async function HomePage() {
  const { data: members } = await supabaseAdmin.from("members").select("*").order("last_name", { ascending: true });

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 pb-24 p-4 max-w-md mx-auto">
      <header className="py-3 mb-3 border-b border-neutral-900">
        <h1 className="text-xl font-bold tracking-tight">Fighter Directory</h1>
        <p className="text-xs text-neutral-500">Manage members, active passes & payments</p>
      </header>

      <MemberManager initialMembers={(members as Member[]) || []} />

      <Navbar />
    </main>
  );
}
