import { AppShell } from "@/components/app-shell";
import { AssistantClient } from "@/app/assistant/assistant-client";
import { isAssistantConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export default function AssistantPage() {
  const configured = isAssistantConfigured();
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold">Plain-language assistant</h1>
      <p className="mt-1 text-sm text-muted-ink">
        Structured fields only — never tender documents or file contents. Optional, last, off by default.
      </p>
      <AssistantClient configured={configured} />
    </AppShell>
  );
}
