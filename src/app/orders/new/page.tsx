import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { PurchaseOrderForm, type QuotationOption } from "@/app/orders/order-forms";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function NewOrderPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("v_past_bids")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  const quotations: QuotationOption[] = (data ?? []).map((q) => ({
    id: q.quotation_id as string,
    label: `${q.project_name} · ${q.customer_agency} · ${q.part_number ?? "whole"} · v${q.version}`,
    customer: q.customer_agency ?? "",
    oemId: q.oem_id,
    lineItemId: q.line_item_id,
    partNumber: q.part_number,
    finalPrice: q.final_price === null ? null : Number(q.final_price),
    leadTimeDays: null,
    paymentTerms: null,
    deliveryTerms: null,
  }));

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold">New purchase order</h1>
      <p className="mt-1 text-sm text-muted-ink">Only approved quotations are offered. The database refuses an orphan PO regardless of the UI.</p>
      {quotations.length === 0 ? (
        <p className="panel mt-4 p-4 text-sm">
          No approved quotations yet. Take a quotation through both approval levels first.{" "}
          <Link href="/quotations" className="hover:underline">Go to quotations</Link>.
        </p>
      ) : (
        <PurchaseOrderForm quotations={quotations} />
      )}
    </AppShell>
  );
}
