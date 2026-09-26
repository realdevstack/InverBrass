import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { InvoiceForm, type InvoiceOption } from "@/app/finance/finance-forms";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function NewInvoicePage() {
  const supabase = await createClient();
  const [pdis, pos] = await Promise.all([
    supabase
      .from("pdis")
      .select("id, purchase_order_id, quantity_cleared, result, conducted_date")
      .in("result", ["cleared", "partially_cleared"])
      .order("conducted_date", { ascending: false }),
    supabase.from("purchase_orders").select("id, po_number, customer, oem_id, quantity_ordered, unit_price"),
  ]);

  const poById = new Map((pos.data ?? []).map((p) => [p.id, p]));
  const options: InvoiceOption[] = (pdis.data ?? [])
    .map((pdi) => {
      const po = poById.get(pdi.purchase_order_id);
      if (!po) return null;
      return {
        poId: po.id,
        pdiId: pdi.id,
        label: `${po.po_number} · ${po.customer} · cleared ${Number(pdi.quantity_cleared).toLocaleString("en-IN")}`,
        customer: po.customer,
        oemId: po.oem_id,
        quantityOrdered: Number(pdi.quantity_cleared ?? po.quantity_ordered),
        unitPrice: Number(po.unit_price),
      };
    })
    .filter((x): x is InvoiceOption => x !== null);

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold">New OEM invoice</h1>
      <p className="mt-1 text-sm text-muted-ink">Only POs with a cleared or partially cleared PDI are offered.</p>
      {options.length === 0 ? (
        <p className="panel mt-4 p-4 text-sm">
          No cleared PDI yet. Record one under <Link href="/delivery" className="hover:underline">PDI &amp; risk</Link>.
        </p>
      ) : (
        <InvoiceForm options={options} />
      )}
    </AppShell>
  );
}
