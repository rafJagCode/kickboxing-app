"use client";

import { useState, useTransition } from "react";
import { Search, UserPlus, Trash2, X, ChevronRight, User } from "lucide-react";
import { addMember, deleteMember } from "@/app/actions-members";
import Link from "next/link";
import type { Member } from "@/types/database";

export default function MemberManager({ initialMembers }: { initialMembers: Member[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Fast client-side filter: matches first or last name
  const filteredMembers = initialMembers.filter((m) => {
    const fullName = `${m.first_name} ${m.last_name}`.toLowerCase();
    const reversed = `${m.last_name} ${m.first_name}`.toLowerCase();
    const term = searchTerm.toLowerCase().trim();
    return fullName.includes(term) || reversed.includes(term);
  });

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      try {
        await addMember(formData);
        form.reset();
        setIsModalOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add member");
      }
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}? All associated passes and receipts will be removed.`)) {
      startTransition(async () => {
        await deleteMember(id);
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick Action Bar: Search + Add Button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type 2-3 letters to filter..."
            className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="shrink-0 flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold rounded-xl text-sm transition-colors cursor-pointer shadow-sm"
          title="Add Member"
        >
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Add</span>
        </button>
      </div>

      {/* Member Count Indicator */}
      <div className="flex items-center justify-between text-xs text-neutral-500 px-1">
        <span>
          Showing {filteredMembers.length} of {initialMembers.length} members
        </span>
      </div>

      {/* Members List */}
      <div className="space-y-2">
        {filteredMembers.length === 0 ? (
          <div className="p-8 text-center bg-neutral-900/50 border border-neutral-900 rounded-2xl">
            <User className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
            <p className="text-sm text-neutral-400 font-medium">No members found</p>
            <p className="text-xs text-neutral-600 mt-1">Try another search or add a new member</p>
          </div>
        ) : (
          filteredMembers.map((m) => (
            <div key={m.id} className="bg-neutral-900/80 border border-neutral-800/80 hover:border-neutral-700/80 rounded-xl p-3 flex items-center justify-between gap-3 transition-colors">
              <Link href={`/members/${m.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-full bg-neutral-800 border border-neutral-700/60 flex items-center justify-center font-bold text-xs text-neutral-300 shrink-0">
                  {m.first_name[0]}
                  {m.last_name[0]}
                </div>
                <div className="truncate">
                  <div className="text-sm font-semibold text-neutral-100 truncate">
                    {m.last_name}, {m.first_name}
                  </div>
                  <div className="text-[11px] text-neutral-500">Joined {new Date(m.created_at).toLocaleDateString()}</div>
                </div>
              </Link>

              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => handleDelete(m.id, `${m.first_name} ${m.last_name}`)} className="p-2 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-neutral-800 transition-colors" title="Delete Member">
                  <Trash2 className="w-4 h-4" />
                </button>
                <Link href={`/members/${m.id}`} className="p-2 text-neutral-400 hover:text-neutral-100 rounded-lg hover:bg-neutral-800 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-bold text-base text-neutral-100">Add New Member</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && <div className="p-3 text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg">{error}</div>}

            <form onSubmit={handleAddSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">First Name</label>
                <input
                  type="text"
                  name="first_name"
                  required
                  autoFocus
                  placeholder="e.g. Leo"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  required
                  placeholder="e.g. Kowalski"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-medium">
                  Cancel
                </button>
                <button type="submit" disabled={isPending} className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl text-xs font-semibold disabled:opacity-50">
                  {isPending ? "Saving..." : "Save Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
