"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { Database } from "@/lib/database.types";
import { parseLineItemsBulk } from "@/lib/rules/line-items";
import { createClient } from "@/lib/supabase/server";
import { pursueDecisionSchema, requirementInputSchema } from "@/lib/validation/requirements";

type DocumentType = Database["public"]["Enums"]["document_type"];
const ALLOWED_UPLOAD_TYPES: DocumentType[] = [
  "tender_document",
  "technical_specification",
  "drawing",
  "regret_letter",
  "po_copy",
  "invoice_copy",
  "pdi_report",
  "delivery_challan",
  "lr_copy",
  "payment_proof",
  "test_certificate",
  "rcma",
  "cemilac",
  "dgqa",
  "lcso",
  "mil",
  "proof_of_delivery",
  "other",
];

export type RequirementFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  lineErrors?: Array<{ line: number; reason: string }>;
};

export async function createRequirementAction(
  _prev: RequirementFormState,
  formData: FormData,
): Promise<RequirementFormState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = requirementInputSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const input = parsed.data;
  const { rows, errors } = parseLineItemsBulk(input.line_items_text ?? "");
  if (errors.length > 0) {
    return { lineErrors: errors.map((e) => ({ line: e.line, reason: e.reason })) };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Link to the Customer Master by name when it exists; free text still works.
  const { data: linkedCustomer } = await supabase
    .from("customers")
    .select("id")
    .eq("name", input.customer_agency)
    .maybeSingle();

  const payload = {
    project_name: input.project_name,
    customer_agency: input.customer_agency,
    customer_id: linkedCustomer?.id ?? null,
    customer_division: input.customer_division,
    customer_sub_division: input.customer_sub_division,
    source: input.source,
    gem_tender_number: input.gem_tender_number,
    bid_type: input.bid_type,
    submission_type: input.submission_type,
    special_remarks: input.special_remarks,
    submission_deadline: input.submission_deadline,
    assigned_employee_id: input.assigned_employee_id,
    primary_oem_id: input.primary_oem_id,
    quotation_validity_days: input.quotation_validity_days,
    staggered_delivery: input.staggered_delivery,
    remarks: input.remarks,
    created_by: user?.id ?? null,
  };

  const { data: requirement, error } = await supabase
    .from("requirements")
    .insert(payload)
    .select("id")
    .single();

  if (error) return { error: error.message };

  if (rows.length > 0) {
    // Link each line to the Part Master by part number when it exists.
    const partNumbers = rows.map((row) => row.part_number);
    const { data: matchedProducts } = await supabase
      .from("products")
      .select("id, part_number")
      .in("part_number", partNumbers);
    const productByPart = new Map((matchedProducts ?? []).map((p) => [p.part_number, p.id]));

    const { error: lineError } = await supabase
      .from("line_items")
      .insert(
        rows.map((row) => ({
          ...row,
          requirement_id: requirement.id,
          product_id: productByPart.get(row.part_number) ?? null,
        })),
      );
    if (lineError) {
      return {
        error: `Requirement saved, but the line items failed (${lineError.message}). Open the requirement to retry.`,
      };
    }
  }

  revalidatePath("/requirements");
  redirect(`/requirements/${requirement.id}`);
}

export async function updatePursueDecisionAction(formData: FormData): Promise<void> {
  const parsed = pursueDecisionSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase
    .from("requirements")
    .update({
      pursue_decision: parsed.data.pursue_decision,
      regret_letter_logged: parsed.data.regret_letter_logged,
    })
    .eq("id", parsed.data.requirement_id);

  revalidatePath(`/requirements/${parsed.data.requirement_id}`);
  revalidatePath("/requirements");
}

export type UploadState = { error?: string; ok?: boolean };

export async function uploadRequirementDocumentAction(
  _prev: UploadState,
  formData: FormData,
): Promise<UploadState> {
  const requirementId = String(formData.get("requirement_id") ?? "");
  const rawType = String(formData.get("document_type") ?? "tender_document") as DocumentType;
  const documentType = ALLOWED_UPLOAD_TYPES.includes(rawType) ? rawType : "other";
  const file = formData.get("file");

  if (!requirementId) return { error: "Missing requirement." };
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file to upload." };
  if (file.size > 50 * 1024 * 1024) return { error: "File is larger than the 50 MB limit." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${requirementId}/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
  if (uploadError) return { error: `Upload failed: ${uploadError.message}` };

  const { error: insertError } = await supabase.from("documents").insert({
    document_type: documentType,
    title: file.name,
    requirement_id: requirementId,
    storage_bucket: "documents",
    storage_path: path,
    file_name: file.name,
    mime_type: file.type || null,
    size_bytes: file.size,
    uploaded_by: user?.id ?? null,
  });
  if (insertError) {
    await supabase.storage.from("documents").remove([path]);
    return { error: `File stored but not linked: ${insertError.message}` };
  }

  revalidatePath(`/requirements/${requirementId}`);
  return { ok: true };
}
