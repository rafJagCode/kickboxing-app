import { supabaseAdmin } from "@/lib/supabase";
import CalendarManager from "@/components/CalendarManager";
import Navbar from "@/components/Navbar";
import type { TrainingType, CalendarSession } from "@/types/database";

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ year?: string; month?: string }> }) {
  const params = await searchParams;
  const now = new Date();
  const year = params.year ? parseInt(params.year, 10) : now.getUTCFullYear();
  const month = params.month ? parseInt(params.month, 10) : now.getUTCMonth();

  // 1. Fetch training groups
  const { data: trainingTypes } = await supabaseAdmin.from("training_types").select("*").order("name");

  // 2. Fetch all scheduled sessions for target month
  const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const endDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`;

  const { data: sessions } = await supabaseAdmin.from("calendar_sessions").select("*").gte("date", startDate).lte("date", endDate);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 pb-24 p-4 max-w-md mx-auto">
      <header className="py-3 mb-3 border-b border-neutral-900">
        <h1 className="text-xl font-bold tracking-tight">Training Calendar</h1>
        <p className="text-xs text-neutral-500">Schedule weekend and weekday classes, track hours & cancellations</p>
      </header>

      <CalendarManager trainingTypes={(trainingTypes as TrainingType[]) || []} initialSessions={(sessions as CalendarSession[]) || []} year={year} month={month} />

      <Navbar />
    </main>
  );
}
