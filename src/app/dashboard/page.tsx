import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { buildManagementData, formatPercent } from "@/lib/data/management";
import { assessLdRisk, type RiskAssessment } from "@/lib/rules/ld-risk";
import {
  IST_TIME_ZONE,
  daysUntilDeadline,
  formatInr,
  formatInrCompact,
  istDateString,
} from "@/lib/rules/dates";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type CoverageRow = {
  requirement_id: string;
  project_name: string;
  customer_agency: string;
  submission_deadline: string | null;
  uncovered_quantity: number;
};

type OrderRiskRow = {
  purchase_order_id: string;
  po_number: string;
  customer_agency: string;
  oem_name: string | null;
  po_value: number;
  committed_deadline: string | null;
  expected_completion_date: string | null;
  production_status: string | null;
  latest_pdi_result: string | null;
  days_to_deadline: number | null;
};

type PoTrackRow = { purchase_order_id: string; balance_quantity: number };
type FollowupRow = { oem_invoice_id: string; invoice_number: string; customer: string; balance_outstanding: number; overdue_days: number };
type InvoiceRow = { oem_invoice_id: string; balance_outstanding: number; commission_invoice_id: string | null };
type DocRow = { document_id: string; title: string | null; file_name: string | null; expiry_date: string | null; days_to_expiry: number | null };

const MATERIAL_LABEL: Record<string, string> = {
  not_started: "Waiting for production start",
  in_production: "In production",
  ready: "Ready to dispatch",
  qc_pending: "QC pending",
  qc_passed: "QC passed",
  qc_failed: "QC failed",
};

function whereItStands(row: OrderRiskRow): string {
  if (row.latest_pdi_result === "rejected") return "PDI rejected";
  if (row.latest_pdi_result === "cleared" || row.latest_pdi_result === "partially_cleared") return "PDI cleared";
  if (row.production_status && MATERIAL_LABEL[row.production_status]) return MATERIAL_LABEL[row.production_status];
  return "Waiting for production start";
}

function riskOf(row: OrderRiskRow): RiskAssessment {
  return assessLdRisk({
    expectedCompletionDate: row.expected_completion_date,
    committedDeadline: row.committed_deadline,
    pdiBlocked: row.latest_pdi_result === "rejected",
  });
}

function riskLabel(assessment: RiskAssessment): string {
  if (assessment.level === "late") return "Late";
  if (assessment.level === "at_risk") return "At risk";
  if (assessment.level === "on_track") return "On track";
  return "—";
}

function riskTone(assessment: RiskAssessment): string {
  if (assessment.level === "late") return "text-risk";
  if (assessment.level === "at_risk") return "text-alert";
  if (assessment.level === "on_track") return "text-clear";
  return "text-muted-ink";
}

function greetingFor(now: Date): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: IST_TIME_ZONE, hour: "2-digit", hour12: false }).format(now),
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

type Briefing = { tone: "risk" | "pending" | "progress"; text: string; href: string };
type Card = {
  label: string;
  value: string;
  caption: string;
  href: string;
  status: "progress" | "pending" | "clear" | "risk";
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let firstName = "there";
  if (user) {
    const { data } = await supabase.from("user_roles").select("full_name").eq("user_id", user.id).maybeSingle();
    firstName = data?.full_name?.trim().split(/\s+/)[0] ?? user.email?.split("@")[0] ?? "there";
  }

  const [management, orderRisk, poTrack, coverage, followups, invoices, expiringDocs, approvals, quotes] = await Promise.all([
    buildManagementData(),
    supabase
      .from("v_order_risk")
      .select(
        "purchase_order_id, po_number, customer_agency, oem_name, po_value, committed_deadline, expected_completion_date, production_status, latest_pdi_result, days_to_deadline",
      ),
    supabase.from("v_po_tracking").select("purchase_order_id, balance_quantity"),
    supabase
      .from("v_requirement_coverage")
      .select("requirement_id, project_name, customer_agency, submission_deadline, uncovered_quantity"),
    supabase
      .from("v_followup_tracker")
      .select("oem_invoice_id, invoice_number, customer, balance_outstanding, overdue_days")
      .gt("overdue_days", 0)
      .order("overdue_days", { ascending: false }),
    supabase.from("v_invoice_balances").select("oem_invoice_id, balance_outstanding, commission_invoice_id"),
    supabase
      .from("v_document_register")
      .select("document_id, title, file_name, expiry_date, days_to_expiry")
      .not("days_to_expiry", "is", null)
      .lte("days_to_expiry", 90)
      .order("days_to_expiry", { ascending: true }),
    supabase.from("approvals").select("id", { count: "exact", head: true }).eq("decision", "pending"),
    supabase.from("quotations").select("requirement_id, status").in("status", ["approved", "submitted", "won"]),
  ]);

  const m = management.metrics;
  const k = management.kpis;

  const orderRows = (orderRisk.data ?? []) as OrderRiskRow[];
  const balanceByPo = new Map((poTrack.data ?? []).map((r) => [r.purchase_order_id, Number(r.balance_quantity)]));

  const assessed = orderRows.map((row) => ({ row, assessment: riskOf(row) }));
  const atRisk = assessed.filter(({ assessment }) => assessment.atRisk);
  const valueAtRisk = atRisk.reduce((sum, { row }) => sum + Number(row.po_value ?? 0), 0);
  const lateCount = assessed.filter(({ assessment }) => assessment.level === "late").length;

  const overdue = (followups.data ?? []) as FollowupRow[];
  const overdueSum = overdue.reduce((sum, f) => sum + Number(f.balance_outstanding), 0);
  const oldestOverdue = overdue.reduce((max, f) => Math.max(max, Number(f.overdue_days)), 0);

  const outstandingSum = (invoices.data ?? []).reduce((sum, i) => sum + Number(i.balance_outstanding), 0);
  const committableInvoices = (invoices.data ?? []).filter(
    (i) => Number(i.balance_outstanding) === 0 && !i.commission_invoice_id,
  );
  const pendingApprovals = approvals.count ?? 0;
  const docs = (expiringDocs.data ?? []) as DocRow[];
  const expiredDocs = docs.filter((d) => Number(d.days_to_expiry) < 0).length;

  const coverageRows = (coverage.data ?? []) as CoverageRow[];
  const bidsDue = coverageRows
    .filter((r) => r.submission_deadline !== null)
    .map((r) => ({ row: r, days: daysUntilDeadline(r.submission_deadline as string) }))
    .filter(({ days }) => days >= 0 && days <= 14)
    .sort((a, b) => a.days - b.days);
  const bidsDueSoon = bidsDue.filter(({ days }) => days <= 3);
  const approvedRequirementIds = new Set((quotes.data ?? []).map((q) => q.requirement_id));
  const bidsWithoutQuote = bidsDueSoon.filter(({ row }) => !approvedRequirementIds.has(row.requirement_id)).length;

  const briefing: Briefing[] = [];
  if (bidsDueSoon.length > 0) {
    briefing.push({
      tone: bidsWithoutQuote > 0 ? "risk" : "pending",
      text: `${bidsDueSoon.length} bid(s) due within 3 days${bidsWithoutQuote > 0 ? `: ${bidsWithoutQuote} still has no approved quote` : ""}.`,
      href: "/requirements",
    });
  }
  if (atRisk.length > 0) {
    briefing.push({
      tone: "risk",
      text: `${atRisk.length} order(s) may miss the committed deadline (${lateCount} already late, ${formatInrCompact(valueAtRisk)} at risk).`,
      href: "/orders",
    });
  }
  if (overdue.length > 0) {
    briefing.push({
      tone: "risk",
      text: `${formatInrCompact(overdueSum)} is overdue on ${overdue.length} invoice(s); the oldest is ${oldestOverdue} days late.`,
      href: "/finance",
    });
  }
  if (committableInvoices.length > 0) {
    briefing.push({
      tone: "pending",
      text: `Commission can be raised on ${committableInvoices.length} fully paid invoice(s).`,
      href: "/finance",
    });
  }
  if (pendingApprovals > 0) {
    briefing.push({
      tone: "pending",
      text: `${pendingApprovals} approval(s) are waiting — quotes, OEMs or documents.`,
      href: "/quotations",
    });
  }
  if (docs.length > 0) {
    briefing.push({
      tone: "pending",
      text: `${docs.length} document/certification(s) expire within 90 days${expiredDocs > 0 ? `, ${expiredDocs} already expired` : ""}.`,
      href: "/documents?expiring=1",
    });
  }

  const cards: Card[] = [
    {
      label: "Total RFIs",
      value: String(m.totalRfis),
      caption: `${m.rfisOpen} open`,
      href: "/requirements",
      status: "progress",
    },
    {
      label: "Active quotations",
      value: String(m.activeQuotations),
      caption: `${m.submitted} submitted`,
      href: "/quotations",
      status: "progress",
    },
    {
      label: "Won vs lost opportunities",
      value: `${m.won} / ${m.lost}`,
      caption: "won / lost",
      href: "/quotations",
      status: m.won >= m.lost ? "clear" : "pending",
    },
    {
      label: "Open POs",
      value: String(m.openPos),
      caption: `${m.pendingOemInvoices} awaiting invoice payment`,
      href: "/orders",
      status: "progress",
    },
    {
      label: "Pending deliveries",
      value: String(m.pendingDeliveries),
      caption: "not yet closed",
      href: "/delivery",
      status: "pending",
    },
    {
      label: "Pending payments",
      value: formatInrCompact(outstandingSum),
      caption: `${m.pendingOemInvoices} invoice(s) outstanding`,
      href: "/finance",
      status: "pending",
    },
    {
      label: "Overdue payments",
      value: formatInrCompact(overdueSum),
      caption: `${overdue.length} invoice(s)${overdue.length > 0 ? ` · oldest ${oldestOverdue}d` : ""}`,
      href: "/finance",
      status: overdue.length > 0 ? "risk" : "clear",
    },
    {
      label: "Commission receivable",
      value: formatInrCompact(m.commissionReceivable),
      caption: "raised, not yet received",
      href: "/finance",
      status: m.commissionReceivable > 0 ? "pending" : "clear",
    },
    {
      label: "Tender conversion ratio",
      value: formatPercent(k.tenderConversionPct),
      caption: "wins as a share of decided bids",
      href: "/reports",
      status: "progress",
    },
  ];

  const ordersPanel = [...assessed]
    .sort((a, b) => (a.assessment.daysToDeadline ?? 9999) - (b.assessment.daysToDeadline ?? 9999))
    .slice(0, 7);

  const monthlyMax = Math.max(...management.monthly.map((row) => Number(row.value)), 1);

  const now = new Date();
  const dateLabel = new Intl.DateTimeFormat("en-GB", {
    timeZone: IST_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold">Management Dashboard</h1>
      <p className="mt-1 text-sm text-muted-ink">
        {greetingFor(now)}, {firstName} · {dateLabel} · one requirement, one record, one timeline.
      </p>

      <section className="mt-4 grid gap-3 grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="panel status-row block p-3" data-status={card.status}>
            <p className="label">{card.label}</p>
            <p className="mono mt-1 text-2xl font-semibold">{card.value}</p>
            <p className="mt-1 text-xs text-muted-ink">{card.caption}</p>
          </Link>
        ))}
      </section>

      <section className="panel mt-4 p-4">
        <h2 className="font-medium">Today&apos;s briefing</h2>
        <ul className="mt-1 text-sm">
          {briefing.length === 0 ? (
            <li className="py-2 text-muted-ink">Nothing needs attention right now.</li>
          ) : (
            briefing.map((line) => (
              <li key={line.text} className="flex items-center justify-between gap-3 border-b border-hairline py-2 last:border-0">
                <span className="flex items-start gap-2">
                  <span className={`dot dot-${line.tone} mt-1.5`} aria-hidden="true" />
                  <span>{line.text}</span>
                </span>
                <Link href={line.href} className="shrink-0 text-muted-ink hover:underline" aria-label="Open">
                  &rarr;
                </Link>
              </li>
            ))
          )}
        </ul>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="panel p-4">
          <h2 className="font-medium">Revenue by client</h2>
          <ul className="mt-2 text-sm">
            {management.revenueByClient.slice(0, 5).map((row) => (
              <li key={row.label} className="flex items-center justify-between border-b border-hairline py-1 last:border-0">
                <span>{row.label}</span>
                <span className="mono">{formatInrCompact(row.value)}</span>
              </li>
            ))}
            {management.revenueByClient.length === 0 && <li className="py-2 text-muted-ink">No POs yet.</li>}
          </ul>
        </section>

        <section className="panel p-4">
          <h2 className="font-medium">Revenue by OEM</h2>
          <ul className="mt-2 text-sm">
            {management.revenueByOem.slice(0, 5).map((row) => (
              <li key={row.label} className="flex items-center justify-between border-b border-hairline py-1 last:border-0">
                <span>{row.label}</span>
                <span className="mono">{formatInrCompact(row.value)}</span>
              </li>
            ))}
            {management.revenueByOem.length === 0 && <li className="py-2 text-muted-ink">No POs yet.</li>}
          </ul>
        </section>

        <section className="panel p-4">
          <h2 className="font-medium">Monthly sales trend</h2>
          <ul className="mt-3 space-y-2">
            {management.monthly.slice(-6).map((row) => (
              <li key={row.month} className="flex items-center gap-2 text-sm">
                <span className="mono w-16 shrink-0 text-xs text-muted-ink">{row.month}</span>
                <span className="h-2 flex-1 overflow-hidden rounded bg-content">
                  <span
                    className="block h-full rounded bg-progress"
                    style={{ width: `${Math.max(Math.round((Number(row.value) / monthlyMax) * 100), 2)}%` }}
                  />
                </span>
                <span className="mono w-20 shrink-0 text-right text-xs">{formatInrCompact(row.value)}</span>
              </li>
            ))}
            {management.monthly.length === 0 && <li className="py-2 text-sm text-muted-ink">No sales yet.</li>}
          </ul>
        </section>

        <section className="panel p-4">
          <h2 className="font-medium">Employee-wise performance</h2>
          <ul className="mt-2 text-sm">
            {management.employeePerformance.slice(0, 6).map((row) => (
              <li key={row.name} className="flex items-center justify-between border-b border-hairline py-1 last:border-0">
                <span>{row.name}</span>
                <span className="mono text-xs">
                  {row.won}/{row.requirements} won · {formatPercent(row.closurePct)}
                </span>
              </li>
            ))}
            {management.employeePerformance.length === 0 && <li className="py-2 text-muted-ink">No assignments yet.</li>}
          </ul>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="panel overflow-x-auto p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Orders in fulfilment</h2>
            <Link href="/orders" className="text-sm hover:underline">All orders</Link>
          </div>
          <table className="mt-2 w-full text-left text-sm">
            <thead>
              <tr className="border-b border-hairline text-muted-ink">
                <th className="py-2 pr-2">Order</th>
                <th className="px-2 py-2">Where it stands</th>
                <th className="px-2 py-2">PO deadline</th>
                <th className="px-2 py-2">Forecast</th>
                <th className="px-2 py-2">Risk</th>
                <th className="px-2 py-2 text-right">Value</th>
                <th className="px-2 py-2 text-right">Not yet delivered</th>
              </tr>
            </thead>
            <tbody>
              {ordersPanel.map(({ row, assessment }) => (
                <tr key={row.purchase_order_id} className="border-b border-hairline last:border-0">
                  <td className="py-2 pr-2">
                    <Link href={`/orders/${row.purchase_order_id}`} className="mono hover:underline">{row.po_number}</Link>
                    <p className="text-xs text-muted-ink">{row.customer_agency} · {row.oem_name ?? "—"}</p>
                  </td>
                  <td className="px-2 py-2">{whereItStands(row)}</td>
                  <td className="px-2 py-2">{row.committed_deadline ? istDateString(row.committed_deadline) : "—"}</td>
                  <td className="px-2 py-2">{row.expected_completion_date ? istDateString(row.expected_completion_date) : "—"}</td>
                  <td className={`px-2 py-2 ${riskTone(assessment)}`}>{riskLabel(assessment)}</td>
                  <td className="mono px-2 py-2 text-right">{formatInrCompact(Number(row.po_value))}</td>
                  <td className="mono px-2 py-2 text-right">{Number(balanceByPo.get(row.purchase_order_id) ?? 0).toLocaleString("en-IN")}</td>
                </tr>
              ))}
              {ordersPanel.length === 0 && (
                <tr><td colSpan={7} className="px-2 py-6 text-center text-muted-ink">No purchase orders yet.</td></tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="panel p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Bids due in the next 14 days</h2>
            <Link href="/requirements" className="text-sm hover:underline">All RFIs</Link>
          </div>
          <ul className="mt-2 text-sm">
            {bidsDue.slice(0, 6).map(({ row, days }) => (
              <li key={row.requirement_id} className="border-b border-hairline py-2 last:border-0">
                <div className="flex items-center justify-between gap-2">
                  <Link href={`/requirements/${row.requirement_id}`} className="hover:underline">{row.project_name}</Link>
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-xs ${days <= 3 ? "bg-risk/15 text-risk" : "bg-content text-muted-ink"}`}>
                    {days === 0 ? "today" : `in ${days}d`}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-ink">
                  {row.customer_agency} · uncovered {Number(row.uncovered_quantity).toLocaleString("en-IN")} · due{" "}
                  {row.submission_deadline ? istDateString(row.submission_deadline) : "—"}
                </p>
              </li>
            ))}
            {bidsDue.length === 0 && <li className="py-3 text-muted-ink">No bids due in the next 14 days.</li>}
          </ul>
        </section>
      </div>

      <p className="mt-4 text-sm text-muted-ink">
        Every figure is computed from stored records with no model call. Detailed reports are on{" "}
        <Link href="/reports" className="hover:underline">Reports</Link>; the stage chain is on{" "}
        <Link href="/process" className="hover:underline">Process flow</Link>.
      </p>
    </AppShell>
  );
}
