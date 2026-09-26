import { describe, expect, it } from "vitest";

import { assessLdRisk } from "@/lib/rules/ld-risk";

const now = new Date("2026-09-01T06:00:00Z"); // 11:30 IST

describe("LD-risk engine", () => {
  it("is unknown without a committed deadline", () => {
    const risk = assessLdRisk({ expectedCompletionDate: null, committedDeadline: null }, now);
    expect(risk.level).toBe("unknown");
    expect(risk.atRisk).toBe(false);
  });

  it("flags at risk inside the buffer window, with days to deadline", () => {
    const risk = assessLdRisk({ expectedCompletionDate: "2026-09-05", committedDeadline: "2026-09-06" }, now);
    expect(risk.daysToDeadline).toBe(5);
    expect(risk.level).toBe("at_risk");
    expect(risk.extensionNeeded).toBe(true);
  });

  it("flags expected-late completion as at risk even far from the deadline", () => {
    const risk = assessLdRisk({ expectedCompletionDate: "2026-10-20", committedDeadline: "2026-10-01" }, now);
    expect(risk.expectedLate).toBe(true);
    expect(risk.level).toBe("at_risk");
  });

  it("is on track when completion is ahead of a distant deadline", () => {
    const risk = assessLdRisk({ expectedCompletionDate: "2026-10-20", committedDeadline: "2026-12-01" }, now);
    expect(risk.level).toBe("on_track");
    expect(risk.atRisk).toBe(false);
    expect(risk.extensionNeeded).toBe(false);
  });

  it("treats a passed deadline as late and does not open a late extension request", () => {
    const risk = assessLdRisk({ expectedCompletionDate: "2026-08-30", committedDeadline: "2026-08-31" }, now);
    expect(risk.level).toBe("late");
    expect(risk.daysToDeadline).toBe(-1);
    expect(risk.extensionNeeded).toBe(false);
  });

  it("counts the deadline in IST days (a UTC evening is still the same IST day)", () => {
    // 2026-09-06T19:00:00Z is 2026-09-07 00:30 IST, so from 1 Sep IST that is 6 days.
    const lateEvening = new Date("2026-09-06T19:00:00Z");
    const risk = assessLdRisk({ expectedCompletionDate: null, committedDeadline: "2026-09-07" }, lateEvening);
    expect(risk.daysToDeadline).toBe(0);
  });
});
