import { computeKpis, type Kpis } from "@/lib/rules/kpis";
import { createClient } from "@/lib/supabase/server";

export type ManagementData = {
  metrics: {
    totalRfis: number;
    rfisOpen: number;
    activeQuotations: number;
    openPos: number;
    pendingDeliveries: number;
    pendingOemInvoices: number;
    overdueInvoices: number;
    commissionReceivable: number;
    documentsExpiring: number;
    won: number;
    lost: number;
    submitted: number;
  };
  kpis: Kpis;
  revenueByClient: Array<{ label: string; value: number; poCount: number }>;
  revenueByOem: Array<{ label: string; value: number; poCount: number }>;
  monthly: Array<{ month: string; value: number; poCount: number }>;
  employeePerformance: Array<{ name: string; requirements: number; won: number; closurePct: number | null }>;
  oemPerformance: Array<{ name: string; deliveries: number; onTimePct: number | null }>;
};

/** Builds the management dashboard and KPI data. RLS scopes every query. */
export async function buildManagementData(): Promise<ManagementData> {
  const supabase = await createClient();

  const [metrics, turnaround, adherence, collection, recovery, oemPerf, clientRepeat, employees, byClient, byOem, monthly] =
    await Promise.all([
      supabase.from("v_dashboard_metrics").select("*").maybeSingle(),
      supabase.from("v_quotation_turnaround").select("turnaround_days"),
      supabase.from("v_delivery_adherence").select("on_time"),
      supabase.from("v_payment_collection").select("collection_days"),
      supabase.from("v_commission_recovery").select("recovery_days"),
      supabase.from("v_oem_performance").select("oem_name, deliveries, on_time_deliveries"),
      supabase.from("v_client_repeat").select("po_count"),
      supabase.from("v_employee_performance").select("full_name, requirements, won"),
      supabase.from("v_revenue_by_client").select("*").order("total_value", { ascending: false }),
      supabase.from("v_revenue_by_oem").select("*").order("total_value", { ascending: false }),
      supabase.from("v_monthly_sales").select("*"),
    ]);

  const numbers = (rows: Array<{ [k: string]: unknown }> | null, key: string): number[] =>
    (rows ?? [])
      .map((r) => r[key])
      .filter((v): v is number => typeof v === "number" && Number.isFinite(v));

  const kpis = computeKpis({
    totalRfis: Number(metrics.data?.total_rfis ?? 0),
    won: Number(metrics.data?.won_requirements ?? 0),
    lost: Number(metrics.data?.lost_requirements ?? 0),
    quotationTurnarounds: numbers(turnaround.data as Array<Record<string, unknown>> | null, "turnaround_days"),
    deliveryOnTime: (adherence.data ?? [])
      .map((r) => r.on_time)
      .filter((v): v is boolean => typeof v === "boolean"),
    collectionDays: numbers(collection.data as Array<Record<string, unknown>> | null, "collection_days"),
    commissionRecoveryDays: numbers(recovery.data as Array<Record<string, unknown>> | null, "recovery_days"),
    oemDeliveries: (oemPerf.data ?? []).map((r) => ({ onTime: Number(r.on_time_deliveries), known: Number(r.deliveries) })),
    clientPoCounts: (clientRepeat.data ?? []).map((r) => Number(r.po_count)),
    employees: (employees.data ?? []).map((r) => ({ assigned: Number(r.requirements), won: Number(r.won) })),
  });

  return {
    metrics: {
      totalRfis: Number(metrics.data?.total_rfis ?? 0),
      rfisOpen: Number(metrics.data?.rfis_open ?? 0),
      activeQuotations: Number(metrics.data?.active_quotations ?? 0),
      openPos: Number(metrics.data?.open_pos ?? 0),
      pendingDeliveries: Number(metrics.data?.pending_deliveries ?? 0),
      pendingOemInvoices: Number(metrics.data?.pending_oem_invoices ?? 0),
      overdueInvoices: Number(metrics.data?.overdue_invoices ?? 0),
      commissionReceivable: Number(metrics.data?.commission_receivable ?? 0),
      documentsExpiring: Number(metrics.data?.documents_expiring ?? 0),
      won: Number(metrics.data?.won_requirements ?? 0),
      lost: Number(metrics.data?.lost_requirements ?? 0),
      submitted: Number(metrics.data?.submitted_requirements ?? 0),
    },
    kpis,
    revenueByClient: (byClient.data ?? []).map((r) => ({
      label: r.client ?? "—",
      value: Number(r.total_value),
      poCount: Number(r.po_count),
    })),
    revenueByOem: (byOem.data ?? []).map((r) => ({
      label: r.oem_name ?? "—",
      value: Number(r.total_value),
      poCount: Number(r.po_count),
    })),
    monthly: (monthly.data ?? []).map((r) => ({
      month: r.month ?? "—",
      value: Number(r.total_value),
      poCount: Number(r.po_count),
    })),
    employeePerformance: (employees.data ?? []).map((r) => {
      const assigned = Number(r.requirements);
      const won = Number(r.won);
      return {
        name: r.full_name ?? "—",
        requirements: assigned,
        won,
        closurePct: assigned === 0 ? null : Math.round((won / assigned) * 1000) / 10,
      };
    }),
    oemPerformance: (oemPerf.data ?? []).map((r) => {
      const total = Number(r.deliveries);
      const onTime = Number(r.on_time_deliveries);
      return {
        name: r.oem_name ?? "—",
        deliveries: total,
        onTimePct: total === 0 ? null : Math.round((onTime / total) * 1000) / 10,
      };
    }),
  };
}

export function formatPercent(value: number | null): string {
  return value === null ? "—" : `${value}%`;
}

export function formatDays(value: number | null): string {
  return value === null ? "—" : `${value} day(s)`;
}
