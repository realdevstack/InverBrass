import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { ContactActions } from "@/components/contact-actions";
import { buildReachIndex } from "@/lib/data/reach";
import { formatInr, istDateString } from "@/lib/rules/dates";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function FinancePage({ searchParams }: { searchParams: Promise<{ po?: string }> }) {
  const { po } = await searchParams;
  const supabase = await createClient();

  let invoiceQuery = supabase.from("v_invoice_balances").select("*").order("invoice_date", { ascending: false });
  if (po) invoiceQuery = invoiceQuery.eq("purchase_order_id", po);

  const [invoices, commissions] = await Promise.all([
    invoiceQuery,
    supabase.from("commission_invoices").select("*").order("created_at", { ascending: false }),
  ]);

  // Contact lookup bounded to the invoices on screen.
  const reach = await buildReachIndex({
    customerIds: (invoices.data ?? []).map((i) => i.customer_id),
    customerNames: (invoices.data ?? []).map((i) => i.customer),
    oemIds: (invoices.data ?? []).map((i) => i.oem_id),
  });

  const outstanding = (invoices.data ?? []).reduce((sum, row) => sum + Number(row.balance_outstanding), 0);
  const overdue = (invoices.data ?? []).filter((row) => row.due_in_days !== null && row.due_in_days < 0 && Number(row.balance_outstanding) > 0);

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Finance</h1>
        <Link href="/finance/new" className="btn-primary">New OEM invoice</Link>
      </div>
      {po && <p className="mt-1 text-sm text-muted-ink">Filtered to one purchase order. <Link href="/finance" className="hover:underline">Clear</Link></p>}

      <section className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="panel p-4">
          <p className="label">Outstanding on OEM invoices</p>
          <p className="mono mt-1 text-2xl font-semibold">{formatInr(outstanding)}</p>
        </div>
        <div className="panel p-4">
          <p className="label">Overdue invoices</p>
          <p className={`mono mt-1 text-2xl font-semibold ${overdue.length > 0 ? "text-risk" : "text-clear"}`}>{overdue.length}</p>
        </div>
        <div className="panel p-4">
          <p className="label">Commission invoices</p>
          <p className="mono mt-1 text-2xl font-semibold">{commissions.data?.length ?? 0}</p>
        </div>
      </section>

      <section className="panel mt-6 overflow-x-auto">
        <h2 className="px-4 pt-4 font-medium">OEM invoices</h2>
        <table className="mt-2 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-hairline text-muted-ink">
              <th className="px-3 py-2">Invoice</th>
              <th className="px-3 py-2">PO</th>
              <th className="px-3 py-2">OEM</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Due</th>
              <th className="px-3 py-2 text-right">Gross</th>
              <th className="px-3 py-2 text-right">Paid</th>
              <th className="px-3 py-2 text-right">Balance</th>
              <th className="px-3 py-2">Commission</th>
              <th className="px-3 py-2">Contact</th>
            </tr>
          </thead>
          <tbody>
            {invoices.data?.map((inv) => {
              const isOverdue = inv.due_in_days !== null && inv.due_in_days < 0 && Number(inv.balance_outstanding) > 0;
              const customer = reach.forCustomerId(inv.customer_id) ?? reach.forCustomer(inv.customer);
              const oem = reach.forOem(inv.oem_id);
              return (
                <tr key={inv.oem_invoice_id} className="status-row border-b border-hairline" data-status={isOverdue ? "risk" : Number(inv.balance_outstanding) === 0 ? "clear" : "pending"}>
                  <td className="mono px-3 py-2">
                    <Link href={`/finance/${inv.oem_invoice_id}`} className="hover:underline">{inv.invoice_number}</Link>
                  </td>
                  <td className="mono px-3 py-2 text-xs">{inv.po_number}</td>
                  <td className="px-3 py-2">{inv.oem_name ?? "—"}</td>
                  <td className="px-3 py-2">{(inv.status ?? "").replace(/_/g, " ")}</td>
                  <td className="px-3 py-2">{inv.payment_due_date ? istDateString(inv.payment_due_date) : "—"}</td>
                  <td className="mono px-3 py-2 text-right">{formatInr(Number(inv.gross_amount))}</td>
                  <td className="mono px-3 py-2 text-right">{formatInr(Number(inv.paid_amount))}</td>
                  <td className={`mono px-3 py-2 text-right ${isOverdue ? "text-risk" : ""}`}>{formatInr(Number(inv.balance_outstanding))}</td>
                  <td className="px-3 py-2 text-xs">{inv.commission_invoice_number ?? "—"}</td>
                  <td className="px-3 py-2">
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
                  </td>
                </tr>
              );
            })}
            {invoices.data?.length === 0 && (
              <tr><td colSpan={10} className="px-3 py-6 text-center text-muted-ink">No OEM invoices yet.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="panel mt-6 overflow-x-auto">
        <h2 className="px-4 pt-4 font-medium">Commission</h2>
        <table className="mt-2 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-hairline text-muted-ink">
              <th className="px-3 py-2">Commission invoice</th>
              <th className="px-3 py-2">Customer</th>
              <th className="px-3 py-2 text-right">Base</th>
              <th className="px-3 py-2 text-right">Commission</th>
              <th className="px-3 py-2 text-right">GST</th>
              <th className="px-3 py-2 text-right">TDS</th>
              <th className="px-3 py-2 text-right">Outstanding</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {commissions.data?.map((c) => (
              <tr key={c.id} className="border-b border-hairline">
                <td className="mono px-3 py-2">{c.commission_invoice_number}</td>
                <td className="px-3 py-2">{c.customer_name ?? "—"}</td>
                <td className="mono px-3 py-2 text-right">{formatInr(Number(c.base_invoice_amount))}</td>
                <td className="mono px-3 py-2 text-right">{formatInr(Number(c.commission_amount))}</td>
                <td className="mono px-3 py-2 text-right">{formatInr(Number(c.gst_amount))}</td>
                <td className="mono px-3 py-2 text-right">{formatInr(Number(c.tds_amount))}</td>
                <td className="mono px-3 py-2 text-right">{formatInr(Number(c.outstanding_amount))}</td>
                <td className="px-3 py-2">{(c.payment_status ?? "").replace(/_/g, " ")}</td>
              </tr>
            ))}
            {commissions.data?.length === 0 && (
              <tr><td colSpan={8} className="px-3 py-6 text-center text-muted-ink">No commission invoices yet.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
