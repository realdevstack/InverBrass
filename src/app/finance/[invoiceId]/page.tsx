import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { CommissionForm, DeliveryForm, PaymentForm } from "@/app/finance/finance-forms";
import { formatInr, istDateString } from "@/lib/rules/dates";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function InvoicePage({ params }: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = await params;
  const supabase = await createClient();

  const { data: invoice, error } = await supabase
    .from("v_invoice_balances")
    .select("*")
    .eq("oem_invoice_id", invoiceId)
    .maybeSingle();
  if (error) {
    return (
      <AppShell>
        <p role="alert" className="rounded border border-risk/40 bg-risk/10 p-3 text-sm text-risk">{error.message}</p>
      </AppShell>
    );
  }
  if (!invoice) notFound();

  const [payments, deliveries, commissions, oem] = await Promise.all([
    supabase.from("payments").select("*").eq("oem_invoice_id", invoiceId).order("payment_date", { ascending: false }),
    supabase.from("deliveries").select("*").eq("oem_invoice_id", invoiceId).order("created_at", { ascending: false }),
    supabase.from("commission_invoices").select("*").eq("oem_invoice_id", invoiceId),
    supabase.from("oems").select("id, name, commission_percentage").eq("id", invoice.oem_id ?? "00000000-0000-0000-0000-000000000000").maybeSingle(),
  ]);

  const gross = Number(invoice.gross_amount);
  const paid = Number(invoice.paid_amount);
  const canCommission = invoice.status === "paid" || paid >= gross;

  return (
    <AppShell>
      <Link href="/finance" className="text-sm hover:underline">← Finance</Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="mono text-2xl font-semibold">{invoice.invoice_number}</h1>
        <span className="rounded bg-content px-2 py-0.5 text-xs">{(invoice.status ?? "").replace(/_/g, " ")}</span>
      </div>
      <p className="mt-1 text-sm text-muted-ink">
        {invoice.po_number} · {invoice.customer} · {oem.data?.name ?? invoice.oem_name ?? "—"}
      </p>

      <section className="panel mt-4 grid gap-3 p-4 text-sm sm:grid-cols-4">
        <div><p className="label">Invoice date</p><p>{invoice.invoice_date ? istDateString(invoice.invoice_date) : "—"}</p></div>
        <div><p className="label">Quantity invoiced</p><p className="mono">{Number(invoice.quantity_invoiced).toLocaleString("en-IN")}</p></div>
        <div><p className="label">Net / GST</p><p className="mono">{formatInr(Number(invoice.net_amount))} / {formatInr(Number(invoice.gst_amount))}</p></div>
        <div><p className="label">Gross</p><p className="mono">{formatInr(gross)}</p></div>
        <div><p className="label">Paid</p><p className="mono text-clear">{formatInr(paid)}</p></div>
        <div><p className="label">Balance</p><p className={`mono ${Number(invoice.balance_outstanding) > 0 ? "text-alert" : "text-clear"}`}>{formatInr(Number(invoice.balance_outstanding))}</p></div>
        <div><p className="label">Payment due</p><p>{invoice.payment_due_date ? istDateString(invoice.payment_due_date) : "—"}</p></div>
        <div><p className="label">Commission</p><p>{invoice.commission_invoice_number ?? "not raised"}</p></div>
      </section>

      <section className="panel mt-6 p-4">
        <h2 className="font-medium">Payments (partial supported)</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {payments.data?.map((p) => (
            <li key={p.id} className="flex flex-wrap justify-between gap-2 border-b border-hairline py-1">
              <span>{p.payment_reference ?? "—"} · {(p.mode ?? "").toUpperCase()}{p.terms ? ` · ${p.terms}` : ""}</span>
              <span className="mono">
                {p.payment_date ? istDateString(p.payment_date) : "—"} · {formatInr(Number(p.amount_received))} · balance {formatInr(Number(p.balance_outstanding))}
              </span>
            </li>
          ))}
          {payments.data?.length === 0 && <li className="text-muted-ink">No payments recorded.</li>}
        </ul>
        <PaymentForm
          invoiceId={invoiceId}
          invoiceAmount={gross}
          grossAmount={gross}
          alreadyPaid={paid}
          customer={invoice.customer ?? ""}
          oemId={invoice.oem_id}
        />
      </section>

      <section className="panel mt-6 p-4">
        <h2 className="font-medium">Deliveries</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {deliveries.data?.map((d) => (
            <li key={d.id} className="flex flex-wrap justify-between gap-2 border-b border-hairline py-1">
              <span><span className="mono text-xs">{d.delivery_number ?? ""}</span> {d.delivery_reference ?? "—"}{d.location ? ` · ${d.location}` : ""}{d.grn_number ? ` · GRN ${d.grn_number}` : ""}</span>
              <span className="mono">
                {d.delivery_date ? istDateString(d.delivery_date) : "—"} · qty {Number(d.quantity_delivered).toLocaleString("en-IN")} · pending {Number(d.pending_balance).toLocaleString("en-IN")} · {(d.delivery_status ?? "").replace(/_/g, " ")}
              </span>
            </li>
          ))}
          {deliveries.data?.length === 0 && <li className="text-muted-ink">No deliveries recorded.</li>}
        </ul>
        <DeliveryForm invoiceId={invoiceId} invoicedQuantity={Number(invoice.quantity_invoiced)} />
      </section>

      <section className="panel mt-6 p-4">
        <h2 className="font-medium">Commission</h2>
        {commissions.data && commissions.data.length > 0 ? (
          <ul className="mt-2 space-y-1 text-sm">
            {commissions.data.map((c) => (
              <li key={c.id} className="flex flex-wrap justify-between gap-2 border-b border-hairline py-1">
                <span className="mono">{c.commission_invoice_number}</span>
                <span className="mono">
                  {Number(c.commission_percentage).toFixed(2)}% · {formatInr(Number(c.commission_amount))} · GST {formatInr(Number(c.gst_amount))} · TDS {formatInr(Number(c.tds_amount))} · {(c.payment_status ?? "").replace(/_/g, " ")}
                </span>
              </li>
            ))}
          </ul>
        ) : canCommission ? (
          <CommissionForm
            invoiceId={invoiceId}
            oemId={invoice.oem_id}
            customer={invoice.customer ?? ""}
            baseAmount={gross}
            defaultPercentage={oem.data?.commission_percentage === undefined ? 5 : Number(oem.data.commission_percentage)}
          />
        ) : (
          <p className="mt-1 text-sm text-alert">
            Commission cannot be raised until the OEM invoice is fully paid (paid {formatInr(paid)} of {formatInr(gross)}).
          </p>
        )}
      </section>
    </AppShell>
  );
}
