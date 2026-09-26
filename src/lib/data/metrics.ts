import type { AnswerFacts } from "@/lib/rules/answers";
import { createClient } from "@/lib/supabase/server";

/** First instant of the current IST month, as a UTC ISO string. */
export function startOfIstMonth(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
  }).format(now);
  return new Date(`${parts}-01T00:00:00+05:30`).toISOString();
}

/**
 * Builds the small, structured fact set the deterministic answer layer reads.
 * Only aggregates and status counts — never tender text. RLS scopes every query
 * to the signed-in user, so a restricted role sees only what it may read.
 */
export async function buildAnswerFacts(): Promise<AnswerFacts> {
  const supabase = await createClient();

  const [metrics, wonMonth, losses, byClient, byOem] = await Promise.all([
    supabase.from("v_dashboard_metrics").select("*").maybeSingle(),
    supabase
      .from("requirements")
      .select("id", { count: "exact", head: true })
      .eq("status", "won")
      .gte("updated_at", startOfIstMonth()),
    supabase.from("quotations").select("loss_reason").eq("status", "lost"),
    supabase.from("v_revenue_by_client").select("*"),
    supabase.from("v_revenue_by_oem").select("*"),
  ]);

  const lossesByReason: Record<string, number> = {};
  for (const row of losses.data ?? []) {
    const reason = row.loss_reason ?? "other";
    lossesByReason[reason] = (lossesByReason[reason] ?? 0) + 1;
  }

  return {
    totalRfis: Number(metrics.data?.total_rfis ?? 0),
    rfisOpen: Number(metrics.data?.rfis_open ?? 0),
    activeQuotations: Number(metrics.data?.active_quotations ?? 0),
    openPos: Number(metrics.data?.open_pos ?? 0),
    pendingOemInvoices: Number(metrics.data?.pending_oem_invoices ?? 0),
    overdueInvoices: Number(metrics.data?.overdue_invoices ?? 0),
    documentsExpiring: Number(metrics.data?.documents_expiring ?? 0),
    won: Number(metrics.data?.won_requirements ?? 0),
    lost: Number(metrics.data?.lost_requirements ?? 0),
    submitted: Number(metrics.data?.submitted_requirements ?? 0),
    wonThisMonth: wonMonth.count ?? 0,
    lossesByReason,
    revenueByClient: (byClient.data ?? []).map((r) => ({ label: r.client ?? "—", value: Number(r.total_value) })),
    revenueByOem: (byOem.data ?? []).map((r) => ({ label: r.oem_name ?? "—", value: Number(r.total_value) })),
  };
}
