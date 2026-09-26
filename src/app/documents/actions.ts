"use server";

import { revalidatePath } from "next/cache";

import type { Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

type DocumentType = Database["public"]["Enums"]["document_type"];

const DOCUMENT_TYPES: DocumentType[] = [
  "rcma", "cemilac", "dgqa", "lcso", "mil", "test_certificate", "delivery_challan",
  "lr_copy", "payment_proof", "po_copy", "invoice_copy", "pdi_report", "regret_letter",
  "tender_document", "technical_specification", "drawing", "proof_of_delivery", "other",
];

export type DocumentFormState = { error?: string; ok?: boolean };

export async function uploadDocumentAction(
  _prev: DocumentFormState,
  formData: FormData,
): Promise<DocumentFormState> {
  const rawType = String(formData.get("document_type") ?? "other") as DocumentType;
  const documentType = DOCUMENT_TYPES.includes(rawType) ? rawType : "other";
  const purchaseOrderId = String(formData.get("purchase_order_id") ?? "");
  const requirementId = String(formData.get("requirement_id") ?? "");
  const oemId = String(formData.get("oem_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const issueDate = String(formData.get("issue_date") ?? "");
  const expiryDate = String(formData.get("expiry_date") ?? "");
  const file = formData.get("file");

  if (!purchaseOrderId && !requirementId && !oemId) {
    return { error: "Link the document to a PO, a requirement or an OEM." };
  }
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file to upload." };
  if (file.size > 50 * 1024 * 1024) return { error: "File is larger than the 50 MB limit." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const folder = purchaseOrderId || requirementId || oemId;
  const path = `${folder}/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
  if (uploadError) return { error: `Upload failed: ${uploadError.message}` };

  const { error: insertError } = await supabase.from("documents").insert({
    document_type: documentType,
    title: title || file.name,
    supplier: null,
    issue_date: issueDate || null,
    expiry_date: expiryDate || null,
    purchase_order_id: purchaseOrderId || null,
    requirement_id: requirementId || null,
    oem_id: oemId || null,
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

  revalidatePath("/documents");
  return { ok: true };
}
