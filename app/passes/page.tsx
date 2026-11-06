/*
 * Description: Advanced pass management route rendering timeline matrix table with timeline bounds defaulting to 2 months prior.
 * Config: Default date window bounds calculated dynamically from current UTC date.
 */
import { supabaseAdmin } from "@/lib/supabase";
import PassMatrixTable from "@/components/PassMatrixTable";
import Navbar from "@/components/Navbar";
import type { Member, Pass, Attendance, CalendarSession, TrainingType } from "@/types/database";

function getDefaultTimelineDates(sessions: CalendarSession[]) {
  const now = new Date();
  const past = new Date(now);
  past.setMonth(past.getMonth() - 2);

  const pastY = past.getFullYear();
  const pastM = String(past.getMonth() + 1).padStart(2, "0");
  const pastD = String(past.getDate()).padStart(2, "0");
  const fromDate = `${pastY}-${pastM}-${pastD}`;

  let toDate: string;
  if (sessions.length > 0) {
    const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date));
    toDate = sorted[0].date;
  } else {
    const future = new Date(now);
    future.setMonth(future.getMonth() + 2);
    const futY = future.getFullYear();
    const futM = String(future.getMonth() + 1).padStart(2, "0");
    const futD = String(future.getDate()).padStart(2, "0");
    toDate = `${futY}-${futM}-${futD}`;
  }

  return { fromDate, toDate };
}

export default async function PassesPage() {
  const [{ data: members }, { data: passes }, { data: attendances }, { data: sessions }, { data: trainingTypes }] = await Promise.all([
    supabaseAdmin.from("members").select("*").order("last_name", { ascending: true }),
    supabaseAdmin.from("passes").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("attendances").select("*").order("date", { ascending: true }),
    supabaseAdmin.from("calendar_sessions").select("*").order("date", { ascending: true }),
    supabaseAdmin.from("training_types").select("*").order("name"),
  ]);

  const { fromDate, toDate } = getDefaultTimelineDates((sessions as CalendarSession[]) || []);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 pb-24 p-4 max-w-4xl mx-auto">
      <header className="py-3 mb-3 border-b border-neutral-900">
        <h1 className="text-xl font-bold tracking-tight">Pass Operations & Timeline</h1>
        <p className="text-xs text-neutral-500">Table matrix of scheduled sessions, pass validity boundaries & retro-attendance</p>
      </header>

      <PassMatrixTable
        members={(members as Member[]) || []}
        passes={(passes as Pass[]) || []}
        attendances={(attendances as Attendance[]) || []}
        sessions={(sessions as CalendarSession[]) || []}
        trainingTypes={(trainingTypes as TrainingType[]) || []}
        initialFromDate={fromDate}
        initialToDate={toDate}
      />

      <Navbar />
    </main>
  );
}
