// Directory search and 3-second mat check-in interface. Renders dynamic visual attendance slots with progressive overdraft slots and unpaid status warnings.

// Props:
// - initialMembers: Member[]
// - passes: Pass[]
// - attendances: Attendance[]
// - sessions: CalendarSession[]
// - trainingTypes: TrainingType[]

"use client";

import { useState, useTransition } from "react";
import { Search, UserPlus, X, ChevronRight, User, AlertCircle, Sparkles, AlertTriangle } from "lucide-react";
import { addMember } from "@/app/actions-members";
import { recordAttendance, undoAttendance } from "@/app/actions-pass";
import { calculatePassHealth } from "@/lib/pass-engine";
import Link from "next/link";
import type { Member, Pass, Attendance, CalendarSession, TrainingType } from "@/types/database";

interface MemberManagerProps {
  initialMembers: Member[];
  passes: Pass[];
  attendances: Attendance[];
  sessions: CalendarSession[];
  trainingTypes: TrainingType[];
}

export default function MemberManager({ initialMembers, passes, attendances, sessions, trainingTypes }: MemberManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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

  const handleCircleTap = (pass: Pass, memberId: string, isUsed: boolean, isLastUsed: boolean, lastAttendanceId?: string) => {
    setError(null);
    startTransition(async () => {
      try {
        if (!isUsed) {
          await recordAttendance(pass.id, memberId);
        } else if (isLastUsed && lastAttendanceId) {
          await undoAttendance(lastAttendanceId, memberId);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Check-in failed");
      }
    });
  };

  return (
    <div className="space-y-4">
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
          title="Add Fighter"
        >
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Add</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-neutral-500 px-1">
        <span>
          Showing {filteredMembers.length} of {initialMembers.length} fighters
        </span>
      </div>

      <div className="space-y-2.5">
        {filteredMembers.length === 0 ? (
          <div className="p-8 text-center bg-neutral-900/50 border border-neutral-900 rounded-2xl">
            <User className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
            <p className="text-sm text-neutral-400 font-medium">No fighters found</p>
            <p className="text-xs text-neutral-600 mt-1">Try another search or add a new fighter</p>
          </div>
        ) : (
          filteredMembers.map((m) => {
            const activePass = passes.find((p) => p.member_id === m.id && p.is_active);
            const passAttendances = activePass ? attendances.filter((a) => a.pass_id === activePass.id) : [];
            const health = activePass ? calculatePassHealth(activePass, passAttendances, sessions) : null;
            const groupName = activePass ? trainingTypes.find((t) => t.id === activePass.training_type_id)?.name : null;

            return (
              <div key={m.id} className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-3.5 space-y-3 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <Link href={`/members/${m.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700/60 flex items-center justify-center font-bold text-xs text-amber-400 shrink-0">
                      {m.first_name[0]}
                      {m.last_name[0]}
                    </div>
                    <div className="truncate">
                      <div className="text-sm font-bold text-neutral-100 truncate">
                        {m.last_name}, {m.first_name}
                      </div>
                      <div className="text-[11px] text-neutral-400 truncate">{groupName ? groupName : "Unassigned"}</div>
                    </div>
                  </Link>

                  <div className="flex items-center gap-1 shrink-0">
                    {health && (
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          health.status === "ACTIVE"
                            ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                            : health.status === "UNPAID"
                              ? "bg-rose-950 text-rose-400 border-rose-800"
                              : health.status === "COMPLETED"
                                ? "bg-blue-950 text-blue-400 border-blue-800"
                                : "bg-red-950 text-red-400 border-red-800"
                        }`}
                      >
                        {health.status}
                      </span>
                    )}

                    <Link href={`/members/${m.id}`} className="p-1.5 text-neutral-400 hover:text-neutral-100 rounded-lg hover:bg-neutral-800 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                {activePass && health ? (
                  <div className="space-y-2 pt-1 border-t border-neutral-800/60">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-neutral-400">
                        {activePass.total_entries === 0 ? (
                          <span className="text-rose-400 font-semibold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Unpaid pass (rolls to next renewal)
                          </span>
                        ) : (
                          <>
                            Expires: <strong className="text-neutral-200">{health.effectiveExpiryDate}</strong>
                          </>
                        )}
                      </span>

                      {health.overdraftCount > 0 && activePass.total_entries > 0 && <span className="text-[10px] text-rose-400 font-semibold">+{health.overdraftCount} overdraft</span>}

                      {health.isExtendedDueToCancellation && (
                        <span className="flex items-center gap-1 text-[10px] text-amber-400 font-semibold">
                          <Sparkles className="w-3 h-3" /> Extended
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {Array.from({ length: health.displaySlotsCount }).map((_, idx) => {
                        const isUsed = idx < health.attendedCount;
                        const isLastUsed = idx === health.attendedCount - 1;
                        const lastAtt = passAttendances[passAttendances.length - 1];
                        const isOverdraftSlot = activePass.total_entries === 0 || idx >= activePass.total_entries;

                        let buttonClasses = "h-10 min-w-9 flex-1 rounded-xl flex items-center justify-center font-bold text-sm transition-all cursor-pointer ";

                        if (isUsed && isOverdraftSlot) {
                          buttonClasses += "bg-rose-600 text-white shadow-xs";
                        } else if (isUsed) {
                          buttonClasses += "bg-amber-500 text-neutral-950 shadow-xs";
                        } else if (isOverdraftSlot) {
                          buttonClasses += "bg-neutral-950 border border-rose-900/60 text-rose-500 hover:border-rose-500";
                        } else {
                          buttonClasses += "bg-neutral-950 border border-neutral-800 text-neutral-500 hover:border-amber-500/50";
                        }

                        return (
                          <button
                            key={idx}
                            type="button"
                            disabled={isPending || (isUsed && !isLastUsed)}
                            onClick={() => handleCircleTap(activePass, m.id, isUsed, isLastUsed, lastAtt?.id)}
                            className={buttonClasses}
                            title={
                              isUsed
                                ? isLastUsed
                                  ? "Tap to undo this check-in"
                                  : isOverdraftSlot
                                    ? "Overdraft check-in (unpaid)"
                                    : "Used standard entry"
                                : isOverdraftSlot
                                  ? "Tap to mark overdraft check-in"
                                  : "Tap to mark attendance"
                            }
                          >
                            {isUsed ? "X" : "○"}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-neutral-800/60 flex items-center justify-between">
                    <span className="text-[11px] text-neutral-500">No pass initialized</span>
                    <Link href={`/members/${m.id}`} className="text-xs font-semibold text-amber-400 hover:text-amber-300">
                      Issue Pass →
                    </Link>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-bold text-base text-neutral-100">Add New Fighter</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-200">
                <X className="w-5 h-5" />
              </button>
            </div>

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
                  {isPending ? "Saving..." : "Save Fighter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
