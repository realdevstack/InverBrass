/**
 * LD-risk engine (IMPLEMENTATION-PLAN Step 10). The client's #3 pain point: warn
 * before the deadline, not after. Pure and unit-tested, with IST calendar-day
 * maths so a day-boundary bug is caught here, not by a missed deadline.
 */

import { daysBetweenIst } from "@/lib/rules/dates";

export type RiskLevel = "unknown" | "on_track" | "at_risk" | "late";

export type RiskInput = {
  expectedCompletionDate: string | null;
  committedDeadline: string | null;
  /** Days before the deadline at which the order is flagged at risk. */
  riskBufferDays?: number;
  /** True once a failed PDI has blocked dispatch. */
  pdiBlocked?: boolean;
};

export type RiskAssessment = {
  daysToDeadline: number | null;
  expectedLate: boolean;
  atRisk: boolean;
  extensionNeeded: boolean;
  level: RiskLevel;
  reason: string;
};

export const DEFAULT_RISK_BUFFER_DAYS = 7;

export function assessLdRisk(input: RiskInput, now: Date = new Date()): RiskAssessment {
  const buffer = input.riskBufferDays ?? DEFAULT_RISK_BUFFER_DAYS;
  const deadline = input.committedDeadline;
  const expected = input.expectedCompletionDate;

  if (!deadline) {
    return {
      daysToDeadline: null,
      expectedLate: false,
      atRisk: false,
      extensionNeeded: false,
      level: "unknown",
      reason: "No committed deadline recorded",
    };
  }

  const daysToDeadline = daysBetweenIst(now, deadline);
  const expectedLate = expected !== null ? daysBetweenIst(deadline, expected) > 0 : false;
  const overdue = daysToDeadline < 0;
  const insideWindow = daysToDeadline <= buffer;

  const atRisk = overdue || expectedLate || insideWindow || Boolean(input.pdiBlocked);
  const extensionNeeded = atRisk && !overdue;

  let level: RiskLevel;
  let reason: string;
  if (overdue) {
    level = "late";
    reason = `Past the committed deadline by ${Math.abs(daysToDeadline)} day(s)`;
  } else if (input.pdiBlocked) {
    level = "at_risk";
    reason = "A failed or held PDI is blocking dispatch";
  } else if (expectedLate) {
    level = "at_risk";
    reason = "Expected completion is after the committed deadline";
  } else if (insideWindow) {
    level = "at_risk";
    reason = `Within ${buffer} day(s) of the committed deadline`;
  } else {
    level = "on_track";
    reason = "Expected completion is ahead of the deadline";
  }

  return { daysToDeadline, expectedLate, atRisk, extensionNeeded, level, reason };
}
