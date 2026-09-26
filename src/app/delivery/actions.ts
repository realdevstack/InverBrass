"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  extensionRequestSchema,
  materialReadinessSchema,
  pdiSchema,
} from "@/lib/validation/delivery";

export type DeliveryFormState = {
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

export async function addMaterialReadinessAction(
  _prev: DeliveryFormState,
  formData: FormData,
): Promise<DeliveryFormState> {
  const parsed = materialReadinessSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("material_readiness").insert({
    ...parsed.data,
    created_by: user?.id ?? null,
  });
  if (error) return { error: error.message };

  revalidatePath(`/delivery/${parsed.data.purchase_order_id}`);
  revalidatePath("/delivery");
  return { ok: true };
}

/**
 * Offered / cleared / rejected are three separate numbers; the result is derived
 * from them and the database check refuses cleared + rejected > offered.
 */
export async function createPdiAction(
  _prev: DeliveryFormState,
  formData: FormData,
): Promise<DeliveryFormState> {
  const parsed = pdiSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  const input = parsed.data;

  const cleared = input.quantity_cleared ?? 0;
  const rejected = input.quantity_rejected ?? 0;
  let result: "pending" | "cleared" | "partially_cleared" | "rejected";
  if (cleared + rejected === 0) result = "pending";
  else if (cleared === 0) result = "rejected";
  else if (rejected > 0) result = "partially_cleared";
  else result = "cleared";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("pdis").insert({
    purchase_order_id: input.purchase_order_id,
    material_readiness_id: input.material_readiness_id,
    line_item_id: input.line_item_id,
    inspector_details: input.inspector_details,
    dispatch_clearance: input.dispatch_clearance,
    inspection_type: input.inspection_type,
    inspection_agency: input.inspection_agency,
    scheduled_date: input.scheduled_date,
    conducted_date: input.conducted_date,
    quantity_offered: input.quantity_offered,
    quantity_cleared: cleared,
    quantity_rejected: rejected,
    result,
    rejection_remarks: input.rejection_remarks,
    re_pdi_required: input.re_pdi_required,
    conducted_by: user?.id ?? null,
  });
  if (error) return { error: error.message };

  revalidatePath(`/delivery/${input.purchase_order_id}`);
  revalidatePath("/delivery");
  return { ok: true };
}

export async function requestExtensionAction(
  _prev: DeliveryFormState,
  formData: FormData,
): Promise<DeliveryFormState> {
  const parsed = extensionRequestSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };

  const supabase = await createClient();
  const { error } = await supabase
    .from("purchase_orders")
    .update({ extension_requested_at: new Date().toISOString(), extension_note: parsed.data.extension_note })
    .eq("id", parsed.data.purchase_order_id);
  if (error) return { error: error.message };

  revalidatePath(`/delivery/${parsed.data.purchase_order_id}`);
  revalidatePath("/delivery");
  return { ok: true };
}
