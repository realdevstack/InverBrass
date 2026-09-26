import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { formatInr, istDateString } from "@/lib/rules/dates";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function ageBucket(dueInDays: number | null): string {
  if (dueInDays === null) return "No due date";
  if (dueInDays >= 0) return "Not yet due";
  const overdue = Math.abs(dueInDays);
  if (overdue <= 30) return "1-30 days overdue";
  if (overdue <= 60) return "31-60 days overdue";
  if (overdue <= 90) return "61-90 days overdue";
  return "90+ days overdue";
}

function ExportLink({ report }: { report: string }) {
  return (
    <a href={`/api/export?report=${report}`} className="text-xs hover:underline">
      CSV
    </a>
  );
}

function Panel({ title, report, children }: { title: string; report?: string; children: React.ReactNode }) {
  return (
    <section className="panel p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{title}</h3>
        {report && <ExportLink report={report} />}
      </div>
      <div className="mt-2 overflow-x-auto text-sm">{children}</div>
    </section>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="border-b border-hairline pb-1 text-lg font-bold">{title}</h2>
      <div className="mt-3 grid gap-6 lg:grid-cols-2">{children}</div>
    </section>
  );
}

export default async function ReportsPage() {
  const supabase = await createClient();
  const [
    byClient,
    byOem,
    monthly,
    yearly,
    productSales,
    invoices,
    pendingQuotations,
    poTracking,
    deliveryStatus,
    pdiStatus,
    followups,
    commission,
    margin,
    tax,
    profitability,
    oemPerf,
    employees,
    docs,
  ] = await Promise.all([
    supabase.from("v_revenue_by_client").select("*").order("total_value", { ascending: false }),
    supabase.from("v_revenue_by_oem").select("*").order("total_value", { ascending: false }),
    supabase.from("v_monthly_sales").select("*"),
    supabase.from("v_yearly_sales").select("*"),
    supabase.from("v_product_sales").select("*").order("total_value", { ascending: false }),
    supabase.from("v_invoice_balances").select("*"),
    supabase.from("v_pending_quotations").select("*").order("age_days", { ascending: false }),
    supabase.from("v_po_tracking").select("*").order("po_number"),
    supabase.from("v_delivery_status").select("*"),
    supabase.from("v_pdi_status").select("*").order("po_number"),
    supabase.from("v_followup_tracker").select("*").order("overdue_days", { ascending: false }),
    supabase.from("v_commission_receivable").select("*"),
    supabase.from("v_margin_report").select("*").order("margin_percentage", { ascending: true }),
    supabase.from("v_tax_summary").select("*"),
    supabase.from("v_profitability").select("*").order("revenue", { ascending: false }),
    supabase.from("v_oem_performance").select("*").order("oem_name"),
    supabase.from("v_employee_performance").select("*"),
    supabase.from("v_document_register").select("*").not("days_to_expiry", "is", null).order("days_to_expiry"),
  ]);

  const outstanding = (invoices.data ?? []).filter((i) => Number(i.balance_outstanding) > 0);
  const aging = new Map<string, { count: number; value: number }>();
  for (const inv of outstanding) {
    const bucket = ageBucket(inv.due_in_days);
    const current = aging.get(bucket) ?? { count: 0, value: 0 };
    aging.set(bucket, { count: current.count + 1, value: current.value + Number(inv.balance_outstanding) });
  }

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold">Reports</h1>
      <p className="mt-1 text-sm text-muted-ink">
        Grouped as Sales, Operational and Financial reports, scoped by your role. CSV export is Excel-compatible.
      </p>

      <Group title="Sales Reports">
        <Panel title="Client-wise sales" report="revenue-by-client">
          <table className="w-full text-left">
            <thead><tr className="border-b border-hairline text-muted-ink"><th className="py-1">Client</th><th className="py-1 text-right">POs</th><th className="py-1 text-right">Value</th></tr></thead>
            <tbody>
              {byClient.data?.map((r) => (
                <tr key={r.client} className="border-b border-hairline"><td className="py-1">{r.client}</td><td className="py-1 text-right">{r.po_count}</td><td className="mono py-1 text-right">{formatInr(Number(r.total_value))}</td></tr>
              ))}
              {byClient.data?.length === 0 && <tr><td colSpan={3} className="py-3 text-center text-muted-ink">No POs yet.</td></tr>}
            </tbody>
          </table>
        </Panel>

        <Panel title="OEM-wise sales" report="revenue-by-oem">
          <table className="w-full text-left">
            <thead><tr className="border-b border-hairline text-muted-ink"><th className="py-1">OEM</th><th className="py-1 text-right">POs</th><th className="py-1 text-right">Value</th></tr></thead>
            <tbody>
              {byOem.data?.map((r) => (
                <tr key={r.oem_name} className="border-b border-hairline"><td className="py-1">{r.oem_name}</td><td className="py-1 text-right">{r.po_count}</td><td className="mono py-1 text-right">{formatInr(Number(r.total_value))}</td></tr>
              ))}
              {byOem.data?.length === 0 && <tr><td colSpan={3} className="py-3 text-center text-muted-ink">No POs yet.</td></tr>}
            </tbody>
          </table>
        </Panel>

        <Panel title="Product-wise sales" report="product-sales">
          <table className="w-full text-left">
            <thead><tr className="border-b border-hairline text-muted-ink"><th className="py-1">Part</th><th className="py-1">OEM</th><th className="py-1 text-right">POs</th><th className="py-1 text-right">Value</th></tr></thead>
            <tbody>
              {productSales.data?.map((r) => (
                <tr key={`${r.part_number}-${r.oem_name}`} className="border-b border-hairline"><td className="mono py-1 text-xs">{r.part_number}</td><td className="py-1">{r.oem_name ?? "—"}</td><td className="py-1 text-right">{r.po_count}</td><td className="mono py-1 text-right">{formatInr(Number(r.total_value))}</td></tr>
              ))}
              {productSales.data?.length === 0 && <tr><td colSpan={4} className="py-3 text-center text-muted-ink">No POs yet.</td></tr>}
            </tbody>
          </table>
        </Panel>

        <Panel title="Monthly revenue" report="monthly-sales">
          <table className="w-full text-left">
            <thead><tr className="border-b border-hairline text-muted-ink"><th className="py-1">Month</th><th className="py-1 text-right">POs</th><th className="py-1 text-right">Value</th></tr></thead>
            <tbody>
              {monthly.data?.map((r) => (
                <tr key={r.month} className="border-b border-hairline"><td className="mono py-1">{r.month}</td><td className="py-1 text-right">{r.po_count}</td><td className="mono py-1 text-right">{formatInr(Number(r.total_value))}</td></tr>
              ))}
              {monthly.data?.length === 0 && <tr><td colSpan={3} className="py-3 text-center text-muted-ink">No POs yet.</td></tr>}
            </tbody>
          </table>
        </Panel>

        <Panel title="Yearly revenue">
          <table className="w-full text-left">
            <thead><tr className="border-b border-hairline text-muted-ink"><th className="py-1">Year</th><th className="py-1 text-right">POs</th><th className="py-1 text-right">Value</th></tr></thead>
            <tbody>
              {yearly.data?.map((r) => (
                <tr key={r.year} className="border-b border-hairline"><td className="mono py-1">{r.year}</td><td className="py-1 text-right">{r.po_count}</td><td className="mono py-1 text-right">{formatInr(Number(r.total_value))}</td></tr>
              ))}
              {yearly.data?.length === 0 && <tr><td colSpan={3} className="py-3 text-center text-muted-ink">No POs yet.</td></tr>}
            </tbody>
          </table>
        </Panel>
      </Group>

      <Group title="Operational Reports">
        <Panel title="Pending quotations" report="pending-quotations">
          <table className="w-full text-left">
            <thead><tr className="border-b border-hairline text-muted-ink"><th className="py-1">Quotation</th><th className="py-1">Project</th><th className="py-1">Status</th><th className="py-1 text-right">Age (d)</th></tr></thead>
            <tbody>
              {pendingQuotations.data?.map((r) => (
                <tr key={r.quotation_id} className="border-b border-hairline">
                  <td className="mono py-1 text-xs"><Link href={`/quotations/${r.quotation_id}`} className="hover:underline">{r.quotation_number ?? "—"}</Link></td>
                  <td className="py-1">{r.project_name}</td>
                  <td className="py-1">{(r.status ?? "").replace(/_/g, " ")}</td>
                  <td className="mono py-1 text-right">{r.age_days}</td>
                </tr>
              ))}
              {pendingQuotations.data?.length === 0 && <tr><td colSpan={4} className="py-3 text-center text-muted-ink">None pending.</td></tr>}
            </tbody>
          </table>
        </Panel>

        <Panel title="PO tracking report" report="po-tracking">
          <table className="w-full text-left">
            <thead><tr className="border-b border-hairline text-muted-ink"><th className="py-1">PO</th><th className="py-1">Status</th><th className="py-1 text-right">Ordered</th><th className="py-1 text-right">Invoiced</th><th className="py-1 text-right">Delivered</th><th className="py-1 text-right">Balance</th></tr></thead>
            <tbody>
              {poTracking.data?.map((r) => (
                <tr key={r.purchase_order_id} className="border-b border-hairline">
                  <td className="mono py-1 text-xs"><Link href={`/orders/${r.purchase_order_id}`} className="hover:underline">{r.po_number}</Link></td>
                  <td className="py-1">{r.status}</td>
                  <td className="mono py-1 text-right">{Number(r.quantity_ordered).toLocaleString("en-IN")}</td>
                  <td className="mono py-1 text-right">{Number(r.invoiced_quantity).toLocaleString("en-IN")}</td>
                  <td className="mono py-1 text-right">{Number(r.delivered_quantity).toLocaleString("en-IN")}</td>
                  <td className="mono py-1 text-right">{Number(r.balance_quantity).toLocaleString("en-IN")}</td>
                </tr>
              ))}
              {poTracking.data?.length === 0 && <tr><td colSpan={6} className="py-3 text-center text-muted-ink">No POs yet.</td></tr>}
            </tbody>
          </table>
        </Panel>

        <Panel title="Delivery status report" report="delivery-status">
          <table className="w-full text-left">
            <thead><tr className="border-b border-hairline text-muted-ink"><th className="py-1">Reference</th><th className="py-1">Delivery</th><th className="py-1">Acceptance</th><th className="py-1">Closure</th><th className="py-1 text-right">Qty</th><th className="py-1 text-right">Pending</th></tr></thead>
            <tbody>
              {deliveryStatus.data?.map((r) => (
                <tr key={r.delivery_id} className="border-b border-hairline">
                  <td className="mono py-1 text-xs">{r.delivery_reference ?? r.invoice_number}</td>
                  <td className="py-1">{(r.delivery_status ?? "").replace(/_/g, " ")}</td>
                  <td className="py-1">{(r.material_acceptance_status ?? "").replace(/_/g, " ")}</td>
                  <td className="py-1">{r.closure_status}</td>
                  <td className="mono py-1 text-right">{Number(r.quantity_delivered).toLocaleString("en-IN")}</td>
                  <td className="mono py-1 text-right">{Number(r.pending_balance).toLocaleString("en-IN")}</td>
                </tr>
              ))}
              {deliveryStatus.data?.length === 0 && <tr><td colSpan={6} className="py-3 text-center text-muted-ink">No deliveries yet.</td></tr>}
            </tbody>
          </table>
        </Panel>

        <Panel title="PDI status report">
          <table className="w-full text-left">
            <thead><tr className="border-b border-hairline text-muted-ink"><th className="py-1">PDI</th><th className="py-1">PO</th><th className="py-1">Part</th><th className="py-1 text-right">Offered</th><th className="py-1 text-right">Cleared</th><th className="py-1 text-right">Rejected</th><th className="py-1">Result</th></tr></thead>
            <tbody>
              {pdiStatus.data?.map((r) => (
                <tr key={r.pdi_id} className="border-b border-hairline">
                  <td className="mono py-1 text-xs">{r.pdi_number ?? "—"}</td>
                  <td className="mono py-1 text-xs">{r.po_number}</td>
                  <td className="mono py-1 text-xs">{r.part_number ?? "—"}</td>
                  <td className="mono py-1 text-right">{Number(r.quantity_offered).toLocaleString("en-IN")}</td>
                  <td className="mono py-1 text-right text-clear">{Number(r.quantity_cleared).toLocaleString("en-IN")}</td>
                  <td className="mono py-1 text-right text-risk">{Number(r.quantity_rejected).toLocaleString("en-IN")}</td>
                  <td className="py-1">{(r.result ?? "").replace(/_/g, " ")}</td>
                </tr>
              ))}
              {pdiStatus.data?.length === 0 && <tr><td colSpan={7} className="py-3 text-center text-muted-ink">No PDI records yet.</td></tr>}
            </tbody>
          </table>
        </Panel>

        <Panel title="Invoice aging report" report="invoice-aging">
          <table className="w-full text-left">
            <thead><tr className="border-b border-hairline text-muted-ink"><th className="py-1">Bucket</th><th className="py-1 text-right">Invoices</th><th className="py-1 text-right">Outstanding</th></tr></thead>
            <tbody>
              {[...aging.entries()].map(([bucket, v]) => (
                <tr key={bucket} className="border-b border-hairline"><td className="py-1">{bucket}</td><td className="py-1 text-right">{v.count}</td><td className="mono py-1 text-right">{formatInr(v.value)}</td></tr>
              ))}
              {aging.size === 0 && <tr><td colSpan={3} className="py-3 text-center text-muted-ink">Nothing outstanding.</td></tr>}
            </tbody>
          </table>
        </Panel>

        <Panel title="Outstanding payments" report="outstanding-payments">
          <table className="w-full text-left">
            <thead><tr className="border-b border-hairline text-muted-ink"><th className="py-1">Invoice</th><th className="py-1">Customer</th><th className="py-1 text-right">Balance</th><th className="py-1 text-right">Overdue</th><th className="py-1">Follow-up</th></tr></thead>
            <tbody>
              {followups.data?.map((r) => (
                <tr key={r.oem_invoice_id} className="border-b border-hairline">
                  <td className="mono py-1 text-xs"><Link href={`/finance/${r.oem_invoice_id}`} className="hover:underline">{r.invoice_number}</Link></td>
                  <td className="py-1">{r.customer}</td>
                  <td className="mono py-1 text-right">{formatInr(Number(r.balance_outstanding))}</td>
                  <td className="mono py-1 text-right">{r.overdue_days ?? 0}</td>
                  <td className="py-1">{r.followup_status}</td>
                </tr>
              ))}
              {followups.data?.length === 0 && <tr><td colSpan={5} className="py-3 text-center text-muted-ink">Nothing outstanding.</td></tr>}
            </tbody>
          </table>
        </Panel>

        <Panel title="Follow-up tracker" report="outstanding-payments">
          <table className="w-full text-left">
            <thead><tr className="border-b border-hairline text-muted-ink"><th className="py-1">Invoice</th><th className="py-1">Due</th><th className="py-1 text-right">Overdue</th><th className="py-1">Status</th></tr></thead>
            <tbody>
              {followups.data?.map((r) => (
                <tr key={`fu-${r.oem_invoice_id}`} className="border-b border-hairline">
                  <td className="mono py-1 text-xs">{r.invoice_number}</td>
                  <td className="py-1">{r.payment_due_date ? istDateString(r.payment_due_date) : "—"}</td>
                  <td className={`mono py-1 text-right ${Number(r.overdue_days) > 0 ? "text-risk" : ""}`}>{r.overdue_days ?? 0}</td>
                  <td className="py-1">{r.followup_status}</td>
                </tr>
              ))}
              {followups.data?.length === 0 && <tr><td colSpan={4} className="py-3 text-center text-muted-ink">Nothing to follow up.</td></tr>}
            </tbody>
          </table>
        </Panel>
      </Group>

      <Group title="Financial Reports">
        <Panel title="Commission receivable" report="commission-receivable">
          <table className="w-full text-left">
            <thead><tr className="border-b border-hairline text-muted-ink"><th className="py-1">Commission</th><th className="py-1">Customer</th><th className="py-1 text-right">Commission</th><th className="py-1 text-right">Outstanding</th><th className="py-1">Status</th></tr></thead>
            <tbody>
              {commission.data?.map((r) => (
                <tr key={r.commission_invoice_id} className="border-b border-hairline">
                  <td className="mono py-1 text-xs">{r.commission_invoice_number}</td>
                  <td className="py-1">{r.customer_name ?? "—"}</td>
                  <td className="mono py-1 text-right">{formatInr(Number(r.commission_amount))}</td>
                  <td className="mono py-1 text-right">{formatInr(Number(r.outstanding_amount))}</td>
                  <td className="py-1">{r.payment_status}</td>
                </tr>
              ))}
              {commission.data?.length === 0 && <tr><td colSpan={5} className="py-3 text-center text-muted-ink">Nothing receivable.</td></tr>}
            </tbody>
          </table>
        </Panel>

        <Panel title="Margin report" report="margin-report">
          <table className="w-full text-left">
            <thead><tr className="border-b border-hairline text-muted-ink"><th className="py-1">Quotation</th><th className="py-1">Project</th><th className="py-1 text-right">Final</th><th className="py-1 text-right">Margin %</th></tr></thead>
            <tbody>
              {margin.data?.map((r) => (
                <tr key={r.quotation_id} className="border-b border-hairline">
                  <td className="mono py-1 text-xs"><Link href={`/quotations/${r.quotation_id}`} className="hover:underline">{r.quotation_number ?? "—"}</Link></td>
                  <td className="py-1">{r.project_name}</td>
                  <td className="mono py-1 text-right">{r.final_price === null ? "—" : formatInr(Number(r.final_price))}</td>
                  <td className={`mono py-1 text-right ${Number(r.margin_percentage) < 0 ? "text-risk" : "text-clear"}`}>{r.margin_percentage ?? "—"}</td>
                </tr>
              ))}
              {margin.data?.length === 0 && <tr><td colSpan={4} className="py-3 text-center text-muted-ink">No priced quotations.</td></tr>}
            </tbody>
          </table>
        </Panel>

        <Panel title="GST summary" report="tax-summary">
          <table className="w-full text-left">
            <thead><tr className="border-b border-hairline text-muted-ink"><th className="py-1">Month</th><th className="py-1 text-right">GST on invoices</th><th className="py-1 text-right">GST on commission</th></tr></thead>
            <tbody>
              {tax.data?.map((r) => (
                <tr key={`gst-${r.month}`} className="border-b border-hairline">
                  <td className="mono py-1">{r.month}</td>
                  <td className="mono py-1 text-right">{formatInr(Number(r.gst_on_invoices))}</td>
                  <td className="mono py-1 text-right">{formatInr(Number(r.gst_on_commission))}</td>
                </tr>
              ))}
              {tax.data?.length === 0 && <tr><td colSpan={3} className="py-3 text-center text-muted-ink">No GST records.</td></tr>}
            </tbody>
          </table>
        </Panel>

        <Panel title="TDS summary" report="tax-summary">
          <table className="w-full text-left">
            <thead><tr className="border-b border-hairline text-muted-ink"><th className="py-1">Month</th><th className="py-1 text-right">TDS deducted</th></tr></thead>
            <tbody>
              {tax.data?.map((r) => (
                <tr key={`tds-${r.month}`} className="border-b border-hairline">
                  <td className="mono py-1">{r.month}</td>
                  <td className="mono py-1 text-right">{formatInr(Number(r.tds_deducted))}</td>
                </tr>
              ))}
              {tax.data?.length === 0 && <tr><td colSpan={2} className="py-3 text-center text-muted-ink">No TDS records.</td></tr>}
            </tbody>
          </table>
        </Panel>

        <Panel title="Profitability report" report="profitability">
          <table className="w-full text-left">
            <thead><tr className="border-b border-hairline text-muted-ink"><th className="py-1">Project</th><th className="py-1">Agency</th><th className="py-1 text-right">Revenue</th><th className="py-1 text-right">Commission earned</th></tr></thead>
            <tbody>
              {profitability.data?.map((r) => (
                <tr key={r.requirement_id} className="border-b border-hairline">
                  <td className="py-1">{r.project_name}</td>
                  <td className="py-1">{r.customer_agency}</td>
                  <td className="mono py-1 text-right">{formatInr(Number(r.revenue))}</td>
                  <td className="mono py-1 text-right">{formatInr(Number(r.commission_earned))}</td>
                </tr>
              ))}
              {profitability.data?.length === 0 && <tr><td colSpan={4} className="py-3 text-center text-muted-ink">No data.</td></tr>}
            </tbody>
          </table>
        </Panel>
      </Group>

      <Group title="Performance & Documents">
        <Panel title="OEM performance">
          <table className="w-full text-left">
            <thead><tr className="border-b border-hairline text-muted-ink"><th className="py-1">OEM</th><th className="py-1 text-right">Deliveries</th><th className="py-1 text-right">On-time %</th></tr></thead>
            <tbody>
              {oemPerf.data?.map((r) => (
                <tr key={r.oem_id} className="border-b border-hairline">
                  <td className="py-1">{r.oem_name}</td>
                  <td className="mono py-1 text-right">{r.deliveries}</td>
                  <td className="mono py-1 text-right">{r.on_time_percentage ?? "—"}</td>
                </tr>
              ))}
              {oemPerf.data?.length === 0 && <tr><td colSpan={3} className="py-3 text-center text-muted-ink">No OEMs yet.</td></tr>}
            </tbody>
          </table>
        </Panel>

        <Panel title="Employee-wise performance">
          <table className="w-full text-left">
            <thead><tr className="border-b border-hairline text-muted-ink"><th className="py-1">Employee</th><th className="py-1 text-right">RFIs</th><th className="py-1 text-right">Won</th><th className="py-1 text-right">Closure %</th></tr></thead>
            <tbody>
              {employees.data?.map((r) => (
                <tr key={r.user_id} className="border-b border-hairline">
                  <td className="py-1">{r.full_name ?? "—"}</td>
                  <td className="mono py-1 text-right">{r.requirements}</td>
                  <td className="mono py-1 text-right">{r.won}</td>
                  <td className="mono py-1 text-right">{r.closure_percentage ?? "—"}</td>
                </tr>
              ))}
              {employees.data?.length === 0 && <tr><td colSpan={4} className="py-3 text-center text-muted-ink">No assignments yet.</td></tr>}
            </tbody>
          </table>
        </Panel>

        <Panel title="Document renewals">
          <ul className="space-y-1">
            {docs.data?.slice(0, 12).map((doc) => (
              <li key={doc.document_id} className="flex justify-between border-b border-hairline py-1">
                <span>{doc.title ?? doc.file_name} <span className="text-muted-ink">· {doc.oem_name ?? doc.po_number ?? "unlinked"}</span></span>
                <span className={Number(doc.days_to_expiry) < 0 ? "text-risk" : "text-alert"}>
                  {doc.expiry_date ? istDateString(doc.expiry_date) : "—"} ({doc.days_to_expiry}d)
                </span>
              </li>
            ))}
            {docs.data?.length === 0 && <li className="text-muted-ink">No dated documents.</li>}
          </ul>
        </Panel>
      </Group>
    </AppShell>
  );
}
