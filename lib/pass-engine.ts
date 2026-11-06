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
  overdraftCount: number;
  displaySlotsCount: number;
  status: "ACTIVE" | "COMPLETED" | "EXPIRED" | "UNPAID";
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

function getBaselineExpiryDate(startDateStr: string): string {
  const startDate = parseISODate(startDateStr);
  const baseline = new Date(startDate);
  baseline.setUTCMonth(baseline.getUTCMonth() + 1);
  return formatISODate(baseline);
}

function computeSessionExtension(pass: Pass, sessions: CalendarSession[], baselineExpiry: string): { finalExpiry: string; isExtended: boolean; cancelledCount: number } {
  if (pass.total_entries === 0) {
    return {
      finalExpiry: baselineExpiry,
      isExtended: false,
      cancelledCount: 0,
    };
  }

  const relevantSessions = sessions.filter((s) => s.training_type_id === pass.training_type_id && s.date >= pass.start_date).sort((a, b) => a.date.localeCompare(b.date));

  let availableOpportunities = 0;
  let cancelledCount = 0;
  let targetSessionDate: string | null = null;

  for (const session of relevantSessions) {
    if (session.status === "CANCELLED") {
      cancelledCount += 1;
      continue;
    }

    availableOpportunities += 1;
    if (availableOpportunities === pass.total_entries) {
      targetSessionDate = session.date;
      break;
    }
  }

  if (targetSessionDate && targetSessionDate > baselineExpiry) {
    return {
      finalExpiry: targetSessionDate,
      isExtended: cancelledCount > 0,
      cancelledCount,
    };
  }

  return {
    finalExpiry: baselineExpiry,
    isExtended: false,
    cancelledCount,
  };
}

function calculateSlotMetrics(
  totalEntries: number,
  attendedCount: number,
): {
  remainingEntries: number;
  overdraftCount: number;
  displaySlotsCount: number;
} {
  if (totalEntries === 0) {
    return {
      remainingEntries: 0,
      overdraftCount: attendedCount,
      displaySlotsCount: Math.max(4, attendedCount + 1),
    };
  }

  const remainingEntries = Math.max(0, totalEntries - attendedCount);
  const overdraftCount = Math.max(0, attendedCount - totalEntries);
  const baseSlots = Math.max(4, totalEntries);
  const displaySlotsCount = Math.max(baseSlots, attendedCount + 1);

  return {
    remainingEntries,
    overdraftCount,
    displaySlotsCount,
  };
}

function resolvePassStatus(totalEntries: number, attendedCount: number, currentDateStr: string, effectiveExpiryDate: string): "ACTIVE" | "COMPLETED" | "EXPIRED" | "UNPAID" {
  if (totalEntries === 0) {
    return "UNPAID";
  }
  if (attendedCount >= totalEntries) {
    return "COMPLETED";
  }
  if (currentDateStr > effectiveExpiryDate) {
    return "EXPIRED";
  }
  return "ACTIVE";
}

export function calculatePassHealth(pass: Pass, attendances: Attendance[], sessions: CalendarSession[], currentDateStr: string = formatISODate(new Date())): PassHealth {
  const attendedCount = attendances.length;
  const baselineExpiry = getBaselineExpiryDate(pass.start_date);
  const { finalExpiry, isExtended, cancelledCount } = computeSessionExtension(pass, sessions, baselineExpiry);

  const { remainingEntries, overdraftCount, displaySlotsCount } = calculateSlotMetrics(pass.total_entries, attendedCount);

  const status = resolvePassStatus(pass.total_entries, attendedCount, currentDateStr, finalExpiry);

  return {
    effectiveExpiryDate: finalExpiry,
    isExtendedDueToCancellation: isExtended,
    cancelledCountAffecting: cancelledCount,
    attendedCount,
    remainingEntries,
    overdraftCount,
    displaySlotsCount,
    status,
  };
}
