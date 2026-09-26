"use client";

import { useState } from "react";

import { SAMPLE_QUESTIONS } from "@/lib/rules/answers";

type ApiAnswer = {
  question: string;
  intent: string;
  answer: string;
  deterministicAnswer: string;
  source: "model" | "deterministic";
  assistantConfigured: boolean;
  notice?: string;
};

export function AssistantClient({ configured }: { configured: boolean }) {
  const [question, setQuestion] = useState(SAMPLE_QUESTIONS[0]);
  const [result, setResult] = useState<ApiAnswer | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Could not answer.");
        setResult(null);
      } else {
        setResult(payload as ApiAnswer);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not answer.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-4">
      <p className="text-sm text-muted-ink">
        {configured
          ? "A provider key is configured: the assistant rephrases the deterministic answer. If the provider fails, the deterministic answer is shown."
          : "No provider key is configured (off by default): every question is answered from stored data with no model call."}
      </p>

      <form onSubmit={ask} className="panel mt-3 flex flex-wrap gap-2 p-4">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="input mt-0 min-w-0 flex-1"
          placeholder="Ask about orders, wins, losses, invoices, documents…"
        />
        <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">
          {pending ? "Answering…" : "Ask"}
        </button>
      </form>

      <div className="mt-2 flex flex-wrap gap-2">
        {SAMPLE_QUESTIONS.map((q) => (
          <button key={q} type="button" onClick={() => setQuestion(q)} className="rounded border border-hairline bg-panel px-2 py-1 text-xs hover:border-teal">
            {q}
          </button>
        ))}
      </div>

      {error && <p role="alert" className="mt-4 rounded border border-risk/40 bg-risk/10 p-3 text-sm text-risk">{error}</p>}

      {result && (
        <section className="panel mt-4 p-4">
          <p className="label">Answer · {result.source === "model" ? "rephrased by model" : "deterministic"}</p>
          <p className="mt-1 text-sm">{result.answer}</p>
          <p className="mt-2 text-xs text-muted-ink">intent: {result.intent}</p>
          {result.notice && <p className="mt-1 text-xs text-alert">{result.notice}</p>}
        </section>
      )}
    </div>
  );
}
