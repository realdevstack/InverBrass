import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { formatInr, istDateString } from "@/lib/rules/dates";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_order_risk")
    .select("*")
    .order("po_number", { ascending: true });

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Purchase orders</h1>
        <Link href="/orders/new" className="btn-primary">New purchase order</Link>
      </div>
      <p className="mt-1 text-sm text-muted-ink">A PO can only be created from an approved quotation.</p>

      {error && <p role="alert" className="mt-4 rounded border border-risk/40 bg-risk/10 p-3 text-sm text-risk">{error.message}</p>}

      <section className="panel mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-hairline text-muted-ink">
              <th className="px-3 py-2">PO number</th>
              <th className="px-3 py-2">Customer</th>
              <th className="px-3 py-2">OEM</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Deadline</th>
              <th className="px-3 py-2 text-right">Value</th>
              <th className="px-3 py-2">Material</th>
              <th className="px-3 py-2">PDI</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((po) => {
              const days = po.days_to_deadline;
              const atRisk = days !== null && days <= 7;
              return (
                <tr key={po.purchase_order_id} className="status-row border-b border-hairline" data-status={atRisk ? "pending" : "progress"}>
                  <td className="mono px-3 py-2">
                    <Link href={`/orders/${po.purchase_order_id}`} className="hover:underline">{po.po_number}</Link>
                  </td>
                  <td className="px-3 py-2">{po.customer_agency}</td>
                  <td className="px-3 py-2">{po.oem_name ?? "—"}</td>
                  <td className="px-3 py-2">{po.status}</td>
                  <td className="px-3 py-2">
                    {po.committed_deadline ? (
                      <span className={atRisk ? "text-alert" : ""}>
                        {istDateString(po.committed_deadline)}{days !== null ? ` (${days}d)` : ""}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="mono px-3 py-2 text-right">{formatInr(Number(po.po_value))}</td>
                  <td className="px-3 py-2 text-xs">{(po.production_status ?? "not started").replace(/_/g, " ")}</td>
                  <td className="px-3 py-2 text-xs">{(po.latest_pdi_result ?? "pending").replace(/_/g, " ")}</td>
                </tr>
              );
            })}
            {data && data.length === 0 && (
              <tr><td colSpan={8} className="px-3 py-6 text-center text-muted-ink">No purchase orders yet.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
