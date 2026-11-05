import { supabaseAdmin } from "@/lib/supabase";
import { addMember } from "./actions-members";
import Navbar from "@/components/Navbar";

export default async function MembersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = (await searchParams).q || "";

  let queryBuilder = supabaseAdmin.from("members").select("*").order("last_name");
  if (query) {
    queryBuilder = queryBuilder.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`);
  }

  const { data: members } = await queryBuilder;

  return (
    <main className="pb-20 p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Members</h1>

      {/* Search Bar */}
      <form className="mb-4">
        <input name="q" defaultValue={query} placeholder="Search member..." className="w-full bg-neutral-900 border border-neutral-800 p-3 rounded-xl text-sm" />
      </form>

      {/* List */}
      <div className="space-y-2">
        {members?.map((m) => (
          <div key={m.id} className="bg-neutral-900 p-4 rounded-xl flex justify-between items-center">
            <span>
              {m.last_name}, {m.first_name}
            </span>
          </div>
        ))}
      </div>

      <Navbar />
    </main>
  );
}
