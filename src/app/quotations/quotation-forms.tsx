"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import {
  captureLossAction,
  createQuotationAction,
  updateQuotationAction,
  type QuotationFormState,
} from "@/app/quotations/actions";

const initial: QuotationFormState = {};
const field = "mt-1 w-full rounded border border-black/20 bg-white px-2 py-1.5 text-sm";
const label = "block text-xs font-medium text-muted-ink";

type ReqOption = { id: string; label: string };
type LineOption = { id: string; requirementId: string; label: string };
type OemOption = { id: string; label: string };

type QuotationDefaults = {
  quotation_id?: string;
  requirement_id?: string;
  oem_id?: string | null;
  line_item_id?: string | null;
  oem_quotation_number?: string | null;
  quotation_date?: string | null;
  unit_price?: number | null;
  quantity?: number | null;
  oem_price?: number | null;
  freight_amount?: number | null;
  gst_amount?: number | null;
  discount_amount?: number | null;
  target_margin_percentage?: number | null;
  recommended_price?: number | null;
  final_price?: number | null;
  currency?: string | null;
  validity_days?: number | null;
  internal_notes?: string | null;
  delivery_terms?: string | null;
  lead_time_days?: number | null;
  payment_terms?: string | null;
  export_format?: string | null;
  pnc_status?: string | null;
  technical_compliance?: boolean | null;
  commercial_compliance?: boolean | null;
};

function ComplianceSelect({ id, name, value }: { id: string; name: string; value: boolean | null | undefined }) {
  return (
    <select id={id} name={name} defaultValue={value === true ? "true" : value === false ? "false" : ""} className={field}>
      <option value="">Unknown</option>
      <option value="true">Yes</option>
      <option value="false">No</option>
    </select>
  );
}

function PricingFields({ defaults }: { defaults: QuotationDefaults }) {
  return (
    <>
      <div>
        <label className={label} htmlFor="oem_quotation_number">OEM quotation number</label>
        <input id="oem_quotation_number" name="oem_quotation_number" defaultValue={defaults.oem_quotation_number ?? ""} className={field} />
      </div>
      <div>
        <label className={label} htmlFor="quotation_date">Quotation date</label>
        <input id="quotation_date" name="quotation_date" type="date" defaultValue={defaults.quotation_date ?? ""} className={field} />
      </div>
      <div>
        <label className={label} htmlFor="unit_price">Unit price</label>
        <input id="unit_price" name="unit_price" type="number" step="0.01" min="0" defaultValue={defaults.unit_price ?? ""} className={field} />
      </div>
      <div>
        <label className={label} htmlFor="quantity">Quantity quoted</label>
        <input id="quantity" name="quantity" type="number" step="0.001" min="0" defaultValue={defaults.quantity ?? ""} className={field} />
      </div>
      <div>
        <label className={label} htmlFor="currency">Currency</label>
        <select id="currency" name="currency" defaultValue={defaults.currency ?? "INR"} className={field}>
          <option value="INR">INR</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
        </select>
      </div>
      <div>
        <label className={label} htmlFor="oem_price">OEM price</label>
        <input id="oem_price" name="oem_price" type="number" step="0.01" min="0" defaultValue={defaults.oem_price ?? ""} className={field} />
      </div>
      <div>
        <label className={label} htmlFor="discount_amount">Discount offered</label>
        <input id="discount_amount" name="discount_amount" type="number" step="0.01" min="0" defaultValue={defaults.discount_amount ?? ""} className={field} />
      </div>
      <div>
        <label className={label} htmlFor="freight_amount">Freight</label>
        <input id="freight_amount" name="freight_amount" type="number" step="0.01" min="0" defaultValue={defaults.freight_amount ?? ""} className={field} />
      </div>
      <div>
        <label className={label} htmlFor="gst_amount">GST</label>
        <input id="gst_amount" name="gst_amount" type="number" step="0.01" min="0" defaultValue={defaults.gst_amount ?? ""} className={field} />
      </div>
      <div>
        <label className={label} htmlFor="target_margin_percentage">Target margin %</label>
        <input id="target_margin_percentage" name="target_margin_percentage" type="number" step="0.01" defaultValue={defaults.target_margin_percentage ?? ""} className={field} />
      </div>
      <div>
        <label className={label} htmlFor="recommended_price">Recommended price (suggestion)</label>
        <input id="recommended_price" name="recommended_price" type="number" step="0.01" min="0" defaultValue={defaults.recommended_price ?? ""} className={field} />
      </div>
      <div>
        <label className={label} htmlFor="final_price">Final price (human decision)</label>
        <input id="final_price" name="final_price" type="number" step="0.01" min="0" defaultValue={defaults.final_price ?? ""} className={field} />
      </div>
    </>
  );
}

function TermsFields({ defaults }: { defaults: QuotationDefaults }) {
  return (
    <>
      <div>
        <label className={label} htmlFor="delivery_terms">Delivery terms</label>
        <input id="delivery_terms" name="delivery_terms" defaultValue={defaults.delivery_terms ?? ""} className={field} />
      </div>
      <div>
        <label className={label} htmlFor="lead_time_days">Lead time (days)</label>
        <input id="lead_time_days" name="lead_time_days" type="number" min="0" defaultValue={defaults.lead_time_days ?? ""} className={field} />
      </div>
      <div>
        <label className={label} htmlFor="payment_terms">Payment terms</label>
        <input id="payment_terms" name="payment_terms" defaultValue={defaults.payment_terms ?? ""} className={field} />
      </div>
      <div>
        <label className={label} htmlFor="export_format">Government format / agency layout</label>
        <input id="export_format" name="export_format" defaultValue={defaults.export_format ?? ""} className={field} />
      </div>
      <div>
        <label className={label} htmlFor="validity_days">Validity of quotation (days)</label>
        <input id="validity_days" name="validity_days" type="number" min="0" defaultValue={defaults.validity_days ?? ""} className={field} />
      </div>
      <div className="sm:col-span-2">
        <label className={label} htmlFor="internal_notes">Internal discussion notes</label>
        <textarea id="internal_notes" name="internal_notes" rows={2} defaultValue={defaults.internal_notes ?? ""} className={field} />
      </div>
      <div>
        <label className={label} htmlFor="pnc_status">PNC status</label>
        <select id="pnc_status" name="pnc_status" defaultValue={defaults.pnc_status ?? "not_applicable"} className={field}>
          <option value="not_applicable">Not applicable</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      <div>
        <label className={label} htmlFor="technical_compliance">Technical compliance</label>
        <ComplianceSelect id="technical_compliance" name="technical_compliance" value={defaults.technical_compliance} />
      </div>
      <div>
        <label className={label} htmlFor="commercial_compliance">Commercial compliance</label>
        <ComplianceSelect id="commercial_compliance" name="commercial_compliance" value={defaults.commercial_compliance} />
      </div>
    </>
  );
}

export function CreateQuotationForm({
  requirements,
  oems,
  lineItems,
  initialRequirementId,
}: {
  requirements: ReqOption[];
  oems: OemOption[];
  lineItems: LineOption[];
  initialRequirementId?: string;
}) {
  const [state, formAction, pending] = useActionState(createQuotationAction, initial);
  const [requirementId, setRequirementId] = useState(initialRequirementId ?? requirements[0]?.id ?? "");
  const filteredLines = lineItems.filter((l) => l.requirementId === requirementId);

  return (
    <form action={formAction} className="mt-4 space-y-4">
      {state.error && <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900">{state.error}</p>}
      <section className="panel grid gap-3 p-4 sm:grid-cols-3">
        <div>
          <label className={label} htmlFor="requirement_id">Requirement *</label>
          <select
            id="requirement_id"
            name="requirement_id"
            required
            value={requirementId}
            onChange={(e) => setRequirementId(e.target.value)}
            className={field}
          >
            {requirements.map((r) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="oem_id">OEM</label>
          <select id="oem_id" name="oem_id" defaultValue={oems[0]?.id ?? ""} className={field}>
            <option value="">(none)</option>
            {oems.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="line_item_id">Line item</label>
          <select id="line_item_id" name="line_item_id" className={field}>
            <option value="">(whole requirement)</option>
            {filteredLines.map((l) => (
              <option key={l.id} value={l.id}>{l.label}</option>
            ))}
          </select>
        </div>
      </section>
      <section className="panel grid gap-3 p-4 sm:grid-cols-3">
        <PricingFields defaults={{}} />
        <TermsFields defaults={{}} />
      </section>
      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">
          {pending ? "Saving…" : "Create quotation"}
        </button>
        <Link href="/quotations" className="btn-outline">Cancel</Link>
      </div>
    </form>
  );
}

export function EditQuotationForm({ defaults }: { defaults: QuotationDefaults }) {
  const [state, formAction, pending] = useActionState(updateQuotationAction, initial);
  return (
    <form action={formAction} className="mt-3 space-y-4">
      <input type="hidden" name="quotation_id" value={defaults.quotation_id} />
      <input type="hidden" name="requirement_id" value={defaults.requirement_id} />
      <input type="hidden" name="oem_id" value={defaults.oem_id ?? ""} />
      <input type="hidden" name="line_item_id" value={defaults.line_item_id ?? ""} />
      {state.error && <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900">{state.error}</p>}
      <section className="grid gap-3 sm:grid-cols-3">
        <PricingFields defaults={defaults} />
        <TermsFields defaults={defaults} />
      </section>
      <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">
        {pending ? "Saving…" : "Save quotation"}
      </button>
      {state.ok && <span className="ml-3 text-sm text-clear">Saved.</span>}
    </form>
  );
}

export function LossCaptureForm({ quotationId }: { quotationId: string }) {
  const [state, formAction, pending] = useActionState(captureLossAction, initial);
  return (
    <form action={formAction} className="mt-3 grid gap-2 sm:grid-cols-4">
      <input type="hidden" name="quotation_id" value={quotationId} />
      <div>
        <label className={label} htmlFor="loss_reason">Loss reason</label>
        <select id="loss_reason" name="loss_reason" defaultValue="price" className={field}>
          <option value="price">Price</option>
          <option value="technical_non_compliance">Technical non-compliance</option>
          <option value="delivery_timeline">Delivery timeline</option>
          <option value="competitor_preference">Competitor preference</option>
          <option value="quantity_or_capacity">Quantity or capacity</option>
          <option value="cancelled">Cancelled</option>
          <option value="not_pursued">Not pursued</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <label className={label} htmlFor="l1_price">L1 (winning) price, if disclosed</label>
        <input id="l1_price" name="l1_price" type="number" step="0.01" min="0" className={field} />
      </div>
      <div>
        <label className={label} htmlFor="competitor">Competitor</label>
        <input id="competitor" name="competitor" className={field} />
      </div>
      <button type="submit" disabled={pending} className="btn-outline self-end disabled:opacity-60">
        {pending ? "Saving…" : "Mark lost"}
      </button>
      {state.error && <p className="text-xs text-risk sm:col-span-4">{state.error}</p>}
      {state.ok && <p className="text-xs text-clear sm:col-span-4">Loss captured.</p>}
    </form>
  );
}
