// Home screen server component. Pre-fetches members, active passes, attendance history, scheduled calendar sessions, and training group definitions, feeding them directly to the client-side MemberManager.

import { supabaseAdmin } from "@/lib/supabase";
import MemberManager from "@/components/MemberManager";
import Navbar from "@/components/Navbar";
import type { Member, Pass, Attendance, CalendarSession, TrainingType } from "@/types/database";

export default async function HomePage() {
  const [{ data: members }, { data: passes }, { data: attendances }, { data: sessions }, { data: trainingTypes }] = await Promise.all([
    supabaseAdmin.from("members").select("*").order("last_name", { ascending: true }),
    supabaseAdmin.from("passes").select("*"),
    supabaseAdmin.from("attendances").select("*").order("date", { ascending: true }),
    supabaseAdmin.from("calendar_sessions").select("*"),
    supabaseAdmin.from("training_types").select("*").order("name"),
  ]);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 pb-24 p-4 max-w-md mx-auto">
      <header className="py-3 mb-3 border-b border-neutral-900">
        <h1 className="text-xl font-bold tracking-tight">Fighter Directory</h1>
        <p className="text-xs text-neutral-500">Fast on-the-mat attendance check-in</p>
      </header>

      <MemberManager
        initialMembers={(members as Member[]) || []}
        passes={(passes as Pass[]) || []}
        attendances={(attendances as Attendance[]) || []}
        sessions={(sessions as CalendarSession[]) || []}
        trainingTypes={(trainingTypes as TrainingType[]) || []}
      />

      <Navbar />
    </main>
  );
}
