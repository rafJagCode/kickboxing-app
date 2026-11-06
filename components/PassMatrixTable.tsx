"use client";

import { useState, useTransition } from "react";
import { Layers, ChevronDown, ChevronUp, Calendar, AlertCircle, Pencil, X } from "lucide-react";
import { recordAttendanceForSession, undoAttendance, updatePass } from "@/app/actions-pass";
import { calculatePassHealth } from "@/lib/pass-engine";
import { formatSessionDate } from "@/lib/date-utils";
import Link from "next/link";
import type { Member, Pass, Attendance, CalendarSession, TrainingType } from "@/types/database";

interface PassMatrixTableProps {
  members: Member[];
  passes: Pass[];
  attendances: Attendance[];
  sessions: CalendarSession[];
  trainingTypes: TrainingType[];
  initialFromDate: string;
  initialToDate: string;
}

export default function PassMatrixTable({ members, passes, attendances, sessions, trainingTypes, initialFromDate, initialToDate }: PassMatrixTableProps) {
  const [statusFilter, setStatusFilter] = useState<"ALL" | "NEWEST" | "EXPIRED" | "UNPAID">("ALL");
  const [selectedGroupId, setSelectedGroupId] = useState("ALL");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [fromDate, setFromDate] = useState(initialFromDate);
  const [toDate, setToDate] = useState(initialToDate);

  const [editingPass, setEditingPass] = useState<Pass | null>(null);
  const [editTrainingTypeId, setEditTrainingTypeId] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editTotalEntries, setEditTotalEntries] = useState(4);

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const getGroupName = (typeId?: string) => {
    if (!typeId) return "Unassigned";
    return trainingTypes.find((t) => t.id === typeId)?.name || "Unassigned";
  };

  const getMemberName = (memberId: string) => {
    const m = members.find((item) => item.id === memberId);
    return m ? `${m.last_name}, ${m.first_name}` : "Unknown";
  };

  const visibleSessions = sessions
    .filter((s) => s.date >= fromDate && s.date <= toDate)
    .filter((s) => selectedGroupId === "ALL" || s.training_type_id === selectedGroupId)
    .sort((a, b) => a.date.localeCompare(b.date));

  const newestPassMap = new Map<string, Pass>();
  const sortedByCreated = [...passes].sort((a, b) => b.created_at.localeCompare(a.created_at));
  for (const p of sortedByCreated) {
    if (!newestPassMap.has(p.member_id)) {
      newestPassMap.set(p.member_id, p);
    }
  }

  const filteredPasses = passes.filter((p) => {
    if (selectedGroupId !== "ALL" && p.training_type_id !== selectedGroupId) {
      return false;
    }

    const passAttendances = attendances.filter((a) => a.pass_id === p.id);
    const health = calculatePassHealth(p, passAttendances, sessions);

    if (statusFilter === "NEWEST") {
      return newestPassMap.get(p.member_id)?.id === p.id;
    }
    if (statusFilter === "EXPIRED") {
      return health.status === "EXPIRED";
    }
    if (statusFilter === "UNPAID") {
      return health.status === "UNPAID";
    }
    return true;
  });

  const handleCellToggle = (pass: Pass, sessionDate: string, existingAttendanceId?: string) => {
    setError(null);
    startTransition(async () => {
      try {
        if (existingAttendanceId) {
          await undoAttendance(existingAttendanceId, pass.member_id);
        } else {
          await recordAttendanceForSession(pass.id, pass.member_id, sessionDate);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Action failed");
      }
    });
  };

  const openEditModal = (pass: Pass) => {
    setEditingPass(pass);
    setEditTrainingTypeId(pass.training_type_id);
    setEditStartDate(pass.start_date);
    setEditTotalEntries(pass.total_entries);
  };

  const handleEditPassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPass) return;
    setError(null);

    const formData = new FormData();
    formData.append("pass_id", editingPass.id);
    formData.append("member_id", editingPass.member_id);
    formData.append("training_type_id", editTrainingTypeId);
    formData.append("start_date", editStartDate);
    formData.append("total_entries", String(editTotalEntries));

    startTransition(async () => {
      try {
        await updatePass(formData);
        setEditingPass(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update pass");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300">
          <Calendar className="w-4 h-4 text-amber-500" />
          <span>Timeline Date Range</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-neutral-400 mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
          <div>
            <label className="block text-[10px] text-neutral-400 mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm transition-all">
        <button type="button" onClick={() => setIsFilterOpen(!isFilterOpen)} className="w-full p-3.5 flex items-center justify-between text-left hover:bg-neutral-850 transition-colors cursor-pointer">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-neutral-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">Filter by Group</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">{selectedGroupId === "ALL" ? "All Groups" : getGroupName(selectedGroupId)}</span>
            {isFilterOpen ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
          </div>
        </button>

        {isFilterOpen && (
          <div className="p-3.5 pt-0 border-t border-neutral-800/60 mt-1">
            <div className="flex flex-col gap-1.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedGroupId("ALL");
                  setIsFilterOpen(false);
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                  selectedGroupId === "ALL" ? "bg-amber-500 text-neutral-950 shadow-sm" : "bg-neutral-950/80 border border-neutral-800 text-neutral-300 hover:bg-neutral-800"
                }`}
              >
                <span>All Groups</span>
                {selectedGroupId === "ALL" && <span className="text-[10px] font-bold uppercase tracking-wider bg-neutral-950/20 px-2 py-0.5 rounded-md">Active</span>}
              </button>

              {trainingTypes.map((t) => {
                const isSelected = t.id === selectedGroupId;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setSelectedGroupId(t.id);
                      setIsFilterOpen(false);
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      isSelected ? "bg-amber-500 text-neutral-950 shadow-sm" : "bg-neutral-950/80 border border-neutral-800 text-neutral-300 hover:bg-neutral-800"
                    }`}
                  >
                    <span className="truncate">{t.name}</span>
                    {isSelected && <span className="text-[10px] font-bold uppercase tracking-wider bg-neutral-950/20 px-2 py-0.5 rounded-md">Active</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {(["ALL", "NEWEST", "EXPIRED", "UNPAID"] as const).map((filterOption) => (
          <button
            key={filterOption}
            type="button"
            onClick={() => setStatusFilter(filterOption)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === filterOption ? "bg-amber-500 text-neutral-950 shadow-xs" : "bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200"
            }`}
          >
            {filterOption === "ALL" ? "All" : filterOption === "NEWEST" ? "Newest" : filterOption === "EXPIRED" ? "Expired" : "Unpaid"}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-neutral-400 px-1 font-semibold">
        <span>Passes ({filteredPasses.length})</span>
        <span className="text-[10px] text-neutral-500">{visibleSessions.length} timeline sessions</span>
      </div>

      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-950/80">
                <th className="sticky left-0 z-20 bg-neutral-950 px-3.5 py-3 font-semibold text-neutral-300 min-w-44 border-r border-neutral-800">Fighter & Pass</th>
                <th className="px-3 py-3 font-semibold text-neutral-400 min-w-32 text-center border-r border-neutral-800">Entries / Valid</th>
                {visibleSessions.map((session) => (
                  <th
                    key={session.id}
                    className={`px-2.5 py-2 font-medium min-w-20 text-center border-r border-neutral-800/80 ${
                      session.status === "COMPLETED" ? "bg-emerald-950/20 text-emerald-300" : session.status === "CANCELLED" ? "bg-red-950/20 text-red-300" : "bg-neutral-900 text-neutral-300"
                    }`}
                  >
                    <div className="font-bold text-[11px] whitespace-nowrap">{formatSessionDate(session.date)}</div>
                    <div
                      className={`text-[9px] uppercase font-bold tracking-wider px-1 py-0.2 rounded mt-0.5 inline-block ${
                        session.status === "COMPLETED"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : session.status === "CANCELLED"
                            ? "bg-red-950 text-red-400 border border-red-800"
                            : "bg-amber-950 text-amber-400 border border-amber-800"
                      }`}
                    >
                      {session.status === "COMPLETED" ? "Held" : session.status === "CANCELLED" ? "Can" : "Plan"}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {filteredPasses.length === 0 ? (
                <tr>
                  <td colSpan={visibleSessions.length + 2} className="p-8 text-center text-xs text-neutral-500">
                    No passes matching the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredPasses.map((pass) => {
                  const passAttendances = attendances.filter((a) => a.pass_id === pass.id);
                  const health = calculatePassHealth(pass, passAttendances, sessions);
                  const memberName = getMemberName(pass.member_id);
                  const groupName = getGroupName(pass.training_type_id);

                  return (
                    <tr key={pass.id} className="hover:bg-neutral-850/50 transition-colors">
                      <td className="sticky left-0 z-10 bg-neutral-900 px-3.5 py-2.5 border-r border-neutral-800">
                        <div className="flex items-center justify-between gap-2">
                          <Link href={`/members/${pass.member_id}`} className="font-bold text-neutral-100 hover:text-amber-400 block truncate">
                            {memberName}
                          </Link>
                          <button
                            type="button"
                            onClick={() => openEditModal(pass)}
                            className="p-1 text-neutral-500 hover:text-neutral-200 rounded hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
                            title="Edit pass details"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-[10px] text-neutral-400 truncate mt-0.5">{groupName}</div>
                      </td>

                      <td className="px-3 py-2.5 text-center border-r border-neutral-800 font-mono">
                        <div className="flex items-center justify-center gap-1 font-bold text-neutral-200">
                          <span>
                            {health.attendedCount} / {pass.total_entries}
                          </span>
                        </div>
                        <div className="text-[9px] text-neutral-500 mt-0.5">{pass.total_entries === 0 ? "Unpaid" : health.effectiveExpiryDate}</div>
                      </td>

                      {visibleSessions.map((session) => {
                        const matchingAttendance = passAttendances.find((a) => a.date.split("T")[0] === session.date);
                        const isAttended = Boolean(matchingAttendance);
                        const isInsidePassRange = session.date >= pass.start_date && (pass.total_entries === 0 || session.date <= health.effectiveExpiryDate);

                        const isPassGroupMatch = session.training_type_id === pass.training_type_id;

                        let cellBg = "bg-neutral-950/40 text-neutral-600";
                        if (isInsidePassRange && isPassGroupMatch) {
                          if (session.status === "COMPLETED") {
                            cellBg = "bg-emerald-950/25 border-x-2 border-emerald-500/40 text-emerald-400";
                          } else if (session.status === "CANCELLED") {
                            cellBg = "bg-red-950/25 border-x-2 border-red-500/40 text-red-400";
                          } else {
                            cellBg = "bg-amber-950/20 border-x-2 border-amber-500/40 text-amber-300";
                          }
                        }

                        return (
                          <td key={session.id} className={`p-1.5 text-center border-r border-neutral-800/60 ${cellBg}`}>
                            <button
                              type="button"
                              disabled={isPending || !isPassGroupMatch}
                              onClick={() => handleCellToggle(pass, session.date, matchingAttendance?.id)}
                              className={`w-9 h-9 mx-auto rounded-xl flex items-center justify-center font-bold text-xs transition-all cursor-pointer ${
                                isAttended
                                  ? "bg-amber-500 text-neutral-950 shadow-xs ring-1 ring-amber-400"
                                  : session.status === "CANCELLED"
                                    ? "opacity-30 border border-neutral-800 text-neutral-600"
                                    : "bg-neutral-900 border border-neutral-800 text-neutral-500 hover:border-amber-500/60"
                              }`}
                              title={isAttended ? `Attended on ${session.date} (Click to undo)` : `Not attended on ${session.date} (Click to mark)`}
                            >
                              {isAttended ? "X" : "○"}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingPass && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-neutral-100">Edit Pass</h3>
                <p className="text-xs text-neutral-400 mt-0.5">{getMemberName(editingPass.member_id)}</p>
              </div>
              <button type="button" onClick={() => setEditingPass(null)} className="text-neutral-400 hover:text-neutral-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditPassSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Training Group</label>
                <select
                  value={editTrainingTypeId}
                  onChange={(e) => setEditTrainingTypeId(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
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
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Total Entries</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={editTotalEntries}
                    onChange={(e) => setEditTotalEntries(parseInt(e.target.value, 10))}
                    required
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingPass(null)} className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-medium">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !editTrainingTypeId || !editStartDate}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl text-xs font-semibold disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Update Pass"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
