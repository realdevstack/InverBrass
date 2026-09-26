import { describe, expect, it } from "vitest";

import { daysUntilDeadline, formatInr, istDateString } from "@/lib/rules/dates";

describe("IST day maths", () => {
  it("rolls the IST calendar day at 18:30 UTC, not midnight UTC", () => {
    // 2026-03-01T18:29Z is still 2026-03-01 23:59 IST.
    expect(istDateString("2026-03-01T18:29:00Z")).toBe("2026-03-01");
    // 2026-03-01T18:30Z is 2026-03-02 00:00 IST.
    expect(istDateString("2026-03-01T18:30:00Z")).toBe("2026-03-02");
  });

  it("counts days to a deadline in IST days (0 means due today)", () => {
    const now = new Date("2026-03-01T05:00:00Z"); // 2026-03-01 10:30 IST
    expect(daysUntilDeadline("2026-03-01T18:29:00Z", now)).toBe(0);
    expect(daysUntilDeadline("2026-03-02T18:29:00Z", now)).toBe(1);
    expect(daysUntilDeadline("2026-02-28T05:00:00Z", now)).toBe(-1);
  });

  it("formats INR", () => {
    expect(formatInr(12500000)).toContain("1,25,00,000");
  });
});
