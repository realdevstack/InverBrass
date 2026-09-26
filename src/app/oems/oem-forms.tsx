"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  addOemCertificationAction,
  addOemContactAction,
  createOemAction,
  type OemFormState,
} from "@/app/oems/actions";

const initial: OemFormState = {};
const inputClass = "mt-1 w-full rounded border border-black/20 bg-white px-3 py-2";
const labelClass = "block text-sm font-medium";

export function OemCreateForm() {
  const [state, formAction, pending] = useActionState(createOemAction, initial);
  return (
    <form action={formAction} className="mt-4 space-y-6">
      {state.error && (
        <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          {state.error}
        </p>
      )}
      <section className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="name">Name *</label>
          <input id="name" name="name" required className={inputClass} />
          {state.fieldErrors?.name && <p className="mt-1 text-xs text-red-700">{state.fieldErrors.name}</p>}
        </div>
        <div>
          <label className={labelClass} htmlFor="brand_product_category">Brand / product category</label>
          <input id="brand_product_category" name="brand_product_category" className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="country_of_origin">Country of origin</label>
          <input id="country_of_origin" name="country_of_origin" className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="lead_time_days">Lead time (days)</label>
          <input id="lead_time_days" name="lead_time_days" type="number" min="0" className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="product_portfolio">Product portfolio</label>
          <textarea id="product_portfolio" name="product_portfolio" rows={2} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="moq_rules">MOQ rules</label>
          <input id="moq_rules" name="moq_rules" className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="pricing_validity">Pricing validity</label>
          <input id="pricing_validity" name="pricing_validity" className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="freight_terms">Freight terms</label>
          <input id="freight_terms" name="freight_terms" className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="warranty_terms">Warranty terms</label>
          <input id="warranty_terms" name="warranty_terms" className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="payment_terms">Payment terms</label>
          <input id="payment_terms" name="payment_terms" className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="commission_percentage">Commission %</label>
          <input id="commission_percentage" name="commission_percentage" type="number" step="0.01" min="0" max="100" defaultValue="0" className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="nda_status">NDA / agreement status</label>
          <input id="nda_status" name="nda_status" className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="capacity">Declared capacity</label>
          <input id="capacity" name="capacity" type="number" step="0.001" min="0" className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="govt_vendor_list_status">Govt vendor-list status</label>
          <select id="govt_vendor_list_status" name="govt_vendor_list_status" defaultValue="unknown" className={inputClass}>
            <option value="unknown">Unknown</option>
            <option value="approved">Approved</option>
            <option value="not_approved">Not approved</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="govt_vendor_list_source">Status source</label>
          <input id="govt_vendor_list_source" name="govt_vendor_list_source" className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="bank_details">Bank details</label>
          <textarea id="bank_details" name="bank_details" rows={2} className={inputClass} />
        </div>
      </section>
      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="rounded bg-teal px-4 py-2 font-medium text-white disabled:opacity-60">
          {pending ? "Saving…" : "Create OEM"}
        </button>
        <Link href="/oems" className="rounded border border-black/20 px-4 py-2">Cancel</Link>
      </div>
    </form>
  );
}

export function ContactForm({ oemId }: { oemId: string }) {
  const [state, formAction, pending] = useActionState(addOemContactAction, initial);
  return (
    <form action={formAction} className="mt-3 grid gap-2 text-sm sm:grid-cols-4">
      <input type="hidden" name="oem_id" value={oemId} />
      <div>
        <label className="block text-xs font-medium" htmlFor="contact_name">Name *</label>
        <input id="contact_name" name="name" required className="mt-1 w-full rounded border border-black/20 bg-white px-2 py-1.5" />
      </div>
      <div>
        <label className="block text-xs font-medium" htmlFor="contact_designation">Designation</label>
        <input id="contact_designation" name="designation" className="mt-1 w-full rounded border border-black/20 bg-white px-2 py-1.5" />
      </div>
      <div>
        <label className="block text-xs font-medium" htmlFor="contact_email">Email</label>
        <input id="contact_email" name="email" type="email" className="mt-1 w-full rounded border border-black/20 bg-white px-2 py-1.5" />
      </div>
      <div>
        <label className="block text-xs font-medium" htmlFor="contact_phone">Phone</label>
        <input id="contact_phone" name="phone" className="mt-1 w-full rounded border border-black/20 bg-white px-2 py-1.5" />
      </div>
      <label className="flex items-center gap-2 text-xs sm:col-span-3">
        <input type="checkbox" name="is_primary" /> Primary contact
      </label>
      <button type="submit" disabled={pending} className="rounded border border-black/20 px-3 py-1.5 disabled:opacity-60">
        {pending ? "Adding…" : "Add contact"}
      </button>
      {state.error && <p className="text-xs text-red-700 sm:col-span-4">{state.error}</p>}
      {state.ok && <p className="text-xs text-green-800 sm:col-span-4">Contact added.</p>}
    </form>
  );
}

export function CertificationForm({ oemId }: { oemId: string }) {
  const [state, formAction, pending] = useActionState(addOemCertificationAction, initial);
  return (
    <form action={formAction} className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
      <input type="hidden" name="oem_id" value={oemId} />
      <div>
        <label className="block text-xs font-medium" htmlFor="cert_type">Type *</label>
        <input id="cert_type" name="certification_type" required className="mt-1 w-full rounded border border-black/20 bg-white px-2 py-1.5" />
      </div>
      <div>
        <label className="block text-xs font-medium" htmlFor="cert_reference">Reference</label>
        <input id="cert_reference" name="reference_number" className="mt-1 w-full rounded border border-black/20 bg-white px-2 py-1.5" />
      </div>
      <div>
        <label className="block text-xs font-medium" htmlFor="cert_issued_by">Issued by</label>
        <input id="cert_issued_by" name="issued_by" className="mt-1 w-full rounded border border-black/20 bg-white px-2 py-1.5" />
      </div>
      <div>
        <label className="block text-xs font-medium" htmlFor="cert_issue">Issue date</label>
        <input id="cert_issue" name="issue_date" type="date" className="mt-1 w-full rounded border border-black/20 bg-white px-2 py-1.5" />
      </div>
      <div>
        <label className="block text-xs font-medium" htmlFor="cert_expiry">Expiry date</label>
        <input id="cert_expiry" name="expiry_date" type="date" className="mt-1 w-full rounded border border-black/20 bg-white px-2 py-1.5" />
      </div>
      <div>
        <label className="block text-xs font-medium" htmlFor="cert_reminder">Reminder days</label>
        <input id="cert_reminder" name="reminder_days" type="number" min="0" defaultValue="90" className="mt-1 w-full rounded border border-black/20 bg-white px-2 py-1.5" />
      </div>
      <div className="sm:col-span-3">
        <button type="submit" disabled={pending} className="rounded border border-black/20 px-3 py-1.5 disabled:opacity-60">
          {pending ? "Adding…" : "Add certification"}
        </button>
      </div>
      {state.error && <p className="text-xs text-red-700 sm:col-span-3">{state.error}</p>}
      {state.ok && <p className="text-xs text-green-800 sm:col-span-3">Certification added.</p>}
    </form>
  );
}
