"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { commitmentSchema, sourcingRequestSchema, sourcingResponseSchema } from "@/lib/validation/sourcing";

export type SourcingFormState = {
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

function revalidateRequirement(formData: FormData) {
  revalidatePath("/sourcing");
  const requirementId = formData.get("requirement_id");
  if (typeof requirementId === "string" && requirementId) revalidatePath(`/sourcing/${requirementId}`);
}

export async function createSourcingRequestAction(
  _prev: SourcingFormState,
  formData: FormData,
): Promise<SourcingFormState> {
  const parsed = sourcingRequestSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("sourcing_requests").insert({
    ...parsed.data,
    created_by: user?.id ?? null,
  });
  if (error) return { error: error.message };

  revalidateRequirement(formData);
  return { ok: true };
}

export async function addSourcingResponseAction(
  _prev: SourcingFormState,
  formData: FormData,
): Promise<SourcingFormState> {
  const parsed = sourcingResponseSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("sourcing_responses").insert({
    ...parsed.data,
    created_by: user?.id ?? null,
  });
  if (error) return { error: error.message };

  revalidateRequirement(formData);
  return { ok: true };
}

export async function addCommitmentAction(
  _prev: SourcingFormState,
  formData: FormData,
): Promise<SourcingFormState> {
  const parsed = commitmentSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };

  const input = parsed.data;
  const source = input.source ?? (input.firm ? "firm_quote" : "availability_indication");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("quantity_commitments").insert({
    oem_id: input.oem_id,
    requirement_id: input.requirement_id,
    line_item_id: input.line_item_id,
    quantity: input.quantity,
    firm: input.firm,
    source,
    notes: input.notes,
    created_by: user?.id ?? null,
  });
  if (error) return { error: error.message };

  revalidateRequirement(formData);
  return { ok: true };
}

/**
 * Flips a commitment between firm and availability. Firm commitments must name
 * their backing source (a quote or written confirmation), so a downgrade also
 * rewrites the source; the database check enforces the pairing either way.
 */
export async function setCommitmentFirmAction(formData: FormData): Promise<void> {
  const id = String(formData.get("commitment_id") ?? "");
  const firm = formData.get("firm") === "true";
  if (!id) return;

  const supabase = await createClient();
  await supabase
    .from("quantity_commitments")
    .update({ firm, source: firm ? "written_confirmation" : "availability_indication" })
    .eq("id", id);

  revalidateRequirement(formData);
}
