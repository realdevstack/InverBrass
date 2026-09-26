import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { EditQuotationForm, LossCaptureForm } from "@/app/quotations/quotation-forms";
import { recordApprovalAction, setQuotationStatusAction } from "@/app/quotations/actions";
import { formatInr, istDateString } from "@/lib/rules/dates";
import { achievedMargin } from "@/lib/rules/quotation";
import { isApprover, type AppRole } from "@/lib/rules/access";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function BidList({ title, rows }: { title: string; rows: Array<{ quotation_id: string | null; project_name: string | null; status: string | null; final_price: number | null }> }) {
  return (
    <div>
      <h3 className="text-sm font-medium">{title}</h3>
      <ul className="mt-1 space-y-1 text-sm">
        {rows.length === 0 && <li className="text-muted-ink">none</li>}
        {rows.map((r) => (
          <li key={r.quotation_id} className="flex justify-between gap-3 border-b border-hairline py-1">
            <Link href={`/quotations/${r.quotation_id}`} className="hover:underline">{r.project_name}</Link>
            <span className={r.status === "won" ? "text-clear" : r.status === "lost" ? "text-risk" : "text-muted-ink"}>
              {(r.status ?? "").replace(/_/g, " ")}
              {r.final_price !== null ? ` · ${formatInr(Number(r.final_price))}` : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function QuotationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: quotation, error } = await supabase.from("quotations").select("*").eq("id", id).maybeSingle();
  if (error) {
    return (
      <AppShell>
        <p role="alert" className="rounded border border-risk/40 bg-risk/10 p-3 text-sm text-risk">{error.message}</p>
      </AppShell>
    );
  }
  if (!quotation) notFound();

  const [requirement, oem, approvals, versions, part, userResult] = await Promise.all([
    supabase.from("requirements").select("id, project_name, customer_agency").eq("id", quotation.requirement_id).maybeSingle(),
    supabase.from("oems").select("id, name, brand_product_category").eq("id", quotation.oem_id ?? "00000000-0000-0000-0000-000000000000").maybeSingle(),
    supabase.from("v_quotation_approvals").select("*").eq("quotation_id", id).maybeSingle(),
    supabase.from("quotation_versions").select("version, created_at, changed_by").eq("quotation_id", id).order("version"),
    supabase.from("line_items").select("part_number").eq("id", quotation.line_item_id ?? "00000000-0000-0000-0000-000000000000").maybeSingle(),
    supabase.auth.getUser(),
  ]);

  const partNumber = part.data?.part_number ?? null;
  const agencyName = requirement.data?.customer_agency ?? "___none___";
  const productType = oem.data?.brand_product_category ?? "___none___";
  const [partMatches, agency, type] = await Promise.all([
    partNumber
      ? supabase.from("v_past_bids").select("*").eq("part_number", partNumber).neq("quotation_id", id).limit(5)
      : Promise.resolve({ data: [] as Array<{ quotation_id: string; project_name: string; status: string; final_price: number | null }> }),
    supabase.from("v_past_bids").select("*").eq("customer_agency", agencyName).neq("quotation_id", id).limit(5),
    supabase.from("v_past_bids").select("*").eq("product_type", productType).neq("quotation_id", id).limit(5),
  ]);
  const partRows = partMatches.data ?? [];

  const user = userResult.data.user;
  let role: AppRole | null = null;
  if (user) {
    const { data: roleRow } = await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
    role = (roleRow?.role as AppRole | undefined) ?? null;
  }

  const ghApproved = (approvals.data?.group_head_approved ?? 0) > 0;
  const mgmtApproved = (approvals.data?.management_approved ?? 0) > 0;

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/quotations" className="text-sm hover:underline">← Quotations</Link>
        <Link href={`/quotations/${id}/print`} className="btn-outline">Print / PDF</Link>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">{requirement.data?.project_name ?? "Quotation"}</h1>
        <span className="mono rounded bg-content px-2 py-0.5 text-xs">v{quotation.version}</span>
        <span className="rounded bg-content px-2 py-0.5 text-xs">{(quotation.status ?? "").replace(/_/g, " ")}</span>
        <span className="mono rounded bg-content px-2 py-0.5 text-xs">{quotation.quotation_number ?? ""}</span>
      </div>
      <p className="mt-1 text-sm text-muted-ink">
        {requirement.data?.customer_agency}
        {partNumber ? <span className="mono"> · {partNumber}</span> : null}
        {oem.data?.name ? ` · ${oem.data.name}` : ""}
      </p>

      <section className="panel mt-4 p-4 text-sm">
        <h2 className="font-medium">Pricing</h2>
        <div className="mono mt-2 flex flex-wrap gap-x-6 gap-y-1">
          <span>OEM price: {quotation.oem_price === null ? "—" : formatInr(Number(quotation.oem_price))}</span>
          <span>Freight: {quotation.freight_amount === null ? "—" : formatInr(Number(quotation.freight_amount))}</span>
          <span>GST: {quotation.gst_amount === null ? "—" : formatInr(Number(quotation.gst_amount))}</span>
          <span>Recommended: {quotation.recommended_price === null ? "—" : formatInr(Number(quotation.recommended_price))}</span>
          <strong>Final: {quotation.final_price === null ? "—" : formatInr(Number(quotation.final_price))}</strong>
          <span>
            Margin: {achievedMargin(
              quotation.oem_price === null ? null : Number(quotation.oem_price),
              quotation.final_price === null ? null : Number(quotation.final_price),
            ) ?? "—"}
            {achievedMargin(
              quotation.oem_price === null ? null : Number(quotation.oem_price),
              quotation.final_price === null ? null : Number(quotation.final_price),
            ) !== null ? "%" : ""}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-6 text-xs text-muted-ink">
          <span>PNC: {(quotation.pnc_status ?? "").replace(/_/g, " ")}</span>
          <span>Technical compliance: {quotation.technical_compliance === null ? "unknown" : quotation.technical_compliance ? "yes" : "no"}</span>
          <span>Commercial compliance: {quotation.commercial_compliance === null ? "unknown" : quotation.commercial_compliance ? "yes" : "no"}</span>
          <span>Format: {quotation.export_format ?? "—"}</span>
          {quotation.submitted_at ? <span>Submitted: {istDateString(quotation.submitted_at)}</span> : null}
        </div>
      </section>

      <section className="panel mt-6 p-4">
        <h2 className="font-medium">Two-level approval</h2>
        <p className="mt-1 text-sm">
          Group Head: <span className={ghApproved ? "text-clear" : "text-alert"}>{ghApproved ? "approved" : "pending"}</span>
          {" · "}Management: <span className={mgmtApproved ? "text-clear" : "text-alert"}>{mgmtApproved ? "approved" : "pending"}</span>
        </p>
        {isApprover(role) && (
          <div className="mt-3 flex flex-wrap gap-3">
            {!ghApproved && (role === "owner" || role === "group_head") && (
              <form action={recordApprovalAction} className="flex items-end gap-2">
                <input type="hidden" name="quotation_id" value={id} />
                <input type="hidden" name="level" value="group_head" />
                <input type="hidden" name="decision" value="approved" />
                <input name="note" placeholder="Group Head note" className="input mt-0" />
                <button type="submit" className="btn-primary">Group Head approve</button>
              </form>
            )}
            {ghApproved && !mgmtApproved && (role === "owner" || role === "management") && (
              <form action={recordApprovalAction} className="flex items-end gap-2">
                <input type="hidden" name="quotation_id" value={id} />
                <input type="hidden" name="level" value="management" />
                <input type="hidden" name="decision" value="approved" />
                <input name="note" placeholder="Management note" className="input mt-0" />
                <button type="submit" className="btn-primary">Management approve</button>
              </form>
            )}
          </div>
        )}
        <p className="mt-2 text-xs text-muted-ink">
          A quotation cannot be marked approved or won without a Group Head approval followed by a Management approval (enforced in the database).
        </p>
      </section>

      <section className="panel mt-6 p-4">
        <h2 className="font-medium">Post-submission status</h2>
        <form action={setQuotationStatusAction} className="mt-2 flex flex-wrap items-end gap-2 text-sm">
          <input type="hidden" name="quotation_id" value={id} />
          <select name="status" defaultValue={quotation.status ?? "submitted"} className="input mt-0 w-56">
            <option value="submitted">Submitted</option>
            <option value="clarification_requested">Clarification requested</option>
            <option value="technical_clarification">Technical clarification</option>
            <option value="commercial_negotiation">Commercial negotiation</option>
            <option value="awaiting_approval">Awaiting approval</option>
            <option value="won">Won</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button type="submit" className="btn-outline">Update status</button>
        </form>
        <LossCaptureForm quotationId={id} />
      </section>

      <section className="panel mt-6 p-4">
        <h2 className="font-medium">Edit quotation</h2>
        <EditQuotationForm
          defaults={{
            quotation_id: id,
            requirement_id: quotation.requirement_id,
            oem_id: quotation.oem_id,
            line_item_id: quotation.line_item_id,
            currency: quotation.currency,
            oem_quotation_number: quotation.oem_quotation_number,
            quotation_date: quotation.quotation_date,
            unit_price: quotation.unit_price === null ? null : Number(quotation.unit_price),
            quantity: quotation.quantity === null ? null : Number(quotation.quantity),
            oem_price: quotation.oem_price === null ? null : Number(quotation.oem_price),
            freight_amount: quotation.freight_amount === null ? null : Number(quotation.freight_amount),
            gst_amount: quotation.gst_amount === null ? null : Number(quotation.gst_amount),
            discount_amount: quotation.discount_amount === null ? null : Number(quotation.discount_amount),
            validity_days: quotation.validity_days,
            internal_notes: quotation.internal_notes,
            target_margin_percentage: quotation.target_margin_percentage === null ? null : Number(quotation.target_margin_percentage),
            recommended_price: quotation.recommended_price === null ? null : Number(quotation.recommended_price),
            final_price: quotation.final_price === null ? null : Number(quotation.final_price),
            delivery_terms: quotation.delivery_terms,
            lead_time_days: quotation.lead_time_days,
            payment_terms: quotation.payment_terms,
            export_format: quotation.export_format,
            pnc_status: quotation.pnc_status,
            technical_compliance: quotation.technical_compliance,
            commercial_compliance: quotation.commercial_compliance,
          }}
        />
      </section>

      <section className="panel mt-6 p-4">
        <h2 className="font-medium">Past-bid intelligence</h2>
        <p className="text-xs text-muted-ink">Comparable history by part number, agency or product type.</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <BidList title={`Same part number${partNumber ? ` (${partNumber})` : ""}`} rows={partRows} />
          <BidList title="Same agency" rows={agency.data ?? []} />
          <BidList title="Same product type" rows={type.data ?? []} />
        </div>
      </section>

      <section className="panel mt-6 p-4">
        <h2 className="font-medium">Version history</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {versions.data?.map((v) => (
            <li key={v.version} className="flex justify-between border-b border-hairline py-1">
              <span className="mono">v{v.version}</span>
              <span className="text-muted-ink">{istDateString(v.created_at)}</span>
            </li>
          ))}
          {versions.data?.length === 0 && <li className="text-muted-ink">No snapshots yet.</li>}
        </ul>
      </section>
    </AppShell>
  );
}
