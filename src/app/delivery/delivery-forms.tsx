"use client";

import { useActionState } from "react";

import {
  addMaterialReadinessAction,
  createPdiAction,
  requestExtensionAction,
  type DeliveryFormState,
} from "@/app/delivery/actions";

const initial: DeliveryFormState = {};
const field = "mt-1 w-full rounded border border-black/20 bg-white px-2 py-1.5 text-sm";
const label = "block text-xs font-medium text-muted-ink";

function StatusOptions() {
  return (
    <>
      <option value="not_started">Not started</option>
      <option value="in_production">In production</option>
      <option value="ready">Ready</option>
      <option value="qc_pending">QC pending</option>
      <option value="qc_passed">QC passed</option>
      <option value="qc_failed">QC failed</option>
    </>
  );
}

export function MaterialReadinessForm({ purchaseOrderId }: { purchaseOrderId: string }) {
  const [state, formAction, pending] = useActionState(addMaterialReadinessAction, initial);
  return (
    <form action={formAction} className="mt-3 grid gap-3 sm:grid-cols-4">
      <input type="hidden" name="purchase_order_id" value={purchaseOrderId} />
      <div>
        <label className={label} htmlFor="production_status">Production status</label>
        <select id="production_status" name="production_status" defaultValue="in_production" className={field}><StatusOptions /></select>
      </div>
      <div>
        <label className={label} htmlFor="qc_status">Internal QC status</label>
        <select id="qc_status" name="qc_status" defaultValue="not_started" className={field}><StatusOptions /></select>
      </div>
      <div>
        <label className={label} htmlFor="batch_number">Batch number</label>
        <input id="batch_number" name="batch_number" className={field} />
      </div>
      <div>
        <label className={label} htmlFor="serial_number">Serial number</label>
        <input id="serial_number" name="serial_number" className={field} />
      </div>
      <div>
        <label className={label} htmlFor="quantity_ready">Quantity ready</label>
        <input id="quantity_ready" name="quantity_ready" type="number" step="0.001" min="0" className={field} />
      </div>
      <div>
        <label className={label} htmlFor="tentative_pdi_date">Tentative PDI date</label>
        <input id="tentative_pdi_date" name="tentative_pdi_date" type="date" className={field} />
      </div>
      <div>
        <label className={label} htmlFor="expected_completion_date">Expected completion</label>
        <input id="expected_completion_date" name="expected_completion_date" type="date" className={field} />
      </div>
      <div className="sm:col-span-2">
        <label className={label} htmlFor="remarks">Remarks</label>
        <input id="remarks" name="remarks" className={field} />
      </div>
      <button type="submit" disabled={pending} className="btn-outline disabled:opacity-60">Add readiness update</button>
      {state.error && <p className="text-xs text-risk sm:col-span-4">{state.error}</p>}
      {state.ok && <p className="text-xs text-clear sm:col-span-4">Readiness recorded.</p>}
    </form>
  );
}

export function PdiForm({
  purchaseOrderId,
  lineItems,
}: {
  purchaseOrderId: string;
  lineItems: Array<{ id: string; label: string }>;
}) {
  const [state, formAction, pending] = useActionState(createPdiAction, initial);
  return (
    <form action={formAction} className="mt-3 grid gap-3 sm:grid-cols-4">
      <input type="hidden" name="purchase_order_id" value={purchaseOrderId} />
      <div>
        <label className={label} htmlFor="pdi_line_item">Linked item</label>
        <select id="pdi_line_item" name="line_item_id" className={field}>
          <option value="">(none)</option>
          {lineItems.map((l) => (
            <option key={l.id} value={l.id}>{l.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={label} htmlFor="inspection_type">Inspection type</label>
        <select id="inspection_type" name="inspection_type" defaultValue="physical" className={field}>
          <option value="physical">Physical</option>
          <option value="vc">VC</option>
        </select>
      </div>
      <div>
        <label className={label} htmlFor="inspection_agency">Agency</label>
        <select id="inspection_agency" name="inspection_agency" defaultValue="dgqa" className={field}>
          <option value="dgqa">DGQA</option>
          <option value="client_agency">Client agency</option>
          <option value="internal">Internal</option>
          <option value="third_party">Third party</option>
        </select>
      </div>
      <div>
        <label className={label} htmlFor="scheduled_date">Scheduled date</label>
        <input id="scheduled_date" name="scheduled_date" type="date" className={field} />
      </div>
      <div>
        <label className={label} htmlFor="conducted_date">Conducted date</label>
        <input id="conducted_date" name="conducted_date" type="date" className={field} />
      </div>
      <div>
        <label className={label} htmlFor="quantity_offered">Offered *</label>
        <input id="quantity_offered" name="quantity_offered" type="number" step="0.001" min="0" required className={field} />
      </div>
      <div>
        <label className={label} htmlFor="quantity_cleared">Cleared</label>
        <input id="quantity_cleared" name="quantity_cleared" type="number" step="0.001" min="0" defaultValue="0" className={field} />
      </div>
      <div>
        <label className={label} htmlFor="quantity_rejected">Rejected</label>
        <input id="quantity_rejected" name="quantity_rejected" type="number" step="0.001" min="0" defaultValue="0" className={field} />
      </div>
      <div>
        <label className={label} htmlFor="dispatch_clearance">Dispatch clearance</label>
        <select id="dispatch_clearance" name="dispatch_clearance" defaultValue="pending" className={field}>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="hold">Hold</option>
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className={label} htmlFor="inspector_details">Inspector details</label>
        <input id="inspector_details" name="inspector_details" className={field} />
      </div>
      <label className="flex items-end gap-2 text-sm">
        <input type="checkbox" name="re_pdi_required" /> Re-PDI required
      </label>
      <div className="sm:col-span-4">
        <label className={label} htmlFor="rejection_remarks">Rejection remarks</label>
        <input id="rejection_remarks" name="rejection_remarks" className={field} />
      </div>
      <button type="submit" disabled={pending} className="btn-outline disabled:opacity-60">Record PDI</button>
      {state.error && <p className="text-xs text-risk sm:col-span-4">{state.error}</p>}
      {state.ok && <p className="text-xs text-clear sm:col-span-4">PDI recorded.</p>}
    </form>
  );
}

export function ExtensionRequestForm({ purchaseOrderId, existingNote }: { purchaseOrderId: string; existingNote: string | null }) {
  const [state, formAction, pending] = useActionState(requestExtensionAction, initial);
  return (
    <form action={formAction} className="mt-3 grid gap-2 sm:grid-cols-4">
      <input type="hidden" name="purchase_order_id" value={purchaseOrderId} />
      <div className="sm:col-span-3">
        <label className={label} htmlFor="extension_note">Extension request note (raised before the due date)</label>
        <textarea id="extension_note" name="extension_note" rows={2} defaultValue={existingNote ?? ""} className={field} />
      </div>
      <button type="submit" disabled={pending} className="btn-outline self-end disabled:opacity-60">
        {existingNote ? "Update request" : "Request extension"}
      </button>
      {state.error && <p className="text-xs text-risk sm:col-span-4">{state.error}</p>}
      {state.ok && <p className="text-xs text-clear sm:col-span-4">Extension request recorded.</p>}
    </form>
  );
}
