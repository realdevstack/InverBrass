import { describe, expect, it } from "vitest";

import { formatInr } from "@/lib/rules/dates";
import {
  EMAIL_TEMPLATE_CATALOGUE,
  certificationExpiryReminder,
  documentExpiryReminder,
  paymentDueReminder,
  paymentEscalation,
  rfiDeadlineReminder,
} from "@/lib/rules/email-templates";

describe("reminder email templates (placeholders, nothing sent)", () => {
  it("builds an RFI deadline reminder with the number, deadline and days left", () => {
    const draft = rfiDeadlineReminder({
      rfiNumber: "RFI/2026/0042",
      projectName: "Airborne Radio Set",
      customerAgency: "HAL",
      submissionDeadline: "2026-10-05",
      daysLeft: 4,
      assignedTo: "Sales Team",
    });
    expect(draft.subject).toContain("RFI/2026/0042");
    expect(draft.body).toContain("RFI/2026/0042");
    expect(draft.body).toContain("Airborne Radio Set");
    expect(draft.body).toContain("HAL");
    expect(draft.body).toContain("4 day(s) from today");
    expect(draft.body).toContain("2026-10-05");
    expect(draft.to).toContain("Sales Team");
  });

  it("builds a payment due reminder with the formatted balance and due date", () => {
    const draft = paymentDueReminder({
      invoiceNumber: "BD/INV/2026/501",
      poNumber: "PO/HAL/2026/001",
      customer: "HAL",
      grossAmount: 14750000,
      balanceOutstanding: 4425000,
      paymentDueDate: "2026-10-25",
      overdueDays: 12,
    });
    expect(draft.subject).toContain("BD/INV/2026/501");
    expect(draft.subject).toContain(formatInr(4425000));
    expect(draft.body).toContain("PO/HAL/2026/001");
    expect(draft.body).toContain(formatInr(4425000));
    expect(draft.body).toContain(formatInr(14750000));
    expect(draft.body).toContain("2026-10-25");
    expect(draft.body).toContain("12 day(s) overdue");
  });

  it("builds an escalation draft naming the escalation target", () => {
    const draft = paymentEscalation({
      invoiceNumber: "BD/INV/2026/501",
      poNumber: "PO/HAL/2026/001",
      customer: "HAL",
      balanceOutstanding: 4425000,
      overdueDays: 45,
      escalationTo: "Management",
    });
    expect(draft.subject).toContain("45 days overdue");
    expect(draft.body).toContain("Management");
    expect(draft.body).toContain(formatInr(4425000));
  });

  it("builds an expiring-document reminder linked to its PO", () => {
    const draft = documentExpiryReminder({
      title: "DGQA approval certificate",
      documentType: "dgqa",
      linkedTo: "PO PO/HAL/2026/001",
      expiryDate: "2026-11-30",
      daysToExpiry: 60,
    });
    expect(draft.subject).toContain("DGQA approval certificate");
    expect(draft.body).toContain("DGQA approval certificate");
    expect(draft.body).toContain("PO PO/HAL/2026/001");
    expect(draft.body).toContain("2026-11-30");
    expect(draft.body).toContain("60 day(s) remaining");
  });

  it("words the certification reminder by expiry state", () => {
    const dueSoon = certificationExpiryReminder({
      oemName: "Bharat Dynamics Ltd",
      certificationType: "dgqa",
      expiryDate: "2026-11-30",
      daysRemaining: 60,
      expiryState: "due_soon",
    });
    expect(dueSoon.body).toContain("is due soon");
    expect(dueSoon.body).toContain("Bharat Dynamics Ltd");

    const expired = certificationExpiryReminder({
      oemName: "Bharat Dynamics Ltd",
      certificationType: "dgqa",
      expiryDate: "2026-09-01",
      daysRemaining: -26,
      expiryState: "expired",
    });
    expect(expired.body).toContain("has expired");
  });

  it("covers every reminder with documented merge fields", () => {
    expect(EMAIL_TEMPLATE_CATALOGUE.length).toBeGreaterThanOrEqual(5);
    for (const spec of EMAIL_TEMPLATE_CATALOGUE) {
      expect(spec.fields.length).toBeGreaterThan(0);
      expect(spec.purpose.length).toBeGreaterThan(0);
    }
    const keys = EMAIL_TEMPLATE_CATALOGUE.map((spec) => spec.key);
    expect(keys).toEqual(
      expect.arrayContaining(["rfi_deadline", "payment_due", "payment_escalation", "document_expiry", "certification_expiry"]),
    );
  });
});
