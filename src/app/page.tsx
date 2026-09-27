import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { ContactActions } from "@/components/contact-actions";
import { buildManagementData, formatDays, formatPercent } from "@/lib/data/management";
import { buildReachIndex } from "@/lib/data/reach";
import { assessLdRisk } from "@/lib/rules/ld-risk";
import { formatInr, istDateString } from "@/lib/rules/dates";
import { canRead, type AppRole } from "@/lib/rules/access";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function Kpi({ label, value, tone, href }: { label: string; value: string; tone?: string; href?: string }) {
  const body = (
    <div className="panel p-4">
      <p className="label">{label}</p>
      <p className={`mono mt-1 text-2xl font-semibold ${tone ?? ""}`}>{value}</p>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

function KpiLine({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center justify-between border-b border-hairline py-1">
      <span className="text-muted-ink">{label}</span>
      <span className="mono">{value}</span>
    </li>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const [management, riskRows, expiring, recent, followups, dueRfis, pendingInvoices] = await Promise.all([
    buildManagementData(),
    supabase.from("v_order_risk").select("*"),
    supabase.from("v_document_register").select("*").not("days_to_expiry", "is", null).lte("days_to_expiry", 90).order("days_to_expiry").limit(6),
    supabase.from("v_requirement_coverage").select("*").order("submission_deadline", { ascending: true, nullsFirst: false }).limit(6),
    supabase.from("v_followup_tracker").select("*").gt("overdue_days", 0).order("overdue_days", { ascending: false }).limit(5),
    supabase
      .from("requirements")
      .select("id, rfi_number, project_name, customer_agency, submission_deadline")
      .in("status", ["received", "qualifying", "quoted"])
      .not("submission_deadline", "is", null)
      .order("submission_deadline", { ascending: true })
      .limit(5),
    supabase
      .from("v_invoice_balances")
      .select("*")
      .gt("balance_outstanding", 0)
      .order("due_in_days", { ascending: true, nullsFirst: false })
      .limit(8),
  ]);

  // Who to contact for a follow-up: the party's primary contact, looked up from
  // the master records, bounded to the rows actually shown. Placeholder only —
  // the links open the user's own client.
  const reach = await buildReachIndex({
    customerIds: [...(followups.data ?? []).map((f) => f.customer_id), ...(pendingInvoices.data ?? []).map((i) => i.customer_id)],
    customerNames: [...(followups.data ?? []).map((f) => f.customer), ...(pendingInvoices.data ?? []).map((i) => i.customer)],
    oemIds: [...(pendingInvoices.data ?? []).map((i) => i.oem_id), ...(expiring.data ?? []).map((d) => d.oem_id)],
  });

  const reachForCustomerRow = (customerId: string | null, name: string | null) =>
    reach.forCustomerId(customerId) ?? reach.forCustomer(name);
  const reachForOem = (oemId: string | null | undefined) => reach.forOem(oemId);

  const atRisk = (riskRows.data ?? []).filter(
    (row) =>
      assessLdRisk({
        expectedCompletionDate: row.expected_completion_date,
        committedDeadline: row.committed_deadline,
        pdiBlocked: row.latest_pdi_result === "rejected",
      }).atRisk,
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  let role: AppRole | null = null;
  if (user) {
    const { data: roleRow } = await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
    role = (roleRow?.role as AppRole | undefined) ?? null;
  }
  const link = (area: Parameters<typeof canRead>[1], path: string) => (canRead(role, area) ? path : undefined);

  const m = management.metrics;
  const k = management.kpis;

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold">Management dashboard</h1>
      <p className="mt-1 text-sm text-muted-ink">One requirement, one record, one timeline.</p>

      <section className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Kpi label="Total RFIs" value={String(m.totalRfis)} href={link("requirements", "/requirements")} />
        <Kpi label="Open RFIs" value={String(m.rfisOpen)} tone="text-progress" href={link("requirements", "/requirements")} />
        <Kpi label="Active quotations" value={String(m.activeQuotations)} href={link("quotation", "/quotations")} />
        <Kpi label="Open POs" value={String(m.openPos)} href={link("order", "/orders")} />
        <Kpi label="Pending deliveries" value={String(m.pendingDeliveries)} tone="text-alert" href={link("fulfilment", "/delivery")} />
        <Kpi label="Pending OEM invoices" value={String(m.pendingOemInvoices)} tone="text-alert" href={link("finance", "/finance")} />
        <Kpi label="Overdue invoices" value={String(m.overdueInvoices)} tone={m.overdueInvoices > 0 ? "text-risk" : "text-clear"} href={link("finance", "/finance")} />
        <Kpi label="Commission receivable" value={formatInr(m.commissionReceivable)} tone={m.commissionReceivable > 0 ? "text-alert" : "text-clear"} href={link("finance", "/reports")} />
        <Kpi label="Documents expiring" value={String(m.documentsExpiring)} tone="text-alert" href={link("documents", "/documents?expiring=1")} />
        <Kpi label="Orders at LD risk" value={String(atRisk.length)} tone={atRisk.length > 0 ? "text-risk" : "text-clear"} href={link("fulfilment", "/delivery")} />
        <Kpi label="Won vs Lost" value={`${m.won} / ${m.lost}`} href={link("quotation", "/quotations")} />
        <Kpi label="Submitted" value={String(m.submitted)} tone="text-progress" href={link("quotation", "/quotations")} />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="panel p-4">
          <h2 className="font-medium">Critical KPIs</h2>
          <ul className="mt-2 text-sm">
            <KpiLine label="Tender conversion ratio" value={formatPercent(k.tenderConversionPct)} />
            <KpiLine label="Avg quotation turnaround" value={formatDays(k.avgQuotationTurnaroundDays)} />
            <KpiLine label="Delivery adherence" value={formatPercent(k.deliveryAdherencePct)} />
            <KpiLine label="Payment collection cycle" value={formatDays(k.avgPaymentCollectionDays)} />
            <KpiLine label="Commission recovery time" value={formatDays(k.avgCommissionRecoveryDays)} />
            <KpiLine label="OEM on-time delivery" value={formatPercent(k.oemOnTimePct)} />
            <KpiLine label="Client repeat business" value={formatPercent(k.clientRepeatPct)} />
            <KpiLine label="Employee closure rate" value={formatPercent(k.avgEmployeeClosurePct)} />
          </ul>
        </section>

        <section className="panel p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Reminders</h2>
            <Link href="/reports" className="text-sm hover:underline">Reports</Link>
          </div>
          <h3 className="mt-2 text-xs font-semibold uppercase text-muted-ink">RFIs due soon</h3>
          <ul className="text-sm">
            {dueRfis.data?.map((r) => (
              <li key={r.id} className="flex items-center justify-between border-b border-hairline py-1">
                <Link href={`/requirements/${r.id}`} className="hover:underline">{r.project_name}</Link>
                <span className="text-muted-ink">{r.submission_deadline ? istDateString(r.submission_deadline) : "—"}</span>
              </li>
            ))}
            {dueRfis.data?.length === 0 && <li className="py-1 text-muted-ink">None due.</li>}
          </ul>
          <h3 className="mt-3 text-xs font-semibold uppercase text-muted-ink">Overdue payments</h3>
          <ul className="text-sm">
            {followups.data?.map((f) => {
              const contact = reachForCustomerRow(f.customer_id, f.customer);
              return (
                <li key={f.oem_invoice_id} className="flex items-center justify-between gap-2 border-b border-hairline py-1">
                  <Link href={`/finance/${f.oem_invoice_id}`} className="mono hover:underline">{f.invoice_number}</Link>
                  <span className="flex items-center gap-2">
                    <ContactActions
                      label="Customer"
                      email={contact?.email ?? null}
                      phone={contact?.phone ?? null}
                      subject={`Payment reminder: invoice ${f.invoice_number}`}
                      message={`Following up on the outstanding balance on invoice ${f.invoice_number} (${f.overdue_days} days overdue).`}
                    />
                    <span className="text-risk">{f.overdue_days}d · {f.followup_status}</span>
                  </span>
                </li>
              );
            })}
            {followups.data?.length === 0 && <li className="py-1 text-muted-ink">Nothing overdue.</li>}
          </ul>
          <h3 className="mt-3 text-xs font-semibold uppercase text-muted-ink">Pending OEM invoices</h3>
          <ul className="text-sm">
            {pendingInvoices.data?.map((inv) => {
              const customer = reachForCustomerRow(inv.customer_id, inv.customer);
              const oem = reachForOem(inv.oem_id);
              const overdue = inv.due_in_days !== null && inv.due_in_days < 0;
              return (
                <li key={inv.oem_invoice_id} className="border-b border-hairline py-1">
                  <div className="flex items-center justify-between gap-2">
                    <Link href={`/finance/${inv.oem_invoice_id}`} className="mono hover:underline">{inv.invoice_number}</Link>
                    <span className="mono">{formatInr(Number(inv.balance_outstanding))}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className={`text-xs ${overdue ? "text-risk" : "text-muted-ink"}`}>
                      {inv.due_in_days === null ? "no due date" : overdue ? `${Math.abs(inv.due_in_days)}d overdue` : `due in ${inv.due_in_days}d`}
                    </span>
                    <span className="flex flex-wrap items-center gap-2">
                      <ContactActions
                        label="Customer"
                        email={customer?.email ?? null}
                        phone={customer?.phone ?? null}
                        subject={`Payment follow-up: invoice ${inv.invoice_number}`}
                        message={`Following up on invoice ${inv.invoice_number} for ${formatInr(Number(inv.balance_outstanding))}.`}
                      />
                      <ContactActions
                        label="OEM"
                        email={oem?.email ?? null}
                        phone={oem?.phone ?? null}
                        subject={`Invoice ${inv.invoice_number} status`}
                        message={`Checking the status of invoice ${inv.invoice_number}.`}
                      />
                    </span>
                  </div>
                </li>
              );
            })}
            {pendingInvoices.data?.length === 0 && <li className="py-1 text-muted-ink">No invoice awaiting payment.</li>}
          </ul>
          <h3 className="mt-3 text-xs font-semibold uppercase text-muted-ink">Documents expiring</h3>
          <ul className="text-sm">
            {expiring.data?.slice(0, 4).map((doc) => {
              const oemContact = reachForOem(doc.oem_id);
              return (
                <li key={doc.document_id} className="flex items-center justify-between gap-2 border-b border-hairline py-1">
                  <span className="min-w-0 truncate">{doc.title ?? doc.file_name}</span>
                  <span className="flex items-center gap-2">
                    <ContactActions
                      label="OEM"
                      email={oemContact?.email ?? null}
                      phone={oemContact?.phone ?? null}
                      subject={`Renewal reminder: ${doc.title ?? doc.file_name ?? "document"}`}
                      message={`Please share the renewed ${doc.title ?? "document"} before it expires.`}
                    />
                    <span className={Number(doc.days_to_expiry) < 0 ? "text-risk" : "text-alert"}>
                      {doc.expiry_date ? istDateString(doc.expiry_date) : ""}
                    </span>
                  </span>
                </li>
              );
            })}
            {expiring.data?.length === 0 && <li className="py-1 text-muted-ink">Nothing expiring.</li>}
          </ul>
          <p className="mt-3 text-xs text-muted-ink">
            Email / WhatsApp / Call icons are placeholders — they open your own mail, WhatsApp or phone app with the
            message prefilled. A greyed icon means the party has no contact on file. Nothing is sent automatically.
          </p>
        </section>

        <section className="panel p-4">
          <h2 className="font-medium">Revenue</h2>
          <h3 className="mt-2 text-xs font-semibold uppercase text-muted-ink">By client</h3>
          <ul className="text-sm">
            {management.revenueByClient.slice(0, 4).map((r) => (
              <li key={r.label} className="flex items-center justify-between border-b border-hairline py-1">
                <span>{r.label}</span>
                <span className="mono">{formatInr(r.value)}</span>
              </li>
            ))}
            {management.revenueByClient.length === 0 && <li className="py-1 text-muted-ink">No POs yet.</li>}
          </ul>
          <h3 className="mt-3 text-xs font-semibold uppercase text-muted-ink">By OEM</h3>
          <ul className="text-sm">
            {management.revenueByOem.slice(0, 4).map((r) => (
              <li key={r.label} className="flex items-center justify-between border-b border-hairline py-1">
                <span>{r.label}</span>
                <span className="mono">{formatInr(r.value)}</span>
              </li>
            ))}
            {management.revenueByOem.length === 0 && <li className="py-1 text-muted-ink">No POs yet.</li>}
          </ul>
          <h3 className="mt-3 text-xs font-semibold uppercase text-muted-ink">Monthly sales</h3>
          <ul className="text-sm">
            {management.monthly.slice(-4).map((r) => (
              <li key={r.month} className="flex items-center justify-between border-b border-hairline py-1">
                <span className="mono">{r.month}</span>
                <span className="mono">{formatInr(r.value)}</span>
              </li>
            ))}
            {management.monthly.length === 0 && <li className="py-1 text-muted-ink">No POs yet.</li>}
          </ul>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="panel p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Orders at risk</h2>
            <Link href="/delivery" className="text-sm hover:underline">All orders</Link>
          </div>
          <ul className="mt-2 space-y-1 text-sm">
            {atRisk.slice(0, 5).map((row) => (
              <li key={row.purchase_order_id} className="status-row border-b border-hairline py-1 pl-2" data-status="pending">
                <Link href={`/delivery/${row.purchase_order_id}`} className="mono hover:underline">{row.po_number}</Link>
                <span className="ml-2 text-muted-ink">{row.customer_agency}</span>
                <span className="ml-2 text-alert">{row.days_to_deadline !== null ? `${row.days_to_deadline}d to deadline` : "no deadline"}</span>
              </li>
            ))}
            {atRisk.length === 0 && <li className="text-muted-ink">No order at risk. Good.</li>}
          </ul>
        </section>

        <section className="panel p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Employee-wise performance</h2>
            <Link href="/reports" className="text-sm hover:underline">Reports</Link>
          </div>
          <ul className="mt-2 text-sm">
            {management.employeePerformance.map((e) => (
              <li key={e.name} className="flex items-center justify-between border-b border-hairline py-1">
                <span>{e.name}</span>
                <span className="mono">{e.won}/{e.requirements} won · {formatPercent(e.closurePct)}</span>
              </li>
            ))}
            {management.employeePerformance.length === 0 && <li className="py-1 text-muted-ink">No assignments yet.</li>}
          </ul>
        </section>
      </div>

      <section className="panel mt-6 p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Upcoming RFI deadlines</h2>
          <Link href="/requirements" className="text-sm hover:underline">All RFIs</Link>
        </div>
        <ul className="mt-2 space-y-1 text-sm">
          {recent.data?.map((row) => (
            <li key={row.requirement_id} className="status-row border-b border-hairline py-1 pl-2" data-status={Number(row.uncovered_quantity) > 0 ? "pending" : "clear"}>
              <Link href={`/requirements/${row.requirement_id}`} className="hover:underline">{row.project_name}</Link>
              <span className="ml-2 text-muted-ink">{row.customer_agency}</span>
              <span className="ml-2">{row.submission_deadline ? istDateString(row.submission_deadline) : "no deadline"}</span>
              <span className="mono ml-2">uncovered {Number(row.uncovered_quantity).toLocaleString("en-IN")}</span>
            </li>
          ))}
          {recent.data?.length === 0 && <li className="text-muted-ink">No requirements yet.</li>}
        </ul>
      </section>

      <p className="mt-6 text-sm text-muted-ink">
        Ask plain-language questions on the <Link href="/assistant" className="hover:underline">Assistant</Link> page; every answer is computed from stored data with no model call.
      </p>
    </AppShell>
  );
}
