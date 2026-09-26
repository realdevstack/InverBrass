/**
 * Deterministic answer layer (IMPLEMENTATION-PLAN Step 13).
 *
 * Every plain-language question the dashboard can answer is matched to a fixed
 * intent and a value already computed from stored data. No model is involved, so
 * the app still answers when every provider is rate-limited or down. Step 14's
 * assistant only ever rephrases these answers.
 */

export type AnswerFacts = {
  totalRfis: number;
  rfisOpen: number;
  activeQuotations: number;
  openPos: number;
  pendingOemInvoices: number;
  overdueInvoices: number;
  documentsExpiring: number;
  won: number;
  lost: number;
  submitted: number;
  wonThisMonth: number;
  lossesByReason: Record<string, number>;
  revenueByClient: Array<{ label: string; value: number }>;
  revenueByOem: Array<{ label: string; value: number }>;
};

export type AnswerIntent =
  | "orders"
  | "won_this_month"
  | "won"
  | "lost"
  | "why_lost"
  | "pending_invoices"
  | "overdue"
  | "expiring_documents"
  | "rfis"
  | "active_quotations"
  | "revenue"
  | "fallback";

export type DeterministicAnswer = {
  intent: AnswerIntent;
  question: string;
  answer: string;
};

export const SAMPLE_QUESTIONS = [
  "how many orders are there?",
  "how many contracts did we win this month?",
  "what did we lose?",
  "why did we lose them?",
  "how many invoices are pending?",
  "which payments are overdue?",
  "which documents are expiring?",
  "how many RFIs do we have?",
  "what is the revenue by client?",
];

const n = (value: number) => value.toLocaleString("en-IN");

export function answerQuestion(question: string, facts: AnswerFacts): DeterministicAnswer {
  const q = ` ${question.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ")} `;
  const has = (...words: string[]) => words.every((w) => q.includes(` ${w} `));

  const base = (intent: AnswerIntent, answer: string): DeterministicAnswer => ({ intent, question, answer });

  if (has("why", "lose") || has("why", "lost") || has("reason", "lost")) {
    const entries = Object.entries(facts.lossesByReason).sort((a, b) => b[1] - a[1]);
    const detail = entries.length > 0 ? entries.map(([reason]) => reason.replace(/_/g, " ")).join(", ") : "no recorded losses";
    return base("why_lost", `Across the stored bids the loss reasons on record are: ${detail}.`);
  }
  if (has("won", "month") || has("win", "month")) {
    return base("won_this_month", `${n(facts.wonThisMonth)} requirement(s) were won this month.`);
  }
  if (has("orders") || has("purchase", "orders") || has("pos")) {
    return base("orders", `There are ${n(facts.openPos)} open purchase order(s).`);
  }
  if (has("won") || has("win") || has("contracts")) {
    return base("won", `${n(facts.won)} requirement(s) have been won.`);
  }
  if (has("lost") || has("lose")) {
    return base("lost", `${n(facts.lost)} requirement(s) have been lost.`);
  }
  if (has("pending", "invoices") || has("pending", "invoice")) {
    return base("pending_invoices", `${n(facts.pendingOemInvoices)} OEM invoice(s) are not fully paid.`);
  }
  if (has("overdue") || has("outstanding")) {
    return base("overdue", `${n(facts.overdueInvoices)} OEM invoice(s) are overdue.`);
  }
  if (has("expiring") || has("expiry") || has("expire")) {
    return base("expiring_documents", `${n(facts.documentsExpiring)} document(s) are expiring within 90 days.`);
  }
  if (has("rfis") || has("rfi") || has("requirements")) {
    return base("rfis", `There are ${n(facts.totalRfis)} requirement(s) (RFIs); ${n(facts.rfisOpen)} are still open.`);
  }
  if (has("quotations") || has("active", "quotation")) {
    return base("active_quotations", `${n(facts.activeQuotations)} quotation(s) are active.`);
  }
  if (has("revenue") || has("sales")) {
    const top = [...facts.revenueByClient].sort((a, b) => b.value - a.value).slice(0, 3);
    const detail = top.length > 0 ? top.map((r) => `${r.label}: ${n(r.value)}`).join(", ") : "no purchase orders yet";
    return base("revenue", `Revenue by client (PO value): ${detail}.`);
  }

  return base(
    "fallback",
    `I can answer from stored data only. Try: ${SAMPLE_QUESTIONS.slice(0, 4).join("; ")}.`,
  );
}
