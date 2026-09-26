"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { createPurchaseOrderAction, type OrderFormState } from "@/app/orders/actions";

const initial: OrderFormState = {};
const field = "mt-1 w-full rounded border border-black/20 bg-white px-2 py-1.5 text-sm";
const label = "block text-xs font-medium text-muted-ink";

export type QuotationOption = {
  id: string;
  label: string;
  customer: string;
  oemId: string | null;
  lineItemId: string | null;
  partNumber: string | null;
  finalPrice: number | null;
  leadTimeDays: number | null;
  paymentTerms: string | null;
  deliveryTerms: string | null;
};

export function PurchaseOrderForm({ quotations }: { quotations: QuotationOption[] }) {
  const [state, formAction, pending] = useActionState(createPurchaseOrderAction, initial);
  const [selectedId, setSelectedId] = useState(quotations[0]?.id ?? "");
  const selected = quotations.find((q) => q.id === selectedId);

  return (
    <form action={formAction} className="mt-4 space-y-4">
      {state.error && <p role="alert" className="rounded border border-risk/40 bg-risk/10 p-3 text-sm text-risk">{state.error}</p>}
      <section className="panel grid gap-3 p-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className={label} htmlFor="quotation_id">Approved quotation *</label>
          <select
            id="quotation_id"
            name="quotation_id"
            required
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className={field}
          >
            {quotations.map((q) => (
              <option key={q.id} value={q.id}>{q.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="po_number">PO number *</label>
          <input id="po_number" name="po_number" required className={field} />
        </div>
        <div>
          <label className={label} htmlFor="po_date">PO date *</label>
          <input id="po_date" name="po_date" type="date" required className={field} />
        </div>
        <div>
          <label className={label} htmlFor="customer">Customer *</label>
          <input id="customer" name="customer" required defaultValue={selected?.customer ?? ""} key={`cust-${selectedId}`} className={field} />
        </div>
        <div>
          <label className={label} htmlFor="part_number">Part number</label>
          <input id="part_number" name="part_number" defaultValue={selected?.partNumber ?? ""} key={`part-${selectedId}`} className={field} />
        </div>
        <input type="hidden" name="oem_id" value={selected?.oemId ?? ""} />
        <input type="hidden" name="line_item_id" value={selected?.lineItemId ?? ""} />
      </section>
      <section className="panel grid gap-3 p-4 sm:grid-cols-4">
        <div>
          <label className={label} htmlFor="quantity_ordered">Quantity ordered *</label>
          <input id="quantity_ordered" name="quantity_ordered" type="number" step="0.001" min="0.001" required className={field} />
        </div>
        <div>
          <label className={label} htmlFor="unit_price">Unit price *</label>
          <input id="unit_price" name="unit_price" type="number" step="0.01" min="0" required defaultValue={selected?.finalPrice ?? ""} key={`unit-${selectedId}`} className={field} />
        </div>
        <div>
          <label className={label} htmlFor="po_value">PO value *</label>
          <input id="po_value" name="po_value" type="number" step="0.01" min="0" required defaultValue={selected?.finalPrice ?? ""} key={`value-${selectedId}`} className={field} />
        </div>
        <div>
          <label className={label} htmlFor="taxes_gst">Taxes / GST</label>
          <input id="taxes_gst" name="taxes_gst" type="number" step="0.01" min="0" defaultValue="0" className={field} />
        </div>
        <div>
          <label className={label} htmlFor="delivery_schedule">Delivery schedule</label>
          <input id="delivery_schedule" name="delivery_schedule" defaultValue={selected?.deliveryTerms ?? ""} key={`del-${selectedId}`} className={field} />
        </div>
        <div>
          <label className={label} htmlFor="committed_deadline">Committed deadline</label>
          <input id="committed_deadline" name="committed_deadline" type="date" className={field} />
        </div>
        <div>
          <label className={label} htmlFor="pdi_mode">PDI mode</label>
          <select id="pdi_mode" name="pdi_mode" defaultValue="physical" className={field}>
            <option value="physical">Physical</option>
            <option value="vc">VC</option>
          </select>
        </div>
        <div>
          <label className={label} htmlFor="payment_terms">Payment terms</label>
          <input id="payment_terms" name="payment_terms" defaultValue={selected?.paymentTerms ?? ""} key={`pay-${selectedId}`} className={field} />
        </div>
        <div className="sm:col-span-4">
          <label className={label} htmlFor="documentation_required">Documentation required</label>
          <input id="documentation_required" name="documentation_required" className={field} />
        </div>
        <div className="sm:col-span-2">
          <label className={label} htmlFor="warranty_terms">Warranty terms</label>
          <input id="warranty_terms" name="warranty_terms" className={field} />
        </div>
        <div className="sm:col-span-2">
          <label className={label} htmlFor="pdi_inspector">PDI inspector (OEM &amp; client side)</label>
          <input id="pdi_inspector" name="pdi_inspector" className={field} />
        </div>
        <div className="sm:col-span-4">
          <label className={label} htmlFor="special_conditions">Special conditions / PO clauses</label>
          <input id="special_conditions" name="special_conditions" className={field} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="partial_delivery_allowed" defaultChecked /> Partial delivery allowed
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="pdi_required" defaultChecked /> PDI required
        </label>
      </section>
      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">
          {pending ? "Saving…" : "Create purchase order"}
        </button>
        <Link href="/orders" className="btn-outline">Cancel</Link>
      </div>
    </form>
  );
}
