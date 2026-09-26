"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  addCustomerContactAction,
  createCustomerAction,
  createProductAction,
  type MasterFormState,
} from "@/app/master/actions";

const initial: MasterFormState = {};
const field = "mt-1 w-full rounded border border-black/20 bg-white px-2 py-1.5 text-sm";
const label = "block text-xs font-medium text-muted-ink";

const CERTIFICATIONS = ["RCMA", "CEMILAC", "DGQA", "LCSO", "MIL"];

export function CustomerCreateForm() {
  const [state, formAction, pending] = useActionState(createCustomerAction, initial);
  return (
    <form action={formAction} className="mt-4 space-y-4">
      {state.error && <p role="alert" className="rounded border border-risk/40 bg-risk/10 p-3 text-sm text-risk">{state.error}</p>}
      <section className="panel grid gap-3 p-4 sm:grid-cols-3">
        <div>
          <label className={label} htmlFor="name">Customer name *</label>
          <input id="name" name="name" required className={field} />
        </div>
        <div><label className={label} htmlFor="division">Division</label><input id="division" name="division" className={field} /></div>
        <div><label className={label} htmlFor="sub_division">Sub-division</label><input id="sub_division" name="sub_division" className={field} /></div>
        <div><label className={label} htmlFor="gst_number">GST number</label><input id="gst_number" name="gst_number" className={field} /></div>
        <div><label className={label} htmlFor="gem_registration">GeM registration</label><input id="gem_registration" name="gem_registration" className={field} /></div>
        <div><label className={label} htmlFor="inverbrass_vendor_registration">Vendor registration no.</label><input id="inverbrass_vendor_registration" name="inverbrass_vendor_registration" className={field} /></div>
        <div><label className={label} htmlFor="portal_login_mapping">Portal login mapping</label><input id="portal_login_mapping" name="portal_login_mapping" className={field} /></div>
        <div><label className={label} htmlFor="payment_terms">Payment terms</label><input id="payment_terms" name="payment_terms" className={field} /></div>
        <div><label className={label} htmlFor="approval_requirements">Approval requirements</label><input id="approval_requirements" name="approval_requirements" className={field} /></div>
        <div className="sm:col-span-3"><label className={label} htmlFor="billing_address">Billing address</label><input id="billing_address" name="billing_address" className={field} /></div>
        <div className="sm:col-span-3"><label className={label} htmlFor="delivery_address">Delivery address</label><input id="delivery_address" name="delivery_address" className={field} /></div>
      </section>
      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">{pending ? "Saving…" : "Create customer"}</button>
        <Link href="/customers" className="btn-outline">Cancel</Link>
      </div>
    </form>
  );
}

export function ContactForm({ customerId }: { customerId: string }) {
  const [state, formAction, pending] = useActionState(addCustomerContactAction, initial);
  return (
    <form action={formAction} className="mt-3 grid gap-2 sm:grid-cols-4">
      <input type="hidden" name="customer_id" value={customerId} />
      <div><label className={label} htmlFor="c_name">Name *</label><input id="c_name" name="name" required className={field} /></div>
      <div><label className={label} htmlFor="c_desig">Designation</label><input id="c_desig" name="designation" className={field} /></div>
      <div><label className={label} htmlFor="c_email">Email</label><input id="c_email" name="email" type="email" className={field} /></div>
      <div><label className={label} htmlFor="c_phone">Phone</label><input id="c_phone" name="phone" className={field} /></div>
      <label className="flex items-center gap-2 text-sm sm:col-span-3"><input type="checkbox" name="is_primary" /> Primary contact</label>
      <button type="submit" disabled={pending} className="btn-outline disabled:opacity-60">{pending ? "Adding…" : "Add contact"}</button>
      {state.error && <p className="text-xs text-risk sm:col-span-4">{state.error}</p>}
      {state.ok && <p className="text-xs text-clear sm:col-span-4">Contact added.</p>}
    </form>
  );
}

export function ProductCreateForm({ oems }: { oems: Array<{ id: string; name: string }> }) {
  const [state, formAction, pending] = useActionState(createProductAction, initial);
  return (
    <form action={formAction} className="mt-4 space-y-4">
      {state.error && <p role="alert" className="rounded border border-risk/40 bg-risk/10 p-3 text-sm text-risk">{state.error}</p>}
      <section className="panel grid gap-3 p-4 sm:grid-cols-3">
        <div><label className={label} htmlFor="part_number">Part number (OEM) *</label><input id="part_number" name="part_number" required className={field} /></div>
        <div><label className={label} htmlFor="client_part_number">Client part number</label><input id="client_part_number" name="client_part_number" className={field} /></div>
        <div><label className={label} htmlFor="hsn_code">HSN code</label><input id="hsn_code" name="hsn_code" className={field} /></div>
        <div className="sm:col-span-3"><label className={label} htmlFor="description">Description</label><input id="description" name="description" className={field} /></div>
        <div>
          <label className={label} htmlFor="oem_id">OEM mapping</label>
          <select id="oem_id" name="oem_id" className={field}>
            <option value="">(none)</option>
            {oems.map((o) => (<option key={o.id} value={o.id}>{o.name}</option>))}
          </select>
        </div>
        <div><label className={label} htmlFor="product_category">Product category</label><input id="product_category" name="product_category" className={field} /></div>
        <div><label className={label} htmlFor="uom">Unit of measurement</label><input id="uom" name="uom" className={field} /></div>
        <div><label className={label} htmlFor="lead_time_days">Lead time (days)</label><input id="lead_time_days" name="lead_time_days" type="number" min="0" className={field} /></div>
        <div><label className={label} htmlFor="moq">MOQ</label><input id="moq" name="moq" type="number" step="0.001" min="0" className={field} /></div>
        <div><label className={label} htmlFor="standard_price">Standard price</label><input id="standard_price" name="standard_price" type="number" step="0.01" min="0" className={field} /></div>
        <div><label className={label} htmlFor="currency">Currency</label><input id="currency" name="currency" defaultValue="INR" className={field} /></div>
        <div><label className={label} htmlFor="shelf_life">Shelf life</label><input id="shelf_life" name="shelf_life" className={field} /></div>
        <div><label className={label} htmlFor="export_restriction">Export restriction</label><input id="export_restriction" name="export_restriction" className={field} /></div>
        <div className="sm:col-span-3"><label className={label} htmlFor="technical_specifications">Technical specifications</label><textarea id="technical_specifications" name="technical_specifications" rows={2} className={field} /></div>
        <fieldset className="sm:col-span-3">
          <legend className={label}>Compliance certifications</legend>
          <div className="mt-1 flex flex-wrap gap-4 text-sm">
            {CERTIFICATIONS.map((c) => (
              <label key={c} className="flex items-center gap-2">
                <input type="checkbox" name="compliance_certifications" value={c} /> {c}
              </label>
            ))}
          </div>
        </fieldset>
      </section>
      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">{pending ? "Saving…" : "Create part"}</button>
        <Link href="/products" className="btn-outline">Cancel</Link>
      </div>
    </form>
  );
}
