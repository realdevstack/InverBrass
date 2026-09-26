"use client";

import Link from "next/link";
import { useActionState } from "react";

import { createRequirementAction, type RequirementFormState } from "@/app/requirements/actions";

const initialState: RequirementFormState = {};

const inputClass = "mt-1 w-full rounded border border-black/20 bg-white px-3 py-2";
const labelClass = "block text-sm font-medium";

export function RequirementForm({
  oems,
  employees,
}: {
  oems: Array<{ id: string; name: string }>;
  employees: Array<{ id: string; name: string }>;
}) {
  const [state, formAction, pending] = useActionState(createRequirementAction, initialState);

  return (
    <form action={formAction} className="mt-4 space-y-6">
      {state.error && (
        <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          {state.error}
        </p>
      )}

      <section className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="project_name">
            Project name *
          </label>
          <input id="project_name" name="project_name" required className={inputClass} />
          {state.fieldErrors?.project_name && (
            <p className="mt-1 text-xs text-red-700">{state.fieldErrors.project_name}</p>
          )}
        </div>
        <div>
          <label className={labelClass} htmlFor="customer_agency">
            Customer / agency *
          </label>
          <input id="customer_agency" name="customer_agency" required className={inputClass} />
          {state.fieldErrors?.customer_agency && (
            <p className="mt-1 text-xs text-red-700">{state.fieldErrors.customer_agency}</p>
          )}
        </div>
        <div>
          <label className={labelClass} htmlFor="customer_division">
            Division
          </label>
          <input id="customer_division" name="customer_division" className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="customer_sub_division">
            Sub-division
          </label>
          <input id="customer_sub_division" name="customer_sub_division" className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="source">
            Source of enquiry
          </label>
          <select id="source" name="source" defaultValue="email" className={inputClass}>
            <option value="email">Email</option>
            <option value="gem_portal">GeM portal</option>
            <option value="client_portal">Client portal</option>
            <option value="direct_customer">Direct from customer</option>
            <option value="through_oem">Through an OEM</option>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="gem_tender_number">
            GeM tender number
          </label>
          <input id="gem_tender_number" name="gem_tender_number" className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="bid_type">
            Bid type
          </label>
          <select id="bid_type" name="bid_type" defaultValue="single" className={inputClass}>
            <option value="single">Single bid</option>
            <option value="double">Double bid</option>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="submission_type">
            Submission type
          </label>
          <select id="submission_type" name="submission_type" defaultValue="soft_copy" className={inputClass}>
            <option value="hard_copy">Hard copy</option>
            <option value="soft_copy">Soft copy</option>
            <option value="both">Both</option>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="special_remarks">
            Special remarks / approvals
          </label>
          <select id="special_remarks" name="special_remarks" defaultValue="none" className={inputClass}>
            <option value="none">No approvals needed</option>
            <option value="rcma">RCMA</option>
            <option value="cemilac">CEMILAC</option>
            <option value="lcso">LCSO</option>
            <option value="mil">MIL</option>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="submission_deadline">
            Submission deadline
          </label>
          <input
            id="submission_deadline"
            name="submission_deadline"
            type="datetime-local"
            className={inputClass}
          />
          {state.fieldErrors?.submission_deadline && (
            <p className="mt-1 text-xs text-red-700">{state.fieldErrors.submission_deadline}</p>
          )}
        </div>
        <div>
          <label className={labelClass} htmlFor="primary_oem_id">
            Associated OEM
          </label>
          <select id="primary_oem_id" name="primary_oem_id" className={inputClass}>
            <option value="">(none yet)</option>
            {oems.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="assigned_employee_id">
            Assigned employee
          </label>
          <select id="assigned_employee_id" name="assigned_employee_id" className={inputClass}>
            <option value="">(unassigned)</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="quotation_validity_days">
            Quotation validity requirement (days)
          </label>
          <input
            id="quotation_validity_days"
            name="quotation_validity_days"
            type="number"
            min="0"
            className={inputClass}
          />
          {state.fieldErrors?.quotation_validity_days && (
            <p className="mt-1 text-xs text-red-700">{state.fieldErrors.quotation_validity_days}</p>
          )}
        </div>
        <label className="flex items-center gap-2 self-end text-sm">
          <input type="checkbox" name="staggered_delivery" /> Staggered delivery
        </label>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="remarks">
            Remarks / additional comments
          </label>
          <textarea id="remarks" name="remarks" rows={2} className={inputClass} />
        </div>
      </section>

      <section>
        <label className={labelClass} htmlFor="line_items_text">
          Line items (up to 500)
        </label>
        <p className="mt-1 text-xs opacity-70">
          One per line: part number, description, quantity, uom, required delivery date (YYYY-MM-DD),
          and an optional client part number. Tab, comma or two spaces separate the columns. Lines
          starting with # are ignored.
        </p>
        <textarea
          id="line_items_text"
          name="line_items_text"
          rows={8}
          className={`${inputClass} font-mono text-xs`}
          placeholder={"PN-AR-100, Airborne VHF radio set, 1000, nos, 2026-12-01, HAL-PN-77"}
        />
        {state.lineErrors && state.lineErrors.length > 0 && (
          <div role="alert" className="mt-2 rounded border border-red-300 bg-red-50 p-3 text-xs text-red-900">
            <p className="font-medium">Fix these lines and submit again:</p>
            <ul className="mt-1 list-inside list-disc">
              {state.lineErrors.map((e) => (
                <li key={`${e.line}-${e.reason}`}>
                  Line {e.line}: {e.reason}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-teal px-4 py-2 font-medium text-white disabled:opacity-60"
        >
          {pending ? "Saving…" : "Create requirement"}
        </button>
        <Link href="/requirements" className="rounded border border-black/20 px-4 py-2">
          Cancel
        </Link>
      </div>
    </form>
  );
}
