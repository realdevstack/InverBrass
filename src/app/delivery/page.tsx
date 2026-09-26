import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { assessLdRisk, type RiskLevel } from "@/lib/rules/ld-risk";
import { istDateString } from "@/lib/rules/dates";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const TONE: Record<RiskLevel, { dot: string; text: string; label: string }> = {
  late: { dot: "dot-risk", text: "text-risk", label: "Late" },
  at_risk: { dot: "dot-pending", text: "text-alert", label: "At risk" },
  on_track: { dot: "dot-clear", text: "text-clear", label: "On track" },
  unknown: { dot: "dot-pending", text: "text-muted-ink", label: "No deadline" },
};

export default async function DeliveryPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("v_order_risk").select("*");

  const rows = (data ?? [])
    .map((row) => ({
      row,
      risk: assessLdRisk({
        expectedCompletionDate: row.expected_completion_date,
        committedDeadline: row.committed_deadline,
        pdiBlocked: row.latest_pdi_result === "rejected",
      }),
    }))
    .sort((a, b) => {
      const order: Record<RiskLevel, number> = { late: 0, at_risk: 1, unknown: 2, on_track: 3 };
      return order[a.risk.level] - order[b.risk.level];
    });

  const atRiskCount = rows.filter((r) => r.risk.atRisk).length;

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold">Material readiness, PDI &amp; LD risk</h1>
      <p className="mt-1 text-sm text-muted-ink">
        LD risk compares expected completion against the committed deadline and raises the extension request before the due date.
      </p>
      <p className="mt-2 text-sm">
        <span className="dot dot-pending" />
        <strong>{atRiskCount}</strong> order(s) at risk or late.
      </p>

      {error && <p role="alert" className="mt-4 rounded border border-risk/40 bg-risk/10 p-3 text-sm text-risk">{error.message}</p>}

      <section className="panel mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-hairline text-muted-ink">
              <th className="px-3 py-2">PO</th>
              <th className="px-3 py-2">Customer</th>
              <th className="px-3 py-2">Deadline</th>
              <th className="px-3 py-2">Expected completion</th>
              <th className="px-3 py-2">Days</th>
              <th className="px-3 py-2">Production</th>
              <th className="px-3 py-2">PDI</th>
              <th className="px-3 py-2">Risk</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ row, risk }) => {
              const tone = TONE[risk.level];
              return (
                <tr key={row.purchase_order_id} className="status-row border-b border-hairline" data-status={risk.level === "late" ? "risk" : risk.level === "at_risk" ? "pending" : "clear"}>
                  <td className="mono px-3 py-2">
                    <Link href={`/delivery/${row.purchase_order_id}`} className="hover:underline">{row.po_number}</Link>
                  </td>
                  <td className="px-3 py-2">{row.customer_agency}</td>
                  <td className="px-3 py-2">{row.committed_deadline ? istDateString(row.committed_deadline) : "—"}</td>
                  <td className="px-3 py-2">{row.expected_completion_date ? istDateString(row.expected_completion_date) : "—"}</td>
                  <td className="mono px-3 py-2">{risk.daysToDeadline ?? "—"}</td>
                  <td className="px-3 py-2 text-xs">{(row.production_status ?? "not_started").replace(/_/g, " ")}</td>
                  <td className="px-3 py-2 text-xs">{(row.latest_pdi_result ?? "pending").replace(/_/g, " ")}</td>
                  <td className={`px-3 py-2 text-xs ${tone.text}`}>
                    <span className={`dot ${tone.dot}`} />
                    {tone.label}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={8} className="px-3 py-6 text-center text-muted-ink">No orders to track.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
