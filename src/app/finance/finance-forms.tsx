"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import {
  createCommissionAction,
  createInvoiceAction,
  recordDeliveryAction,
  recordPaymentAction,
  type FinanceFormState,
} from "@/app/finance/actions";

const initial: FinanceFormState = {};
const field = "mt-1 w-full rounded border border-black/20 bg-white px-2 py-1.5 text-sm";
const label = "block text-xs font-medium text-muted-ink";

export type InvoiceOption = {
  poId: string;
  pdiId: string;
  label: string;
  customer: string;
  oemId: string | null;
  quantityOrdered: number;
  unitPrice: number;
};

export function InvoiceForm({ options }: { options: InvoiceOption[] }) {
  const [state, formAction, pending] = useActionState(createInvoiceAction, initial);
  const [selectedId, setSelectedId] = useState(options[0]?.poId ?? "");
  const selected = options.find((o) => o.poId === selectedId);

  return (
    <form action={formAction} className="mt-4 space-y-4">
      {state.error && <p role="alert" className="rounded border border-risk/40 bg-risk/10 p-3 text-sm text-risk">{state.error}</p>}
      {state.ok && state.fieldErrors?.created_id && (
        <p className="rounded border border-clear/40 bg-clear/10 p-3 text-sm">Invoice created.</p>
      )}
      <section className="panel grid gap-3 p-4 sm:grid-cols-3">
        <div className="sm:col-span-3">
          <label className={label} htmlFor="poId">Purchase order with a cleared PDI *</label>
          <select id="poId" value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className={field}>
            {options.map((o) => (
              <option key={o.poId} value={o.poId}>{o.label}</option>
            ))}
          </select>
        </div>
        <input type="hidden" name="purchase_order_id" value={selected?.poId ?? ""} />
        <input type="hidden" name="pdi_id" value={selected?.pdiId ?? ""} />
        <div>
          <label className={label} htmlFor="invoice_number">Invoice number *</label>
          <input id="invoice_number" name="invoice_number" required className={field} />
        </div>
        <div>
          <label className={label} htmlFor="invoice_date">Invoice date *</label>
          <input id="invoice_date" name="invoice_date" type="date" required className={field} />
        </div>
        <div>
          <label className={label} htmlFor="quantity_invoiced">Quantity invoiced *</label>
          <input id="quantity_invoiced" name="quantity_invoiced" type="number" step="0.001" min="0.001" required defaultValue={selected?.quantityOrdered ?? ""} key={`q-${selectedId}`} className={field} />
        </div>
        <div>
          <label className={label} htmlFor="net_amount">Net amount *</label>
          <input id="net_amount" name="net_amount" type="number" step="0.01" min="0" required className={field} />
        </div>
        <div>
          <label className={label} htmlFor="gst_amount">GST amount</label>
          <input id="gst_amount" name="gst_amount" type="number" step="0.01" min="0" defaultValue="0" className={field} />
        </div>
        <div>
          <label className={label} htmlFor="gross_amount">Gross amount *</label>
          <input id="gross_amount" name="gross_amount" type="number" step="0.01" min="0" required className={field} />
        </div>
        <div>
          <label className={label} htmlFor="balance_quantity">Balance quantity</label>
          <input id="balance_quantity" name="balance_quantity" type="number" step="0.001" min="0" defaultValue="0" className={field} />
        </div>
        <div>
          <label className={label} htmlFor="dispatch_date">Dispatch date</label>
          <input id="dispatch_date" name="dispatch_date" type="date" className={field} />
        </div>
        <div>
          <label className={label} htmlFor="lr_awb_number">LR / AWB number</label>
          <input id="lr_awb_number" name="lr_awb_number" className={field} />
        </div>
        <div>
          <label className={label} htmlFor="courier_details">Courier details</label>
          <input id="courier_details" name="courier_details" className={field} />
        </div>
        <div>
          <label className={label} htmlFor="e_way_bill_number">E-way bill number</label>
          <input id="e_way_bill_number" name="e_way_bill_number" className={field} />
        </div>
        <div>
          <label className={label} htmlFor="payment_due_date">Payment due date</label>
          <input id="payment_due_date" name="payment_due_date" type="date" className={field} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_full_invoice" defaultChecked /> Full invoice
        </label>
        <div className="sm:col-span-3">
          <label className={label} htmlFor="documents_submitted">Documents submitted</label>
          <input id="documents_submitted" name="documents_submitted" className={field} />
        </div>
      </section>
      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">{pending ? "Saving…" : "Raise invoice"}</button>
        <Link href="/finance" className="btn-outline">Cancel</Link>
      </div>
      <p className="text-xs text-muted-ink">Invoicing is refused by the database until a PDI for the same PO is cleared.</p>
    </form>
  );
}

export function PaymentForm({
  invoiceId,
  invoiceAmount,
  grossAmount,
  alreadyPaid,
  customer,
  oemId,
}: {
  invoiceId: string;
  invoiceAmount: number;
  grossAmount: number;
  alreadyPaid: number;
  customer: string;
  oemId: string | null;
}) {
  const [state, formAction, pending] = useActionState(recordPaymentAction, initial);
  return (
    <form action={formAction} className="mt-3 grid gap-2 sm:grid-cols-4">
      <input type="hidden" name="oem_invoice_id" value={invoiceId} />
      <input type="hidden" name="oem_id" value={oemId ?? ""} />
      <input type="hidden" name="invoice_amount" value={grossAmount} />
      <input type="hidden" name="customer" value={customer} />
      <div>
        <label className={label} htmlFor="payment_reference">Reference</label>
        <input id="payment_reference" name="payment_reference" className={field} />
      </div>
      <div>
        <label className={label} htmlFor="amount_received">Amount received *</label>
        <input id="amount_received" name="amount_received" type="number" step="0.01" min="0.01" required className={field} />
      </div>
      <div>
        <label className={label} htmlFor="payment_date">Payment date *</label>
        <input id="payment_date" name="payment_date" type="date" required className={field} />
      </div>
      <div>
        <label className={label} htmlFor="mode">Mode</label>
        <select id="mode" name="mode" defaultValue="rtgs" className={field}>
          <option value="rtgs">RTGS</option>
          <option value="neft">NEFT</option>
          <option value="wire">Wire</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <label className={label} htmlFor="terms">Terms</label>
        <input id="terms" name="terms" className={field} />
      </div>
      <div>
        <label className={label} htmlFor="followup_status">Follow-up</label>
        <select id="followup_status" name="followup_status" defaultValue="none" className={field}>
          <option value="none">None</option>
          <option value="reminded">Reminded</option>
          <option value="escalated">Escalated</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>
      <div className="sm:col-span-3">
        <label className={label} htmlFor="payment_remarks">Remarks</label>
        <input id="payment_remarks" name="remarks" className={field} />
      </div>
      <button type="submit" disabled={pending} className="btn-outline self-end disabled:opacity-60">{pending ? "Saving…" : "Record payment"}</button>
      <p className="text-xs text-muted-ink sm:col-span-4">
        Invoice {invoiceAmount.toLocaleString("en-IN")} · gross {grossAmount.toLocaleString("en-IN")} · already paid {alreadyPaid.toLocaleString("en-IN")}
      </p>
      {state.error && <p className="text-xs text-risk sm:col-span-4">{state.error}</p>}
      {state.ok && <p className="text-xs text-clear sm:col-span-4">Payment recorded; balance updated.</p>}
    </form>
  );
}

export function DeliveryForm({ invoiceId, invoicedQuantity }: { invoiceId: string; invoicedQuantity: number }) {
  const [state, formAction, pending] = useActionState(recordDeliveryAction, initial);
  return (
    <form action={formAction} className="mt-3 grid gap-2 sm:grid-cols-4">
      <input type="hidden" name="oem_invoice_id" value={invoiceId} />
      <div>
        <label className={label} htmlFor="delivery_reference">Reference</label>
        <input id="delivery_reference" name="delivery_reference" className={field} />
      </div>
      <div>
        <label className={label} htmlFor="delivery_date">Delivery date</label>
        <input id="delivery_date" name="delivery_date" type="date" className={field} />
      </div>
      <div>
        <label className={label} htmlFor="quantity_delivered">Quantity delivered *</label>
        <input id="quantity_delivered" name="quantity_delivered" type="number" step="0.001" min="0.001" required className={field} />
      </div>
      <div>
        <label className={label} htmlFor="location">Location</label>
        <input id="location" name="location" className={field} />
      </div>
      <div>
        <label className={label} htmlFor="delivery_status">Delivery status</label>
        <select id="delivery_status" name="delivery_status" defaultValue="in_transit" className={field}>
          <option value="in_transit">In transit</option>
          <option value="delivered">Delivered</option>
          <option value="partially_delivered">Partially delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <div>
        <label className={label} htmlFor="material_acceptance_status">Acceptance</label>
        <select id="material_acceptance_status" name="material_acceptance_status" defaultValue="pending" className={field}>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="partially_accepted">Partially accepted</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      <div>
        <label className={label} htmlFor="grn_number">GRN number</label>
        <input id="grn_number" name="grn_number" className={field} />
      </div>
      <div>
        <label className={label} htmlFor="closure_status">Closure status</label>
        <select id="closure_status" name="closure_status" defaultValue="pending" className={field}>
          <option value="pending">Pending</option>
          <option value="closed">Closed</option>
        </select>
      </div>
      <div className="sm:col-span-3">
        <label className={label} htmlFor="delivery_remarks">Remarks</label>
        <input id="delivery_remarks" name="remarks" className={field} />
      </div>
      <button type="submit" disabled={pending} className="btn-outline self-end disabled:opacity-60">{pending ? "Saving…" : "Record delivery"}</button>
      <p className="text-xs text-muted-ink sm:col-span-4">Invoiced quantity {invoicedQuantity.toLocaleString("en-IN")}; outstanding balance is kept visible.</p>
      {state.error && <p className="text-xs text-risk sm:col-span-4">{state.error}</p>}
      {state.ok && <p className="text-xs text-clear sm:col-span-4">Delivery recorded.</p>}
    </form>
  );
}

export function CommissionForm({
  invoiceId,
  oemId,
  customer,
  baseAmount,
  defaultPercentage,
}: {
  invoiceId: string;
  oemId: string | null;
  customer: string;
  baseAmount: number;
  defaultPercentage: number;
}) {
  const [state, formAction, pending] = useActionState(createCommissionAction, initial);
  return (
    <form action={formAction} className="mt-3 grid gap-2 sm:grid-cols-4">
      <input type="hidden" name="oem_invoice_id" value={invoiceId} />
      <input type="hidden" name="oem_id" value={oemId ?? ""} />
      <input type="hidden" name="customer_name" value={customer} />
      <input type="hidden" name="base_invoice_amount" value={baseAmount} />
      <div>
        <label className={label} htmlFor="commission_invoice_number">Commission invoice number *</label>
        <input id="commission_invoice_number" name="commission_invoice_number" required className={field} />
      </div>
      <div>
        <label className={label} htmlFor="commission_percentage">Commission % *</label>
        <input id="commission_percentage" name="commission_percentage" type="number" step="0.01" min="0" max="100" required defaultValue={defaultPercentage} className={field} />
      </div>
      <div>
        <label className={label} htmlFor="commission_amount">Commission amount (blank = auto)</label>
        <input id="commission_amount" name="commission_amount" type="number" step="0.01" min="0" className={field} />
      </div>
      <div>
        <label className={label} htmlFor="payment_status">Status</label>
        <select id="payment_status" name="payment_status" defaultValue="raised" className={field}>
          <option value="draft">Draft</option>
          <option value="raised">Raised</option>
          <option value="submitted">Submitted</option>
          <option value="partially_paid">Partially paid</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>
      <div>
        <label className={label} htmlFor="gst_amount">GST (blank = 18%)</label>
        <input id="gst_amount" name="gst_amount" type="number" step="0.01" min="0" className={field} />
      </div>
      <div>
        <label className={label} htmlFor="tds_amount">TDS (blank = 10%)</label>
        <input id="tds_amount" name="tds_amount" type="number" step="0.01" min="0" className={field} />
      </div>
      <div>
        <label className={label} htmlFor="commission_invoice_date">Invoice date</label>
        <input id="commission_invoice_date" name="invoice_date" type="date" className={field} />
      </div>
      <div>
        <label className={label} htmlFor="commission_due_date">Payment due date</label>
        <input id="commission_due_date" name="payment_due_date" type="date" className={field} />
      </div>
      <div className="sm:col-span-2">
        <label className={label} htmlFor="commission_remarks">Remarks</label>
        <input id="commission_remarks" name="remarks" className={field} />
      </div>
      <button type="submit" disabled={pending} className="btn-outline self-end disabled:opacity-60">{pending ? "Saving…" : "Raise commission"}</button>
      <p className="text-xs text-muted-ink sm:col-span-4">
        Commission is computed on the OEM invoice value and refused by the database until the OEM invoice is paid.
      </p>
      {state.error && <p className="text-xs text-risk sm:col-span-4">{state.error}</p>}
      {state.ok && <p className="text-xs text-clear sm:col-span-4">Commission invoice raised.</p>}
    </form>
  );
}
