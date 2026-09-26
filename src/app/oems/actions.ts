"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { oemCertificationSchema, oemContactSchema, oemInputSchema } from "@/lib/validation/oems";

export type OemFormState = {
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

export async function createOemAction(
  _prev: OemFormState,
  formData: FormData,
): Promise<OemFormState> {
  const parsed = oemInputSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const input = parsed.data;
  const { data: oem, error } = await supabase
    .from("oems")
    .insert({
      name: input.name,
      brand_product_category: input.brand_product_category,
      country_of_origin: input.country_of_origin,
      product_portfolio: input.product_portfolio,
      moq_rules: input.moq_rules,
      lead_time_days: input.lead_time_days,
      pricing_validity: input.pricing_validity,
      freight_terms: input.freight_terms,
      warranty_terms: input.warranty_terms,
      payment_terms: input.payment_terms,
      commission_percentage: input.commission_percentage ?? 0,
      nda_status: input.nda_status,
      bank_details: input.bank_details,
      capacity: input.capacity,
      govt_vendor_list_status: input.govt_vendor_list_status,
      govt_vendor_list_source: input.govt_vendor_list_source,
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/oems");
  redirect(`/oems/${oem.id}`);
}

export async function addOemContactAction(
  _prev: OemFormState,
  formData: FormData,
): Promise<OemFormState> {
  const parsed = oemContactSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };

  const supabase = await createClient();
  const { error } = await supabase.from("oem_contacts").insert(parsed.data);
  if (error) return { error: error.message };

  revalidatePath(`/oems/${parsed.data.oem_id}`);
  return { ok: true };
}

export async function addOemCertificationAction(
  _prev: OemFormState,
  formData: FormData,
): Promise<OemFormState> {
  const parsed = oemCertificationSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };

  const supabase = await createClient();
  const { error } = await supabase.from("oem_certifications").insert({
    ...parsed.data,
    reminder_days: parsed.data.reminder_days ?? 90,
  });
  if (error) return { error: error.message };

  revalidatePath(`/oems/${parsed.data.oem_id}`);
  revalidatePath("/oems/expiring");
  return { ok: true };
}
