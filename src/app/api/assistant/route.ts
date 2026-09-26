import { NextResponse } from "next/server";

import { isAssistantConfigured, rephraseAnswer } from "@/lib/ai/assistant";
import { buildAnswerFacts } from "@/lib/data/metrics";
import { answerQuestion } from "@/lib/rules/answers";

export const dynamic = "force-dynamic";

/**
 * POST /api/assistant { question }
 *
 * The deterministic answer is always computed first and is always returned. If a
 * provider key is configured, the model may rephrase it; any provider failure
 * changes nothing but the wording.
 */
export async function POST(request: Request) {
  let question = "";
  try {
    const body = (await request.json()) as { question?: unknown };
    question = typeof body.question === "string" ? body.question.trim() : "";
  } catch {
    return NextResponse.json({ error: "Send a JSON body with a question." }, { status: 400 });
  }
  if (!question) return NextResponse.json({ error: "Question is required." }, { status: 400 });

  const facts = await buildAnswerFacts();
  const deterministic = answerQuestion(question, facts);

  if (!isAssistantConfigured()) {
    return NextResponse.json({
      question,
      intent: deterministic.intent,
      answer: deterministic.answer,
      deterministicAnswer: deterministic.answer,
      source: "deterministic",
      assistantConfigured: false,
      notice: "No provider key configured; answering from stored data only.",
    });
  }

  const rephrased = await rephraseAnswer({
    question,
    deterministicAnswer: deterministic.answer,
    facts: {
      totalRfis: facts.totalRfis,
      openPos: facts.openPos,
      activeQuotations: facts.activeQuotations,
      pendingOemInvoices: facts.pendingOemInvoices,
      overdueInvoices: facts.overdueInvoices,
      documentsExpiring: facts.documentsExpiring,
      won: facts.won,
      lost: facts.lost,
      wonThisMonth: facts.wonThisMonth,
      lossesByReason: facts.lossesByReason,
    },
  });

  return NextResponse.json({
    question,
    intent: deterministic.intent,
    answer: rephrased?.text ?? deterministic.answer,
    deterministicAnswer: deterministic.answer,
    source: rephrased ? "model" : "deterministic",
    assistantConfigured: true,
    model: rephrased?.model ?? null,
    notice: rephrased ? undefined : "Provider unavailable; showing the deterministic answer.",
  });
}
