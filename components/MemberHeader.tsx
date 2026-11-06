/*
 * Description: Profile header component with edit modal supporting first name, last name, and training group reassignment.
 * Config: Accepts member details, trainingTypes collection, and currentTrainingTypeId.
 */
"use client";

import { useState, useTransition } from "react";
import { Pencil, X, AlertCircle } from "lucide-react";
import { updateMember } from "@/app/actions-members";
import type { Member, TrainingType } from "@/types/database";

interface MemberHeaderProps {
  member: Member;
  trainingTypes: TrainingType[];
  currentTrainingTypeId?: string;
}

export default function MemberHeader({ member, trainingTypes, currentTrainingTypeId }: MemberHeaderProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [firstName, setFirstName] = useState(member.first_name);
  const [lastName, setLastName] = useState(member.last_name);
  const [trainingTypeId, setTrainingTypeId] = useState(currentTrainingTypeId || trainingTypes[0]?.id || "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.append("first_name", firstName);
    formData.append("last_name", lastName);
    formData.append("training_type_id", trainingTypeId);

    startTransition(async () => {
      try {
        await updateMember(member.id, formData);
        setIsEditOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update member");
      }
    });
  };

  return (
    <>
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between gap-3 mb-5 shadow-sm">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-base shrink-0">
            {member.first_name[0]}
            {member.last_name[0]}
          </div>
          <div className="truncate">
            <h1 className="text-lg font-bold text-neutral-100 truncate">
              {member.first_name} {member.last_name}
            </h1>
            <p className="text-xs text-neutral-500">Member since {new Date(member.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setFirstName(member.first_name);
            setLastName(member.last_name);
            setTrainingTypeId(currentTrainingTypeId || trainingTypes[0]?.id || "");
            setIsEditOpen(true);
          }}
          className="p-2 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer shrink-0"
          title="Edit Details"
        >
          <Pencil className="w-4 h-4" />
        </button>
      </div>

      {isEditOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-bold text-base text-neutral-100">Edit Member Details</h3>
              <button type="button" onClick={() => setIsEditOpen(false)} className="text-neutral-400 hover:text-neutral-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Training Group</label>
                <select
                  value={trainingTypeId}
                  onChange={(e) => setTrainingTypeId(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                >
                  {trainingTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsEditOpen(false)} className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-medium">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !firstName.trim() || !lastName.trim()}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl text-xs font-semibold disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Update Details"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
