// Pure calculation engine that determines the dynamic expiration date and status of a pass. It compares baseline 1-month duration against scheduled calendar sessions for the designated training group, bypassing CANCELLED sessions and pushing the expiration date to cover all purchased entries.

// Configuration Constants:
// - DEFAULT_ENTRIES: 4 entries per standard pass cycle.
// - MINIMUM_DURATION_DAYS: 30 days minimum validity baseline.

import type { Pass, Attendance, CalendarSession } from "@/types/database";

export interface PassHealth {
  effectiveExpiryDate: string;
  isExtendedDueToCancellation: boolean;
  cancelledCountAffecting: number;
  attendedCount: number;
  remainingEntries: number;
  status: "ACTIVE" | "COMPLETED" | "EXPIRED";
}

function parseISODate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatISODate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function calculatePassHealth(pass: Pass, attendances: Attendance[], sessions: CalendarSession[], currentDateStr: string = formatISODate(new Date())): PassHealth {
  const attendedCount = attendances.length;
  const remainingEntries = Math.max(0, pass.total_entries - attendedCount);

  const startDate = parseISODate(pass.start_date);
  const baselineDate = new Date(startDate);
  baselineDate.setUTCMonth(baselineDate.getUTCMonth() + 1);
  let effectiveExpiryDate = formatISODate(baselineDate);

  const relevantSessions = sessions.filter((s) => s.training_type_id === pass.training_type_id && s.date >= pass.start_date).sort((a, b) => a.date.localeCompare(b.date));

  let availableOpportunities = 0;
  let cancelledCountAffecting = 0;
  let targetSessionDate: string | null = null;

  for (const session of relevantSessions) {
    if (session.status === "CANCELLED") {
      cancelledCountAffecting += 1;
      continue;
    }

    availableOpportunities += 1;
    if (availableOpportunities === pass.total_entries) {
      targetSessionDate = session.date;
      break;
    }
  }

  let isExtendedDueToCancellation = false;

  if (targetSessionDate && targetSessionDate > effectiveExpiryDate) {
    effectiveExpiryDate = targetSessionDate;
    isExtendedDueToCancellation = cancelledCountAffecting > 0;
  }

  let status: "ACTIVE" | "COMPLETED" | "EXPIRED" = "ACTIVE";

  if (attendedCount >= pass.total_entries) {
    status = "COMPLETED";
  } else if (currentDateStr > effectiveExpiryDate) {
    status = "EXPIRED";
  }

  return {
    effectiveExpiryDate,
    isExtendedDueToCancellation,
    cancelledCountAffecting,
    attendedCount,
    remainingEntries,
    status,
  };
}
