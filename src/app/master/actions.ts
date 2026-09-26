"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { customerContactSchema, customerSchema, productSchema } from "@/lib/validation/master";

export type MasterFormState = {
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

export async function createCustomerAction(_prev: MasterFormState, formData: FormData): Promise<MasterFormState> {
  const parsed = customerSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("customers")
    .insert({ ...parsed.data, created_by: user?.id ?? null })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/customers");
  redirect(`/customers/${data.id}`);
}

export async function addCustomerContactAction(_prev: MasterFormState, formData: FormData): Promise<MasterFormState> {
  const parsed = customerContactSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };

  const supabase = await createClient();
  const { error } = await supabase.from("customer_contacts").insert(parsed.data);
  if (error) return { error: error.message };

  revalidatePath(`/customers/${parsed.data.customer_id}`);
  return { ok: true };
}

export async function createProductAction(_prev: MasterFormState, formData: FormData): Promise<MasterFormState> {
  const parsed = productSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  const certifications = formData.getAll("compliance_certifications").map(String).filter(Boolean);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("products").insert({
    part_number: parsed.data.part_number,
    client_part_number: parsed.data.client_part_number,
    description: parsed.data.description,
    hsn_code: parsed.data.hsn_code,
    oem_id: parsed.data.oem_id,
    uom: parsed.data.uom,
    product_category: parsed.data.product_category,
    technical_specifications: parsed.data.technical_specifications,
    compliance_certifications: certifications,
    shelf_life: parsed.data.shelf_life,
    export_restriction: parsed.data.export_restriction,
    lead_time_days: parsed.data.lead_time_days,
    moq: parsed.data.moq,
    standard_price: parsed.data.standard_price,
    currency: parsed.data.currency ?? "INR",
    created_by: user?.id ?? null,
  });
  if (error) return { error: error.message };

  revalidatePath("/products");
  return { ok: true };
}
