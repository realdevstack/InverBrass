import { readEnv } from "@/lib/env";

/**
 * Provider-agnostic rephrasing for the optional assistant (Step 14).
 *
 * The model is never on a save path and never a dependency: this function takes
 * an answer the deterministic layer already produced, sends only structured
 * fields (counts, statuses, amounts), and returns null on any failure so the
 * caller falls back to the deterministic text. Tender documents are never sent.
 */

export type RephraseInput = {
  question: string;
  deterministicAnswer: string;
  facts: Record<string, unknown>;
};

export type RephraseResult = { text: string; model: string } | null;

const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const TIMEOUT_MS = 20_000;

export function isAssistantConfigured(): boolean {
  return readEnv("AI_ASSISTANT_API_KEY") !== undefined;
}

export async function rephraseAnswer(input: RephraseInput): Promise<RephraseResult> {
  const apiKey = readEnv("AI_ASSISTANT_API_KEY");
  if (!apiKey) return null;

  const baseUrl = (readEnv("AI_ASSISTANT_BASE_URL") ?? DEFAULT_BASE_URL).replace(/\/$/, "");
  const model = readEnv("AI_ASSISTANT_MODEL") ?? "gpt-4o-mini";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "You restate a business answer in one short paragraph. Use only the numbers and facts given; never invent a figure, a name or a document. Do not add advice.",
          },
          {
            role: "user",
            content: JSON.stringify({
              question: input.question,
              answer: input.deterministicAnswer,
              structured_facts: input.facts,
            }),
          },
        ],
      }),
    });

    if (!response.ok) return null;
    const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = payload.choices?.[0]?.message?.content?.trim();
    if (!text) return null;
    return { text, model };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
