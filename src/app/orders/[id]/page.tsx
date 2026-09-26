import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { groupHeadSignoffAction, saveVerificationAction, setPoStatusAction } from "@/app/orders/actions";
import { formatInr, istDateString } from "@/lib/rules/dates";
import { canRead, type AppRole } from "@/lib/rules/access";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: po, error } = await supabase.from("purchase_orders").select("*").eq("id", id).maybeSingle();
  if (error) {
    return (
      <AppShell>
        <p role="alert" className="rounded border border-risk/40 bg-risk/10 p-3 text-sm text-risk">{error.message}</p>
      </AppShell>
    );
  }
  if (!po) notFound();

  const [requirement, oem, risk, invoices, documents] = await Promise.all([
    supabase.from("requirements").select("id, project_name, customer_agency").eq("id", po.requirement_id).maybeSingle(),
    supabase.from("oems").select("name").eq("id", po.oem_id ?? "00000000-0000-0000-0000-000000000000").maybeSingle(),
    supabase.from("v_order_risk").select("*").eq("purchase_order_id", id).maybeSingle(),
    supabase.from("oem_invoices").select("id, invoice_number, status, gross_amount").eq("purchase_order_id", id),
    supabase.from("documents").select("id, document_type, title, file_name").eq("purchase_order_id", id),
  ]);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  let role: AppRole | null = null;
  if (user) {
    const { data: roleRow } = await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
    role = (roleRow?.role as AppRole | undefined) ?? null;
  }

  const verified = Boolean(po.verified_at);

  return (
    <AppShell>
      <Link href="/orders" className="text-sm hover:underline">← Orders</Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="mono text-2xl font-semibold">{po.po_number}</h1>
        <span className="rounded bg-content px-2 py-0.5 text-xs">{po.status}</span>
      </div>
      <p className="mt-1 text-sm text-muted-ink">
        {requirement.data?.project_name} · {po.customer}
        {oem.data?.name ? ` · ${oem.data.name}` : ""}
      </p>

      <section className="panel mt-4 grid gap-3 p-4 text-sm sm:grid-cols-4">
        <div><dt className="label">PO date</dt><dd>{istDateString(po.po_date)}</dd></div>
        <div><dt className="label">Committed deadline</dt><dd>{po.committed_deadline ? istDateString(po.committed_deadline) : "—"}</dd></div>
        <div><dt className="label">Quantity</dt><dd className="mono">{Number(po.quantity_ordered).toLocaleString("en-IN")}</dd></div>
        <div><dt className="label">Unit price</dt><dd className="mono">{formatInr(Number(po.unit_price))}</dd></div>
        <div><dt className="label">PO value</dt><dd className="mono">{formatInr(Number(po.po_value))}</dd></div>
        <div><dt className="label">Taxes / GST</dt><dd className="mono">{formatInr(Number(po.taxes_gst))}</dd></div>
        <div><dt className="label">Partial delivery</dt><dd>{po.partial_delivery_allowed ? "allowed" : "not allowed"}</dd></div>
        <div><dt className="label">PDI</dt><dd>{po.pdi_required ? `required (${po.pdi_mode ?? "—"})` : "not required"}</dd></div>
      </section>

      <section className="panel mt-6 p-4">
        <h2 className="font-medium">Order verification (Operations)</h2>
        <p className="mt-1 text-xs text-muted-ink">Spec match, price match against the approved quote, delivery feasibility and document completeness.</p>
        <form action={saveVerificationAction} className="mt-3 grid gap-2 text-sm sm:grid-cols-4">
          <input type="hidden" name="purchase_order_id" value={id} />
          <label className="flex items-center gap-2"><input type="checkbox" name="verification_spec_match" defaultChecked={po.verification_spec_match ?? false} /> Spec match</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="verification_price_match" defaultChecked={po.verification_price_match ?? false} /> Price match</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="verification_feasibility" defaultChecked={po.verification_feasibility ?? false} /> Feasibility</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="verification_documents_complete" defaultChecked={po.verification_documents_complete ?? false} /> Documents complete</label>
          <button type="submit" className="btn-outline sm:col-span-4 sm:justify-self-start">Save verification</button>
        </form>
        <p className="mt-2 text-xs text-muted-ink">
          {verified ? `Checked${po.verified_at ? ` on ${istDateString(po.verified_at)}` : ""}.` : "Not yet checked."}{" "}
          Group Head sign-off:{" "}
          <span className={po.group_head_signoff_at ? "text-clear" : "text-alert"}>
            {po.group_head_signoff_at ? "recorded" : "pending"}
          </span>
        </p>
        {!po.group_head_signoff_at && (
          <form action={groupHeadSignoffAction} className="mt-2">
            <input type="hidden" name="purchase_order_id" value={id} />
            <button type="submit" className="btn-primary">Group Head sign-off</button>
          </form>
        )}
      </section>

      <section className="panel mt-6 p-4">
        <h2 className="font-medium">Progress</h2>
        <div className="mt-2 grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <p className="label">Material readiness</p>
            <p>{(risk.data?.production_status ?? "not_started").replace(/_/g, " ")} / QC {(risk.data?.qc_status ?? "not_started").replace(/_/g, " ")}</p>
            <p className="text-xs text-muted-ink">Expected completion: {risk.data?.expected_completion_date ? istDateString(risk.data.expected_completion_date) : "—"}</p>
          </div>
          <div>
            <p className="label">PDI</p>
            <p>{(risk.data?.latest_pdi_result ?? "pending").replace(/_/g, " ")}</p>
            <p className="text-xs text-muted-ink">Rejected: {risk.data?.rejected_quantity === null || risk.data?.rejected_quantity === undefined ? "—" : Number(risk.data.rejected_quantity).toLocaleString("en-IN")}</p>
          </div>
          <div>
            <p className="label">Invoices</p>
            <p>{invoices.data?.length ?? 0} against this PO</p>
            {canRead(role, "finance") && (
              <Link href={`/finance?po=${id}`} className="text-sm hover:underline">Open finance</Link>
            )}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          {canRead(role, "fulfilment") && (
            <Link href={`/delivery/${id}`} className="btn-outline">Material readiness, PDI &amp; LD risk</Link>
          )}
          <Link href={`/requirements/${po.requirement_id}`} className="btn-outline">Requirement</Link>
        </div>
      </section>

      <section className="panel mt-6 p-4">
        <h2 className="font-medium">Status</h2>
        <form action={setPoStatusAction} className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <input type="hidden" name="purchase_order_id" value={id} />
          <select name="status" defaultValue={po.status} className="input mt-0 w-40">
            <option value="open">Open</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button type="submit" className="btn-outline">Update</button>
        </form>
      </section>

      <section className="panel mt-6 p-4">
        <h2 className="font-medium">Documents traced to this PO ({documents.data?.length ?? 0})</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {documents.data?.map((d) => (
            <li key={d.id} className="border-b border-hairline py-1">
              <span className="rounded bg-content px-1.5 py-0.5 text-xs">{d.document_type}</span> {d.title ?? d.file_name}
            </li>
          ))}
          {documents.data?.length === 0 && <li className="text-muted-ink">No documents linked yet.</li>}
        </ul>
      </section>
    </AppShell>
  );
}
