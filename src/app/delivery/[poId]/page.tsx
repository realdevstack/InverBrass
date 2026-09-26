import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { ExtensionRequestForm, MaterialReadinessForm, PdiForm } from "@/app/delivery/delivery-forms";
import { assessLdRisk } from "@/lib/rules/ld-risk";
import { istDateString } from "@/lib/rules/dates";
import { canRead, type AppRole } from "@/lib/rules/access";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DeliveryDetailPage({ params }: { params: Promise<{ poId: string }> }) {
  const { poId } = await params;
  const supabase = await createClient();

  const { data: riskRow, error } = await supabase.from("v_order_risk").select("*").eq("purchase_order_id", poId).maybeSingle();
  if (error) {
    return (
      <AppShell>
        <p role="alert" className="rounded border border-risk/40 bg-risk/10 p-3 text-sm text-risk">{error.message}</p>
      </AppShell>
    );
  }
  if (!riskRow) notFound();

  const [readiness, pdis, lineItems] = await Promise.all([
    supabase.from("material_readiness").select("*").eq("purchase_order_id", poId).order("created_at", { ascending: false }),
    supabase.from("pdis").select("*").eq("purchase_order_id", poId).order("created_at", { ascending: false }),
    supabase.from("line_items").select("id, line_no, part_number").eq("requirement_id", riskRow.requirement_id ?? "00000000-0000-0000-0000-000000000000").order("line_no"),
  ]);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  let role: AppRole | null = null;
  if (user) {
    const { data: roleRow } = await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
    role = (roleRow?.role as AppRole | undefined) ?? null;
  }

  const risk = assessLdRisk({
    expectedCompletionDate: riskRow.expected_completion_date,
    committedDeadline: riskRow.committed_deadline,
    pdiBlocked: riskRow.latest_pdi_result === "rejected",
  });

  const pdiBlock = riskRow.latest_pdi_result === "rejected";

  return (
    <AppShell>
      <Link href="/delivery" className="text-sm hover:underline">← PDI &amp; risk</Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="mono text-2xl font-semibold">{riskRow.po_number}</h1>
        <span className={`rounded px-2 py-0.5 text-xs ${risk.level === "late" ? "bg-risk/15 text-risk" : risk.level === "at_risk" ? "bg-alert/20 text-ink" : "bg-clear/20 text-ink"}`}>
          {risk.level.replace(/_/g, " ")}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-ink">
        {riskRow.project_name} · {riskRow.customer_agency} · {riskRow.oem_name ?? "—"}
      </p>

      <section className="panel mt-4 p-4 text-sm">
        <h2 className="font-medium">LD risk</h2>
        <p className={`mt-1 ${risk.level === "late" ? "text-risk" : risk.level === "at_risk" ? "text-alert" : "text-clear"}`}>
          {risk.reason}
        </p>
        <div className="mt-2 flex flex-wrap gap-x-6">
          <span>Committed deadline: {riskRow.committed_deadline ? istDateString(riskRow.committed_deadline) : "—"}</span>
          <span>Days to deadline: {risk.daysToDeadline ?? "—"}</span>
          <span>Expected completion: {riskRow.expected_completion_date ? istDateString(riskRow.expected_completion_date) : "—"}</span>
          <span>Extension request: {riskRow.extension_requested_at ? "raised" : "not raised"}</span>
        </div>
        {pdiBlock && (
          <p className="mt-2 rounded border border-risk/40 bg-risk/10 p-2 text-risk">
            A failed PDI blocks dispatch and locks invoicing until re-inspection clears.
          </p>
        )}
        <ExtensionRequestForm purchaseOrderId={poId} existingNote={riskRow.extension_note} />
      </section>

      <section className="panel mt-6 p-4">
        <h2 className="font-medium">Material readiness</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {readiness.data?.map((m) => (
            <li key={m.id} className="border-b border-hairline py-1">
              <span className="mono text-xs">{m.readiness_number ?? ""}</span>{" "}
              <span className="text-muted-ink">{istDateString(m.created_at)}</span> · production <strong>{(m.production_status ?? "").replace(/_/g, " ")}</strong>
              {` · QC ${(m.qc_status ?? "").replace(/_/g, " ")}`}
              {m.batch_number ? ` · batch ${m.batch_number}` : ""}
              {m.expected_completion_date ? ` · expected ${istDateString(m.expected_completion_date)}` : ""}
            </li>
          ))}
          {readiness.data?.length === 0 && <li className="text-muted-ink">No readiness update yet.</li>}
        </ul>
        <MaterialReadinessForm purchaseOrderId={poId} />
      </section>

      <section className="panel mt-6 p-4">
        <h2 className="font-medium">PDI / inspection</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {pdis.data?.map((p) => (
            <li key={p.id} className="border-b border-hairline py-1">
              <span className="mono mr-2 text-xs">{p.pdi_number ?? ""}</span>
              <span className="rounded bg-content px-1.5 py-0.5 text-xs">{(p.inspection_agency ?? "").replace(/_/g, " ")}</span>{" "}
              offered <span className="mono">{Number(p.quantity_offered).toLocaleString("en-IN")}</span> · cleared{" "}
              <span className="mono text-clear">{Number(p.quantity_cleared).toLocaleString("en-IN")}</span> · rejected{" "}
              <span className="mono text-risk">{Number(p.quantity_rejected).toLocaleString("en-IN")}</span> · result{" "}
              <strong>{(p.result ?? "").replace(/_/g, " ")}</strong>
              {p.re_pdi_required ? " · re-PDI required" : ""}
              {p.rejection_remarks ? ` · ${p.rejection_remarks}` : ""}
            </li>
          ))}
          {pdis.data?.length === 0 && <li className="text-muted-ink">No PDI recorded yet.</li>}
        </ul>
        <PdiForm
          purchaseOrderId={poId}
          lineItems={(lineItems.data ?? []).map((l) => ({ id: l.id, label: `#${l.line_no} ${l.part_number}` }))}
        />
      </section>

      <div className="mt-6 flex gap-3">
        <Link href={`/orders/${poId}`} className="btn-outline">Order</Link>
        {canRead(role, "finance") && (
          <Link href={`/finance?po=${poId}`} className="btn-outline">Finance</Link>
        )}
      </div>
    </AppShell>
  );
}
