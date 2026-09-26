import { describe, expect, it } from "vitest";

import { answerQuestion, type AnswerFacts } from "@/lib/rules/answers";

const facts: AnswerFacts = {
  totalRfis: 12,
  rfisOpen: 4,
  activeQuotations: 5,
  openPos: 7,
  pendingOemInvoices: 3,
  overdueInvoices: 1,
  documentsExpiring: 2,
  won: 6,
  lost: 4,
  submitted: 2,
  wonThisMonth: 3,
  lossesByReason: { price: 3, delivery_timeline: 1 },
  revenueByClient: [{ label: "HAL", value: 12500000 }],
  revenueByOem: [{ label: "Bharat Dynamics Ltd", value: 12500000 }],
};

describe("deterministic answers", () => {
  it("answers order and win questions from facts", () => {
    expect(answerQuestion("how many orders are there?", facts).answer).toContain("7");
    expect(answerQuestion("how many contracts did we win this month?", facts).intent).toBe("won_this_month");
    expect(answerQuestion("what did we lose?", facts).answer).toContain("4");
  });

  it("summarises loss reasons", () => {
    const answer = answerQuestion("why did we lose them?", facts);
    expect(answer.intent).toBe("why_lost");
    expect(answer.answer).toContain("price");
    expect(answer.answer).toContain("delivery timeline");
  });

  it("answers invoice, expiry and revenue questions without inventing data", () => {
    expect(answerQuestion("how many invoices are pending?", facts).intent).toBe("pending_invoices");
    expect(answerQuestion("which documents are expiring?", facts).answer).toContain("2");
    expect(answerQuestion("what is the revenue by client?", facts).answer).toContain("HAL");
  });

  it("falls back to the known question list for anything else", () => {
    const answer = answerQuestion("what is the weather?", facts);
    expect(answer.intent).toBe("fallback");
    expect(answer.answer).toMatch(/stored data only/i);
  });
});
