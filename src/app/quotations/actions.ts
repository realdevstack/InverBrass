"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  approvalSchema,
  lossCaptureSchema,
  quotationInputSchema,
  quotationStatusSchema,
  quotationUpdateSchema,
} from "@/lib/validation/quotations";

export type QuotationFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: boolean;
};

function fieldErrorsFrom(issues: Array<{ path: readonly PropertyKey[]; message: string }>) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join(".");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

function quotationPayload(input: ReturnType<typeof quotationInputSchema.parse>) {
  return {
    oem_id: input.oem_id,
    line_item_id: input.line_item_id,
    currency: input.currency ?? "INR",
    oem_quotation_number: input.oem_quotation_number,
    quotation_date: input.quotation_date,
    unit_price: input.unit_price,
    quantity: input.quantity,
    oem_price: input.oem_price,
    freight_amount: input.freight_amount,
    gst_amount: input.gst_amount,
    discount_amount: input.discount_amount,
    target_margin_percentage: input.target_margin_percentage,
    recommended_price: input.recommended_price,
    final_price: input.final_price,
    validity_days: input.validity_days,
    internal_notes: input.internal_notes,
    delivery_terms: input.delivery_terms,
    lead_time_days: input.lead_time_days,
    payment_terms: input.payment_terms,
    export_format: input.export_format,
    pnc_status: input.pnc_status,
    technical_compliance: input.technical_compliance,
    commercial_compliance: input.commercial_compliance,
  };
}

export async function createQuotationAction(
  _prev: QuotationFormState,
  formData: FormData,
): Promise<QuotationFormState> {
  const parsed = quotationInputSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  const input = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: latest } = await supabase
    .from("quotations")
    .select("version")
    .eq("requirement_id", input.requirement_id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const version = (latest?.version ?? 0) + 1;

  await supabase
    .from("quotations")
    .update({ is_current: false })
    .eq("requirement_id", input.requirement_id)
    .eq("is_current", true);

  const { data: created, error } = await supabase
    .from("quotations")
    .insert({
      requirement_id: input.requirement_id,
      version,
      is_current: true,
      ...quotationPayload(input),
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/quotations");
  revalidatePath(`/requirements/${input.requirement_id}`);
  redirect(`/quotations/${created.id}`);
}

export async function updateQuotationAction(
  _prev: QuotationFormState,
  formData: FormData,
): Promise<QuotationFormState> {
  const parsed = quotationUpdateSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  const input = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("quotations")
    .update(quotationPayload(input))
    .eq("id", input.quotation_id);
  if (error) return { error: error.message };

  revalidatePath(`/quotations/${input.quotation_id}`);
  revalidatePath("/quotations");
  return { ok: true };
}

export async function setQuotationStatusAction(formData: FormData): Promise<void> {
  const parsed = quotationStatusSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return;

  const supabase = await createClient();
  const patch: { status: typeof parsed.data.status; submitted_at?: string } = { status: parsed.data.status };
  if (parsed.data.status === "submitted") patch.submitted_at = new Date().toISOString();

  await supabase.from("quotations").update(patch).eq("id", parsed.data.quotation_id);
  revalidatePath(`/quotations/${parsed.data.quotation_id}`);
  revalidatePath("/quotations");
}

export async function recordApprovalAction(formData: FormData): Promise<void> {
  const parsed = approvalSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase.rpc("record_approval", {
    p_stage: "quotation_submitted",
    p_entity_type: "quotation",
    p_entity_id: parsed.data.quotation_id,
    p_level: parsed.data.level,
    p_decision: parsed.data.decision,
    p_note: parsed.data.note ?? undefined,
  });

  revalidatePath(`/quotations/${parsed.data.quotation_id}`);
  revalidatePath("/quotations");
}

export async function captureLossAction(
  _prev: QuotationFormState,
  formData: FormData,
): Promise<QuotationFormState> {
  const parsed = lossCaptureSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };

  const supabase = await createClient();
  const { error } = await supabase
    .from("quotations")
    .update({
      status: "lost",
      loss_reason: parsed.data.loss_reason,
      l1_price: parsed.data.l1_price,
      competitor: parsed.data.competitor,
    })
    .eq("id", parsed.data.quotation_id);
  if (error) return { error: error.message };

  revalidatePath(`/quotations/${parsed.data.quotation_id}`);
  revalidatePath("/quotations");
  return { ok: true };
}
