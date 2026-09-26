"use client";

import { useActionState } from "react";

import {
  uploadRequirementDocumentAction,
  type UploadState,
} from "@/app/requirements/actions";

const initialState: UploadState = {};

export function UploadForm({ requirementId }: { requirementId: string }) {
  const [state, formAction, pending] = useActionState(uploadRequirementDocumentAction, initialState);

  return (
    <form action={formAction} className="mt-3 flex flex-wrap items-end gap-2 text-sm">
      <input type="hidden" name="requirement_id" value={requirementId} />
      <div>
        <label className="block text-xs font-medium" htmlFor="document_type">
          Type
        </label>
        <select
          id="document_type"
          name="document_type"
          defaultValue="tender_document"
          className="mt-1 rounded border border-black/20 bg-white px-2 py-1.5"
        >
          <option value="tender_document">Tender document</option>
          <option value="technical_specification">Technical specification</option>
          <option value="drawing">Drawing</option>
          <option value="regret_letter">Regret letter</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium" htmlFor="file">
          File (max 50 MB)
        </label>
        <input id="file" name="file" type="file" required className="mt-1" />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded border border-black/20 px-3 py-1.5 disabled:opacity-60"
      >
        {pending ? "Uploading…" : "Upload"}
      </button>
      {state.error && <p className="w-full text-xs text-red-700">{state.error}</p>}
      {state.ok && <p className="w-full text-xs text-green-800">Uploaded.</p>}
    </form>
  );
}
