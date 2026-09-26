"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { poStatusSchema, purchaseOrderSchema, signoffSchema, verificationSchema } from "@/lib/validation/orders";

export type OrderFormState = {
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

export async function createPurchaseOrderAction(
  _prev: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const parsed = purchaseOrderSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  const input = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: quotation } = await supabase
    .from("quotations")
    .select("id, requirement_id, status, oem_id, line_item_id")
    .eq("id", input.quotation_id)
    .maybeSingle();

  if (!quotation) return { error: "Quotation not found." };
  if (quotation.status !== "approved") {
    return { error: `A PO can only be created from an approved quotation; this one is ${quotation.status}.` };
  }

  const { data: linkedCustomer } = await supabase
    .from("customers")
    .select("id")
    .eq("name", input.customer)
    .maybeSingle();

  const { data: created, error } = await supabase
    .from("purchase_orders")
    .insert({
      po_number: input.po_number,
      po_date: input.po_date,
      quotation_id: quotation.id,
      requirement_id: quotation.requirement_id,
      customer: input.customer,
      customer_id: linkedCustomer?.id ?? null,
      oem_id: input.oem_id ?? quotation.oem_id,
      line_item_id: input.line_item_id ?? quotation.line_item_id,
      part_number: input.part_number,
      quantity_ordered: input.quantity_ordered,
      unit_price: input.unit_price,
      po_value: input.po_value,
      taxes_gst: input.taxes_gst ?? 0,
      delivery_schedule: input.delivery_schedule,
      committed_deadline: input.committed_deadline,
      partial_delivery_allowed: input.partial_delivery_allowed,
      pdi_required: input.pdi_required,
      pdi_mode: input.pdi_mode ?? null,
      documentation_required: input.documentation_required,
      warranty_terms: input.warranty_terms,
      payment_terms: input.payment_terms,
      special_conditions: input.special_conditions,
      pdi_inspector: input.pdi_inspector,
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/orders");
  redirect(`/orders/${created.id}`);
}

export async function saveVerificationAction(formData: FormData): Promise<void> {
  const parsed = verificationSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase
    .from("purchase_orders")
    .update({
      verification_spec_match: parsed.data.verification_spec_match,
      verification_price_match: parsed.data.verification_price_match,
      verification_feasibility: parsed.data.verification_feasibility,
      verification_documents_complete: parsed.data.verification_documents_complete,
      verified_by: user?.id ?? null,
      verified_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.purchase_order_id);

  revalidatePath(`/orders/${parsed.data.purchase_order_id}`);
}

export async function groupHeadSignoffAction(formData: FormData): Promise<void> {
  const parsed = signoffSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.rpc("record_approval", {
    p_stage: "order_accepted",
    p_entity_type: "purchase_order",
    p_entity_id: parsed.data.purchase_order_id,
    p_level: "group_head",
    p_decision: "approved",
    p_note: undefined,
  });
  await supabase
    .from("purchase_orders")
    .update({ group_head_signoff_by: user?.id ?? null, group_head_signoff_at: new Date().toISOString() })
    .eq("id", parsed.data.purchase_order_id);

  revalidatePath(`/orders/${parsed.data.purchase_order_id}`);
}

export async function setPoStatusAction(formData: FormData): Promise<void> {
  const parsed = poStatusSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase.from("purchase_orders").update({ status: parsed.data.status }).eq("id", parsed.data.purchase_order_id);
  revalidatePath(`/orders/${parsed.data.purchase_order_id}`);
  revalidatePath("/orders");
}
