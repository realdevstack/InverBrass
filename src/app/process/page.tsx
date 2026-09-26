import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Stage = {
  name: string;
  href: string;
  count: number;
  key: string;
  from: string;
  gate: string;
};

async function count(supabase: Awaited<ReturnType<typeof createClient>>, table: string): Promise<number> {
  const { count: n } = await supabase.from(table as never).select("*", { count: "exact", head: true });
  return n ?? 0;
}

export default async function ProcessPage() {
  const supabase = await createClient();

  const [rfis, quotations, pos, readiness, pdis, invoices, deliveries, payments, commission, customers, products, oems] =
    await Promise.all([
      count(supabase, "requirements"),
      count(supabase, "quotations"),
      count(supabase, "purchase_orders"),
      count(supabase, "material_readiness"),
      count(supabase, "pdis"),
      count(supabase, "oem_invoices"),
      count(supabase, "deliveries"),
      count(supabase, "payments"),
      count(supabase, "commission_invoices"),
      count(supabase, "customers"),
      count(supabase, "products"),
      count(supabase, "oems"),
    ]);

  const stages: Stage[] = [
    { name: "1. RFI / Tender enquiry", href: "/requirements", count: rfis, key: "requirements", from: "Customer Master (customer_id)", gate: "Entry point. One record per enquiry, with up to 500 line items." },
    { name: "2. Quotation", href: "/quotations", count: quotations, key: "quotations.requirement_id", from: "RFI", gate: "Every quotation must originate from an RFI. Two-level approval before submission." },
    { name: "3. Purchase Order", href: "/orders", count: pos, key: "purchase_orders.quotation_id / requirement_id", from: "Quotation", gate: "A PO can only be created from an approved quotation. One quotation can yield one PO." },
    { name: "4. Material readiness", href: "/delivery", count: readiness, key: "material_readiness.purchase_order_id", from: "PO", gate: "OEM confirms batch/serial, quantity ready and expected completion (feeds LD risk)." },
    { name: "5. PDI / Inspection", href: "/delivery", count: pdis, key: "pdis.purchase_order_id", from: "Material readiness + PO line", gate: "Failed PDI blocks dispatch and locks invoicing until cleared." },
    { name: "6. OEM invoice", href: "/finance", count: invoices, key: "oem_invoices.purchase_order_id / pdi_id", from: "PO + cleared PDI", gate: "Invoicing is refused until a PDI for the same PO is cleared. Multiple invoices per PO allowed." },
    { name: "7. Delivery", href: "/finance", count: deliveries, key: "deliveries.oem_invoice_id", from: "OEM invoice", gate: "Multiple deliveries per invoice; pending balance tracked; closure on full delivery." },
    { name: "8. Payment", href: "/finance", count: payments, key: "payments.oem_invoice_id", from: "OEM invoice", gate: "Partial payments allowed; balance and overdue days computed; follow-up status." },
    { name: "9. Commission invoice", href: "/finance", count: commission, key: "commission_invoices.oem_invoice_id", from: "OEM invoice", gate: "Commission can only be raised after the OEM invoice is paid. Auto-calculated from the OEM-wise percentage." },
  ];

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold">Process flow</h1>
      <p className="mt-1 text-sm text-muted-ink">
        The workbook&apos;s Sheet1 order-management stages, in order, with the linking key and the hard gate between them.
      </p>

      <section className="panel mt-4 p-4">
        <h2 className="font-medium">Master data feeds the stages</h2>
        <div className="mt-2 grid gap-3 text-sm sm:grid-cols-3">
          <div className="status-row pl-2" data-status="progress">
            <p className="font-medium">Customer Master ({customers})</p>
            <p className="text-muted-ink">
              Links to <span className="mono">requirements.customer_id</span> and{" "}
              <span className="mono">purchase_orders.customer_id</span>. Provides division, GST, GeM and portal details.
            </p>
            <Link href="/customers" className="text-sm hover:underline">Open customers</Link>
          </div>
          <div className="status-row pl-2" data-status="progress">
            <p className="font-medium">OEM Master ({oems})</p>
            <p className="text-muted-ink">
              Links to sourcing, quotations, POs, PDI and commission via <span className="mono">oem_id</span>. Provides commission % and terms.
            </p>
            <Link href="/oems" className="text-sm hover:underline">Open OEMs</Link>
          </div>
          <div className="status-row pl-2" data-status="progress">
            <p className="font-medium">Part / Product Master ({products})</p>
            <p className="text-muted-ink">
              Links to <span className="mono">line_items.product_id</span>. Carries HSN, compliance and standard price for the part used at every stage.
            </p>
            <Link href="/products" className="text-sm hover:underline">Open parts</Link>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-bold">Order management stages</h2>
        <ul className="mt-3 space-y-3">
          {stages.map((stage) => (
            <li key={stage.name} className="panel p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-medium">
                  <Link href={stage.href} className="hover:underline">{stage.name}</Link>
                </h3>
                <span className="mono rounded bg-content px-2 py-0.5 text-xs">{stage.count} record(s)</span>
              </div>
              <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="label">Links from</dt>
                  <dd>{stage.from}</dd>
                  <dt className="label mt-1">Key</dt>
                  <dd className="mono text-xs">{stage.key}</dd>
                </div>
                <div>
                  <dt className="label">Gate / rule</dt>
                  <dd>{stage.gate}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted-ink">
          The chain is enforced in the database, not just the UI: the gates above are triggers, so a PO without an approved
          quotation, an invoice without a cleared PDI, or a commission before payment all fail even if called directly.
        </p>
      </section>
    </AppShell>
  );
}
