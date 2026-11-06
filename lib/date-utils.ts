/**
 * Returns all Saturdays for a given month ('YYYY-MM-DD').
 * Used for the 1-tap bulk-add feature.
 */
export function getSaturdaysInMonth(year: number, month: number): string[] {
  const saturdays: string[] = [];
  const date = new Date(Date.UTC(year, month, 1));

  while (date.getUTCMonth() === month) {
    if (date.getUTCDay() === 6) {
      const y = date.getUTCFullYear();
      const m = String(date.getUTCMonth() + 1).padStart(2, "0");
      const d = String(date.getUTCDate()).padStart(2, "0");
      saturdays.push(`${y}-${m}-${d}`);
    }
    date.setUTCDate(date.getUTCDate() + 1);
  }

  return saturdays;
}

/**
 * Formats any 'YYYY-MM-DD' into a friendly readable string:
 * e.g., "Saturday, Nov 7" or "Wednesday, Nov 11"
 */
export function formatSessionDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
