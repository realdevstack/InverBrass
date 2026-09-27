/**
 * IST day maths. Timestamps are stored UTC, but deadlines, document expiry and
 * LD risk are calendar-day questions in Asia/Kolkata (TECH-STACK date rule).
 * Everything here is pure and unit-tested so a day-boundary bug is caught in the
 * test suite rather than by a missed deadline.
 */

export const IST_TIME_ZONE = "Asia/Kolkata";

const IST_DATE_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: IST_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** The IST calendar date of an instant, as YYYY-MM-DD. */
export function istDateString(value: Date | string | number): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid date: ${String(value)}`);
  return IST_DATE_FORMAT.format(date);
}

/** Whole days from one IST calendar date to another (negative if `to` is earlier). */
export function daysBetweenIst(from: Date | string, to: Date | string): number {
  const fromKey = istDateString(from);
  const toKey = istDateString(to);
  const fromUtc = Date.parse(`${fromKey}T00:00:00Z`);
  const toUtc = Date.parse(`${toKey}T00:00:00Z`);
  return Math.round((toUtc - fromUtc) / 86_400_000);
}

/** Days remaining until a deadline, counted in IST days: 0 means due today. */
export function daysUntilDeadline(deadline: Date | string, now: Date = new Date()): number {
  return daysBetweenIst(now, deadline);
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Short Indian money form: ₹1.25 Cr, ₹40.77 L, ₹9.3K. */
export function formatInrCompact(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_00_00_000) return `₹${(amount / 1_00_00_000).toFixed(2)} Cr`;
  if (abs >= 1_00_000) return `₹${(amount / 1_00_000).toFixed(2)} L`;
  if (abs >= 1_000) return `₹${(amount / 1_000).toFixed(1)}K`;
  return `₹${amount.toFixed(0)}`;
}
