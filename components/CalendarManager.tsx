"use client";

import { useState, useTransition } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock, Award, Layers, Plus, Trash2, Sparkles } from "lucide-react";
import { upsertSessionStatus, addSessionDate, populateSaturdaysForMonth, deleteSessionDate } from "@/app/calendar/actions";
import { formatSessionDate } from "@/lib/date-utils";
import type { TrainingType, CalendarSession, CalendarSessionStatus } from "@/types/database";

interface CalendarManagerProps {
  trainingTypes: TrainingType[];
  initialSessions: CalendarSession[];
  year: number;
  month: number; // 0 = Jan, 11 = Dec
}

export default function CalendarManager({ trainingTypes, initialSessions, year, month }: CalendarManagerProps) {
  const [selectedTypeId, setSelectedTypeId] = useState<string>(trainingTypes[0]?.id || "");
  const [newDate, setNewDate] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Month navigation
  const handlePrevMonth = () => {
    const prev = new Date(Date.UTC(year, month - 1, 1));
    window.location.href = `/calendar?year=${prev.getUTCFullYear()}&month=${prev.getUTCMonth()}`;
  };

  const handleNextMonth = () => {
    const next = new Date(Date.UTC(year, month + 1, 1));
    window.location.href = `/calendar?year=${next.getUTCFullYear()}&month=${next.getUTCMonth()}`;
  };

  // Sessions for currently selected training group, ordered chronologically
  const groupSessions = initialSessions.filter((s) => s.training_type_id === selectedTypeId).sort((a, b) => a.date.localeCompare(b.date));

  // Monthly Report Calculations
  const completedSessions = initialSessions.filter((s) => s.status === "COMPLETED");
  const totalUnits = completedSessions.length;

  const currentGroupName = trainingTypes.find((t) => t.id === selectedTypeId)?.name || "Training Group";

  const monthName = new Date(Date.UTC(year, month, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const handleStatusChange = (date: string, newStatus: CalendarSessionStatus) => {
    setError(null);
    startTransition(async () => {
      try {
        await upsertSessionStatus(selectedTypeId, date, newStatus);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Status update failed");
      }
    });
  };

  const handleAddCustomDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate) return;
    setError(null);
    startTransition(async () => {
      try {
        await addSessionDate(selectedTypeId, newDate);
        setNewDate("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add date");
      }
    });
  };

  const handleAutoPopulateSaturdays = () => {
    setError(null);
    startTransition(async () => {
      try {
        await populateSaturdaysForMonth(selectedTypeId, year, month);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Auto-population failed");
      }
    });
  };

  const handleDeleteSession = (sessionId: string, date: string) => {
    if (confirm(`Remove training session on ${formatSessionDate(date)}?`)) {
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
    <div className="space-y-5">
      {/* 1. Month / Year Header Selector */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 flex items-center justify-between">
        <button onClick={handlePrevMonth} className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer" title="Previous Month">
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="font-bold text-sm text-neutral-100">{monthName}</div>
          <div className="text-[10px] text-neutral-500 uppercase tracking-wider">{groupSessions.length} Scheduled Sessions</div>
        </div>

        <button onClick={handleNextMonth} className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer" title="Next Month">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Coach Monthly Summary Widget */}
      <div className="bg-linear-to-br from-neutral-900 via-neutral-900/90 to-amber-950/20 border border-neutral-800 rounded-2xl p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-200">Coach Monthly Summary</h3>
          </div>
          <div className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">{totalUnits} Units Held</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          {trainingTypes.map((t) => {
            const count = completedSessions.filter((s) => s.training_type_id === t.id).length;
            return (
              <div key={t.id} className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-2.5 flex items-center justify-between">
                <span className="text-[11px] text-neutral-400 truncate pr-2">{t.name}</span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900">{count} held</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Training Group Tabs */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-neutral-400 px-1 font-semibold">
          <Layers className="w-3.5 h-3.5 text-neutral-500" />
          <span>Select Training Group</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {trainingTypes.map((t) => {
            const isSelected = t.id === selectedTypeId;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTypeId(t.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  isSelected ? "bg-amber-500 text-neutral-950 shadow-sm" : "bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {t.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Scheduling Controls (Add Any Day OR Auto-fill Saturdays) */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-neutral-300">
          <span>Schedule Sessions ({currentGroupName})</span>
        </div>

        {error && <p className="text-xs text-red-400 bg-red-950/40 p-2 rounded-lg border border-red-900/50">{error}</p>}

        {/* Custom Date Form (Any Day of the Week) */}
        <form onSubmit={handleAddCustomDate} className="flex gap-2">
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
        </form>

        {/* Quick Helper Button: Auto-populate Saturdays */}
        <button
          type="button"
          disabled={isPending}
          onClick={handleAutoPopulateSaturdays}
          className="w-full py-2 px-3 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Auto-fill all Saturdays of this month</span>
        </button>
      </div>

      {/* 5. Scheduled Sessions List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
          <span className="font-semibold text-neutral-300">
            Sessions in {monthName} ({groupSessions.length})
          </span>
          <span className="text-[11px] text-neutral-500">Tap status to toggle</span>
        </div>

        {groupSessions.length === 0 ? (
          <div className="p-8 text-center bg-neutral-900/40 border border-neutral-900 rounded-2xl">
            <CalendarDays className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
            <p className="text-xs text-neutral-400 font-medium">No sessions scheduled for this month yet</p>
            <p className="text-[11px] text-neutral-600 mt-1">Add any training date above or click auto-fill Saturdays</p>
          </div>
        ) : (
          groupSessions.map((session) => {
            const currentStatus = session.status;

            return (
              <div
                key={session.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  currentStatus === "COMPLETED" ? "bg-emerald-950/20 border-emerald-900/60" : currentStatus === "CANCELLED" ? "bg-red-950/20 border-red-900/60" : "bg-neutral-900 border-neutral-800"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2.5">
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

                    <button type="button" onClick={() => handleDeleteSession(session.id, session.date)} className="p-1 text-neutral-500 hover:text-red-400 rounded transition-colors" title="Remove date">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Status Toggles */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleStatusChange(session.date, "PLANNED")}
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
                    onClick={() => handleStatusChange(session.date, "COMPLETED")}
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
                    onClick={() => handleStatusChange(session.date, "CANCELLED")}
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
