// Component rendered inside the member profile allowing the coach to issue a new pass, inspect active pass health, view remaining entry bubbles, and review historical passes with attendance timestamps.

// Props:
// - memberId: string
// - activePass: Pass | null
// - pastPasses: Pass[]
// - attendances: Attendance[]
// - trainingTypes: TrainingType[]
// - sessions: CalendarSession[]

"use client";

import { useState, useTransition } from "react";
import { Ticket, Plus, AlertCircle, Calendar, CheckCircle, RotateCcw, Sparkles, History } from "lucide-react";
import { issuePass, recordAttendance, undoAttendance } from "@/app/actions-pass";
import { calculatePassHealth } from "@/lib/pass-engine";
import type { Pass, Attendance, TrainingType, CalendarSession } from "@/types/database";

interface PassManagerProps {
  memberId: string;
  activePass: Pass | null;
  pastPasses: Pass[];
  attendances: Attendance[];
  trainingTypes: TrainingType[];
  sessions: CalendarSession[];
}

export default function PassManager({ memberId, activePass, pastPasses, attendances, trainingTypes, sessions }: PassManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isIssuingOpen, setIsIssuingOpen] = useState(false);

  const [trainingTypeId, setTrainingTypeId] = useState(trainingTypes[0]?.id || "");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [totalEntries, setTotalEntries] = useState(4);

  const activePassAttendances = activePass ? attendances.filter((a) => a.pass_id === activePass.id) : [];

  const health = activePass ? calculatePassHealth(activePass, activePassAttendances, sessions) : null;

  const activeGroupName = activePass ? trainingTypes.find((t) => t.id === activePass.training_type_id)?.name || "General" : "";

  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.append("member_id", memberId);
    formData.append("training_type_id", trainingTypeId);
    formData.append("start_date", startDate);
    formData.append("total_entries", String(totalEntries));

    startTransition(async () => {
      try {
        await issuePass(formData);
        setIsIssuingOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to issue pass");
      }
    });
  };

  const handleQuickCheckIn = () => {
    if (!activePass) return;
    setError(null);
    startTransition(async () => {
      try {
        await recordAttendance(activePass.id, memberId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Check-in failed");
      }
    });
  };

  const handleUndo = (attendanceId: string) => {
    if (confirm("Undo this recorded attendance entry?")) {
      setError(null);
      startTransition(async () => {
        try {
          await undoAttendance(attendanceId, memberId);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Undo failed");
        }
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ticket className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-bold text-neutral-100">Membership Pass</h2>
        </div>
        <button
          type="button"
          onClick={() => setIsIssuingOpen(!isIssuingOpen)}
          className="text-xs font-semibold px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{activePass ? "Renew Pass" : "Issue Pass"}</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isIssuingOpen && (
        <form onSubmit={handleIssueSubmit} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300">{activePass ? "Renew Active Pass" : "Issue New Pass"}</h3>

          <div>
            <label className="block text-[11px] font-medium text-neutral-400 mb-1">Training Group</label>
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

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100 text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">Entries Allowed</label>
              <input
                type="number"
                min="1"
                max="20"
                value={totalEntries}
                onChange={(e) => setTotalEntries(parseInt(e.target.value, 10))}
                required
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100 text-xs focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setIsIssuingOpen(false)} className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs">
              Cancel
            </button>
            <button type="submit" disabled={isPending} className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-lg text-xs disabled:opacity-50">
              {isPending ? "Activating..." : "Activate Pass"}
            </button>
          </div>
        </form>
      )}

      {activePass && health ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-neutral-100">{activeGroupName}</span>
              <div className="text-[11px] text-neutral-400 flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3 h-3 text-neutral-500" />
                <span>Valid until: {health.effectiveExpiryDate}</span>
              </div>
            </div>

            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                health.status === "ACTIVE" ? "bg-emerald-950 text-emerald-400 border-emerald-800" : health.status === "COMPLETED" ? "bg-blue-950 text-blue-400 border-blue-800" : "bg-red-950 text-red-400 border-red-800"
              }`}
            >
              {health.status}
            </span>
          </div>

          {health.isExtendedDueToCancellation && (
            <div className="flex items-center gap-1.5 text-[11px] text-amber-400 bg-amber-950/40 border border-amber-900/50 p-2 rounded-xl">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>
                Extended dynamically (+{health.cancelledCountAffecting} cancelled class
                {health.cancelledCountAffecting > 1 ? "es" : ""} skipped)
              </span>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] text-neutral-400">
              <span>Attendance Entries</span>
              <span>
                {health.attendedCount} of {activePass.total_entries} used
              </span>
            </div>

            <div className="flex gap-2">
              {Array.from({ length: activePass.total_entries }).map((_, idx) => {
                const isUsed = idx < health.attendedCount;
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isPending || (isUsed && idx !== health.attendedCount - 1)}
                    onClick={() => {
                      if (!isUsed) {
                        handleQuickCheckIn();
                      } else if (idx === health.attendedCount - 1) {
                        const lastAtt = activePassAttendances[activePassAttendances.length - 1];
                        if (lastAtt) handleUndo(lastAtt.id);
                      }
                    }}
                    className={`flex-1 h-11 rounded-xl flex items-center justify-center font-bold text-sm transition-all cursor-pointer ${
                      isUsed ? "bg-amber-500 text-neutral-950 shadow-xs" : "bg-neutral-950 border border-neutral-800 text-neutral-600 hover:border-amber-500/50"
                    }`}
                    title={isUsed ? "Tap last used circle to undo" : "Tap to mark attendance"}
                  >
                    {isUsed ? "X" : "○"}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-800/80">
            <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Recorded Check-in Timestamps</span>
            <div className="mt-1.5 space-y-1">
              {activePassAttendances.length === 0 ? (
                <p className="text-[11px] text-neutral-600">No entries recorded yet.</p>
              ) : (
                activePassAttendances.map((att, idx) => (
                  <div key={att.id} className="flex items-center justify-between text-[11px] text-neutral-300 bg-neutral-950 px-2.5 py-1.5 rounded-lg border border-neutral-800/60">
                    <span>
                      Entry #{idx + 1}: {new Date(att.date).toLocaleString()}
                    </span>
                    <button type="button" onClick={() => handleUndo(att.id)} className="text-neutral-500 hover:text-red-400 p-0.5" title="Undo entry">
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 text-center bg-neutral-900/40 border border-neutral-900 rounded-2xl">
          <Ticket className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
          <p className="text-xs text-neutral-400 font-medium">No active pass</p>
          <p className="text-[11px] text-neutral-600 mt-0.5">Tap &quot;Issue Pass&quot; to issue a 4-entry cycle</p>
        </div>
      )}

      {pastPasses.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-semibold px-1">
            <History className="w-3.5 h-3.5 text-neutral-500" />
            <span>Pass History ({pastPasses.length})</span>
          </div>

          <div className="space-y-1.5">
            {pastPasses.map((p) => {
              const groupName = trainingTypes.find((t) => t.id === p.training_type_id)?.name || "General";
              return (
                <div key={p.id} className="bg-neutral-900/60 border border-neutral-800/60 rounded-xl p-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-neutral-300">{groupName}</span>
                    <div className="text-[10px] text-neutral-500">
                      Started {p.start_date} • {p.total_entries} entries
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500 uppercase bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">Expired/Replaced</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
