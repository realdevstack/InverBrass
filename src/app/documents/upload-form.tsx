"use client";

import { useActionState } from "react";

import { uploadDocumentAction, type DocumentFormState } from "@/app/documents/actions";

const initial: DocumentFormState = {};
const field = "mt-1 w-full rounded border border-black/20 bg-white px-2 py-1.5 text-sm";
const label = "block text-xs font-medium text-muted-ink";

export function DocumentUploadForm({
  pos,
  requirements,
  oems,
}: {
  pos: Array<{ id: string; label: string }>;
  requirements: Array<{ id: string; label: string }>;
  oems: Array<{ id: string; label: string }>;
}) {
  const [state, formAction, pending] = useActionState(uploadDocumentAction, initial);
  return (
    <form action={formAction} className="mt-3 grid gap-3 sm:grid-cols-4">
      <div>
        <label className={label} htmlFor="document_type">Type</label>
        <select id="document_type" name="document_type" defaultValue="other" className={field}>
          <option value="rcma">RCMA</option>
          <option value="cemilac">CEMILAC</option>
          <option value="dgqa">DGQA</option>
          <option value="lcso">LCSO</option>
          <option value="mil">MIL</option>
          <option value="test_certificate">Test certificate</option>
          <option value="delivery_challan">Delivery challan</option>
          <option value="lr_copy">LR copy</option>
          <option value="payment_proof">Payment proof</option>
          <option value="po_copy">PO copy</option>
          <option value="invoice_copy">Invoice copy</option>
          <option value="pdi_report">PDI report</option>
          <option value="proof_of_delivery">Proof of delivery</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <label className={label} htmlFor="purchase_order_id">Linked PO</label>
        <select id="purchase_order_id" name="purchase_order_id" className={field}>
          <option value="">(none)</option>
          {pos.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={label} htmlFor="requirement_id">Linked requirement</label>
        <select id="requirement_id" name="requirement_id" className={field}>
          <option value="">(none)</option>
          {requirements.map((r) => (
            <option key={r.id} value={r.id}>{r.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={label} htmlFor="oem_id">Linked OEM</label>
        <select id="oem_id" name="oem_id" className={field}>
          <option value="">(none)</option>
          {oems.map((o) => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={label} htmlFor="title">Title</label>
        <input id="title" name="title" className={field} />
      </div>
      <div>
        <label className={label} htmlFor="issue_date">Issue date</label>
        <input id="issue_date" name="issue_date" type="date" className={field} />
      </div>
      <div>
        <label className={label} htmlFor="expiry_date">Expiry date</label>
        <input id="expiry_date" name="expiry_date" type="date" className={field} />
      </div>
      <div>
        <label className={label} htmlFor="file">File (max 50 MB)</label>
        <input id="file" name="file" type="file" required className={field} />
      </div>
      <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">
        {pending ? "Uploading…" : "Upload document"}
      </button>
      {state.error && <p className="text-xs text-risk sm:col-span-4">{state.error}</p>}
      {state.ok && <p className="text-xs text-clear sm:col-span-4">Document uploaded and linked.</p>}
      <p className="text-xs text-muted-ink sm:col-span-4">
        Every document must trace to a PO (and through it the requirement), a requirement, or an OEM. The database refuses a floating document.
      </p>
    </form>
  );
}
