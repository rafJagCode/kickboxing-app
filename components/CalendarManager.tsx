/*
 * Description: Saturday and flexible session calendar manager with collapsible sections for summary, group filtering, and session scheduling, collapsed by default.
 * Config: State booleans isSummaryOpen, isFilterOpen, and isScheduleOpen initialize to false.
 */
"use client";

import { useState, useTransition } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, CheckCircle2, XCircle, Clock, Award, Layers, Plus, Trash2, Sparkles } from "lucide-react";
import { upsertSessionStatus, addSessionDate, populateSaturdaysForMonth, deleteSessionDate } from "@/app/calendar/actions";
import { formatSessionDate } from "@/lib/date-utils";
import type { TrainingType, CalendarSession, CalendarSessionStatus } from "@/types/database";

interface CalendarManagerProps {
  trainingTypes: TrainingType[];
  initialSessions: CalendarSession[];
  year: number;
  month: number;
}

export default function CalendarManager({ trainingTypes, initialSessions, year, month }: CalendarManagerProps) {
  const [selectedTypeId, setSelectedTypeId] = useState<string>("ALL");
  const [targetGroupForAdd, setTargetGroupForAdd] = useState<string>(trainingTypes[0]?.id || "");
  const [newDate, setNewDate] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  const handlePrevMonth = () => {
    const prev = new Date(Date.UTC(year, month - 1, 1));
    window.location.href = `/calendar?year=${prev.getUTCFullYear()}&month=${prev.getUTCMonth()}`;
  };

  const handleNextMonth = () => {
    const next = new Date(Date.UTC(year, month + 1, 1));
    window.location.href = `/calendar?year=${next.getUTCFullYear()}&month=${next.getUTCMonth()}`;
  };

  const displayedSessions = initialSessions.filter((s) => selectedTypeId === "ALL" || s.training_type_id === selectedTypeId).sort((a, b) => a.date.localeCompare(b.date));

  const completedSessions = initialSessions.filter((s) => s.status === "COMPLETED");
  const totalUnits = completedSessions.length;

  const monthName = new Date(Date.UTC(year, month, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const getGroupName = (typeId: string) => {
    return trainingTypes.find((t) => t.id === typeId)?.name || "General";
  };

  const handleStatusChange = (trainingTypeId: string, date: string, newStatus: CalendarSessionStatus) => {
    setError(null);
    startTransition(async () => {
      try {
        await upsertSessionStatus(trainingTypeId, date, newStatus);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Status update failed");
      }
    });
  };

  const handleAddCustomDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate) return;

    const targetId = selectedTypeId === "ALL" ? targetGroupForAdd : selectedTypeId;
    if (!targetId) {
      setError("Please select a training group.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await addSessionDate(targetId, newDate);
        setNewDate("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add date");
      }
    });
  };

  const handleAutoPopulateSaturdays = () => {
    const targetId = selectedTypeId === "ALL" ? targetGroupForAdd : selectedTypeId;
    if (!targetId) {
      setError("Please select a training group.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await populateSaturdaysForMonth(targetId, year, month);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Auto-population failed");
      }
    });
  };

  const handleDeleteSession = (sessionId: string, date: string, typeId: string) => {
    const groupName = getGroupName(typeId);
    if (confirm(`Remove ${groupName} session on ${formatSessionDate(date)}?`)) {
      setError(null);
      startTransition(async () => {
        try {
          await deleteSessionDate(sessionId);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Delete failed");
        }
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 flex items-center justify-between">
        <button onClick={handlePrevMonth} className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer" title="Previous Month">
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="font-bold text-sm text-neutral-100">{monthName}</div>
          <div className="text-[10px] text-neutral-500 uppercase tracking-wider">{displayedSessions.length} Total Sessions</div>
        </div>

        <button onClick={handleNextMonth} className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer" title="Next Month">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm transition-all">
        <button type="button" onClick={() => setIsSummaryOpen(!isSummaryOpen)} className="w-full p-3.5 flex items-center justify-between text-left hover:bg-neutral-850 transition-colors cursor-pointer">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-200">Coach Monthly Summary</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">{totalUnits} Units Held</span>
            {isSummaryOpen ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
          </div>
        </button>

        {isSummaryOpen && (
          <div className="p-3.5 pt-0 space-y-2 border-t border-neutral-800/60 mt-1">
            <div className="flex flex-col gap-2 pt-2">
              {trainingTypes.map((t) => {
                const count = completedSessions.filter((s) => s.training_type_id === t.id).length;
                return (
                  <div key={t.id} className="bg-neutral-950/80 border border-neutral-800/80 rounded-xl px-3 py-2 flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-neutral-300 truncate">{t.name}</span>
                    <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-900 px-2 py-0.5 rounded-lg shrink-0">{count} held</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm transition-all">
        <button type="button" onClick={() => setIsFilterOpen(!isFilterOpen)} className="w-full p-3.5 flex items-center justify-between text-left hover:bg-neutral-850 transition-colors cursor-pointer">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-neutral-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">Filter by Group</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">{selectedTypeId === "ALL" ? "All Groups" : getGroupName(selectedTypeId)}</span>
            {isFilterOpen ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
          </div>
        </button>

        {isFilterOpen && (
          <div className="p-3.5 pt-0 border-t border-neutral-800/60 mt-1">
            <div className="flex flex-col gap-1.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedTypeId("ALL");
                  setIsFilterOpen(false);
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                  selectedTypeId === "ALL" ? "bg-amber-500 text-neutral-950 shadow-sm" : "bg-neutral-950/80 border border-neutral-800 text-neutral-300 hover:bg-neutral-800"
                }`}
              >
                <span>All Groups</span>
                {selectedTypeId === "ALL" && <span className="text-[10px] font-bold uppercase tracking-wider bg-neutral-950/20 px-2 py-0.5 rounded-md">Active</span>}
              </button>

              {trainingTypes.map((t) => {
                const isSelected = t.id === selectedTypeId;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setSelectedTypeId(t.id);
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

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm transition-all">
        <button type="button" onClick={() => setIsScheduleOpen(!isScheduleOpen)} className="w-full p-3.5 flex items-center justify-between text-left hover:bg-neutral-850 transition-colors cursor-pointer">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">Schedule New Session</span>
          </div>
          <div className="flex items-center gap-2">
            {selectedTypeId !== "ALL" && <span className="text-[11px] text-amber-400">{getGroupName(selectedTypeId)}</span>}
            {isScheduleOpen ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
          </div>
        </button>

        {isScheduleOpen && (
          <div className="p-3.5 pt-0 space-y-3 border-t border-neutral-800/60 mt-1">
            <div className="pt-2">
              {error && <p className="text-xs text-red-400 bg-red-950/40 p-2 rounded-lg border border-red-900/50 mb-2">{error}</p>}

              <form onSubmit={handleAddCustomDate} className="space-y-2">
                {selectedTypeId === "ALL" && (
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">Assign to Group:</label>
                    <select
                      value={targetGroupForAdd}
                      onChange={(e) => setTargetGroupForAdd(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    >
                      {trainingTypes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    required
                    className="flex-1 px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                  <button
                    type="submit"
                    disabled={isPending || !newDate}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Date</span>
                  </button>
                </div>
              </form>

              <button
                type="button"
                disabled={isPending}
                onClick={handleAutoPopulateSaturdays}
                className="w-full mt-2.5 py-2 px-3 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Auto-fill Saturdays for {selectedTypeId === "ALL" ? getGroupName(targetGroupForAdd) : getGroupName(selectedTypeId)}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
          <span className="font-semibold text-neutral-300">
            {selectedTypeId === "ALL" ? "All Groups Schedule" : `${getGroupName(selectedTypeId)} Schedule`} ({displayedSessions.length})
          </span>
          <span className="text-[11px] text-neutral-500">Tap status to toggle</span>
        </div>

        {displayedSessions.length === 0 ? (
          <div className="p-8 text-center bg-neutral-900/40 border border-neutral-900 rounded-2xl">
            <CalendarDays className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
            <p className="text-xs text-neutral-400 font-medium">No sessions scheduled for this month</p>
            <p className="text-[11px] text-neutral-600 mt-1">Expand Schedule New Session above to add dates</p>
          </div>
        ) : (
          displayedSessions.map((session) => {
            const currentStatus = session.status;
            const groupName = getGroupName(session.training_type_id);

            return (
              <div
                key={session.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  currentStatus === "COMPLETED" ? "bg-emerald-950/20 border-emerald-900/60" : currentStatus === "CANCELLED" ? "bg-red-950/20 border-red-900/60" : "bg-neutral-900 border-neutral-800"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <CalendarDays className={`w-4 h-4 ${currentStatus === "COMPLETED" ? "text-emerald-400" : currentStatus === "CANCELLED" ? "text-red-400" : "text-amber-500"}`} />
                    <span className="text-sm font-bold text-neutral-100">{formatSessionDate(session.date)}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        currentStatus === "COMPLETED"
                          ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                          : currentStatus === "CANCELLED"
                            ? "bg-red-950 text-red-400 border-red-800"
                            : "bg-amber-950 text-amber-400 border-amber-800"
                      }`}
                    >
                      {currentStatus}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDeleteSession(session.id, session.date, session.training_type_id)}
                      className="p-1 text-neutral-500 hover:text-red-400 rounded transition-colors"
                      title="Remove date"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mb-2.5">
                  <span className="text-[11px] font-medium text-amber-400/90 bg-amber-950/30 border border-amber-900/40 px-2 py-0.5 rounded-md">{groupName}</span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleStatusChange(session.training_type_id, session.date, "PLANNED")}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      currentStatus === "PLANNED" ? "bg-amber-500 text-neutral-950" : "bg-neutral-950/70 border border-neutral-800 text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Planned</span>
                  </button>

                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleStatusChange(session.training_type_id, session.date, "COMPLETED")}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      currentStatus === "COMPLETED" ? "bg-emerald-500 text-neutral-950" : "bg-neutral-950/70 border border-neutral-800 text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Held</span>
                  </button>

                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleStatusChange(session.training_type_id, session.date, "CANCELLED")}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      currentStatus === "CANCELLED" ? "bg-red-500 text-neutral-950" : "bg-neutral-950/70 border border-neutral-800 text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Cancelled</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
