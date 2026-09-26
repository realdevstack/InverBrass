"use client";

import { useActionState } from "react";

import {
  addCommitmentAction,
  addSourcingResponseAction,
  createSourcingRequestAction,
  type SourcingFormState,
} from "@/app/sourcing/actions";

type Option = { id: string; label: string };

const initial: SourcingFormState = {};
const field = "mt-1 w-full rounded border border-black/20 bg-white px-2 py-1.5 text-sm";
const label = "block text-xs font-medium";

function Errors({ state }: { state: SourcingFormState }) {
  return (
    <>
      {state.error && <p className="w-full text-xs text-red-700">{state.error}</p>}
      {state.ok && <p className="w-full text-xs text-green-800">Saved.</p>}
    </>
  );
}

export function SourcingRequestForm({
  requirementId,
  oems,
  lineItems,
}: {
  requirementId: string;
  oems: Option[];
  lineItems: Option[];
}) {
  const [state, formAction, pending] = useActionState(createSourcingRequestAction, initial);
  return (
    <form action={formAction} className="mt-3 grid gap-2 sm:grid-cols-4">
      <input type="hidden" name="requirement_id" value={requirementId} />
      <div>
        <label className={label} htmlFor="sr_oem">OEM *</label>
        <select id="sr_oem" name="oem_id" required className={field}>
          {oems.map((o) => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={label} htmlFor="sr_line">Line item</label>
        <select id="sr_line" name="line_item_id" className={field}>
          <option value="">(whole requirement)</option>
          {lineItems.map((l) => (
            <option key={l.id} value={l.id}>{l.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={label} htmlFor="sr_channel">Channel</label>
        <select id="sr_channel" name="channel" defaultValue="email" className={field}>
          <option value="email">Email</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="phone">Phone</option>
          <option value="portal">Portal</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <label className={label} htmlFor="sr_subject">Subject</label>
        <input id="sr_subject" name="subject" className={field} />
      </div>
      <div className="sm:col-span-4">
        <label className={label} htmlFor="sr_message">Message</label>
        <textarea id="sr_message" name="message" rows={2} className={field} />
      </div>
      <button type="submit" disabled={pending} className="rounded border border-black/20 px-3 py-1.5 text-sm disabled:opacity-60 sm:col-span-1">
        {pending ? "Logging…" : "Log request"}
      </button>
      <Errors state={state} />
    </form>
  );
}

export function SourcingResponseForm({ requests }: { requests: Option[] }) {
  const [state, formAction, pending] = useActionState(addSourcingResponseAction, initial);
  return (
    <form action={formAction} className="grid gap-2 sm:grid-cols-5">
      <div>
        <label className={label} htmlFor="resp_request">Request *</label>
        <select id="resp_request" name="sourcing_request_id" required className={field}>
          {requests.map((r) => (
            <option key={r.id} value={r.id}>{r.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={label} htmlFor="resp_type">Response</label>
        <select id="resp_type" name="response_type" defaultValue="availability" className={field}>
          <option value="no_response">No response</option>
          <option value="price_indication">Price indication</option>
          <option value="availability">Availability</option>
          <option value="firm_quote">Firm quote</option>
          <option value="decline">Decline</option>
        </select>
      </div>
      <div>
        <label className={label} htmlFor="resp_price">Unit price</label>
        <input id="resp_price" name="quoted_unit_price" type="number" step="0.01" min="0" className={field} />
      </div>
      <div>
        <label className={label} htmlFor="resp_lead">Lead time (days)</label>
        <input id="resp_lead" name="lead_time_days" type="number" min="0" className={field} />
      </div>
      <div>
        <label className={label} htmlFor="resp_valid">Valid until</label>
        <input id="resp_valid" name="valid_until" type="date" className={field} />
      </div>
      <div className="sm:col-span-5">
        <label className={label} htmlFor="resp_text">Response notes</label>
        <textarea id="resp_text" name="response_text" rows={2} className={field} />
      </div>
      <button type="submit" disabled={pending} className="rounded border border-black/20 px-3 py-1.5 text-sm disabled:opacity-60">
        {pending ? "Saving…" : "Log response"}
      </button>
      <Errors state={state} />
    </form>
  );
}

export function CommitmentForm({
  requirementId,
  oems,
  lineItems,
}: {
  requirementId: string;
  oems: Option[];
  lineItems: Option[];
}) {
  const [state, formAction, pending] = useActionState(addCommitmentAction, initial);
  return (
    <form action={formAction} className="mt-3 grid gap-2 sm:grid-cols-5">
      <input type="hidden" name="requirement_id" value={requirementId} />
      <div>
        <label className={label} htmlFor="cm_oem">OEM *</label>
        <select id="cm_oem" name="oem_id" required className={field}>
          {oems.map((o) => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={label} htmlFor="cm_line">Line item</label>
        <select id="cm_line" name="line_item_id" className={field}>
          <option value="">(whole requirement)</option>
          {lineItems.map((l) => (
            <option key={l.id} value={l.id}>{l.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={label} htmlFor="cm_qty">Quantity *</label>
        <input id="cm_qty" name="quantity" type="number" step="0.001" min="0.001" required className={field} />
      </div>
      <div>
        <label className={label} htmlFor="cm_source">Source</label>
        <input id="cm_source" name="source" placeholder="firm_quote / written_confirmation" className={field} />
      </div>
      <label className="flex items-end gap-2 text-sm">
        <input type="checkbox" name="firm" /> Firm commitment
      </label>
      <div className="sm:col-span-5">
        <label className={label} htmlFor="cm_notes">Notes</label>
        <input id="cm_notes" name="notes" className={field} />
      </div>
      <button type="submit" disabled={pending} className="rounded border border-black/20 px-3 py-1.5 text-sm disabled:opacity-60">
        {pending ? "Saving…" : "Add commitment"}
      </button>
      <Errors state={state} />
    </form>
  );
}
