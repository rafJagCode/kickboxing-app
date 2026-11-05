// app/training/page.tsx
import { supabaseAdmin } from "@/lib/supabase";
import Navbar from "@/components/Navbar";

export default async function TrainingPage() {
  const { data: trainingTypes } = await supabaseAdmin.from("training_types").select("*");

  return (
    <main className="pb-20 p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Training Groups</h1>
      <div className="space-y-2">
        {trainingTypes?.map((t) => (
          <div key={t.id} className="bg-neutral-900 p-4 rounded-xl font-medium">
            {t.name}
          </div>
        ))}
      </div>
      <Navbar />
    </main>
  );
}
