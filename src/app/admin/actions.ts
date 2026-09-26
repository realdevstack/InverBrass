"use server";

import { randomBytes } from "node:crypto";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requiredText } from "@/lib/validation/common";

const ROLE_VALUES = ["owner", "group_head", "management", "sales", "operations", "finance"] as const;

const createUserSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  full_name: requiredText("Full name is required", 120),
  role: z.enum(ROLE_VALUES),
});

const roleUpdateSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(ROLE_VALUES),
});

const activeSchema = z.object({
  user_id: z.string().uuid(),
  is_active: z.union([z.literal("true"), z.literal("false")]).transform((v) => v === "true"),
});

const deleteSchema = z.object({ user_id: z.string().uuid() });

export type AdminState = {
  error?: string;
  ok?: boolean;
  createdEmail?: string;
  temporaryPassword?: string;
};

/**
 * Only the Owner may administer users. The check runs on every action, using the
 * caller's own session (RLS), before the service-role client is touched.
 */
async function requireOwner(): Promise<{ id: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (roleRow?.role !== "owner") return null;
  return { id: user.id };
}

function fieldErrorsFrom(issues: Array<{ path: readonly PropertyKey[]; message: string }>) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join(".");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

export async function createUserAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  if (!(await requireOwner())) return { error: "Only the Owner can add users." };

  const parsed = createUserSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const fieldErrors = fieldErrorsFrom(parsed.error.issues);
    return { error: Object.values(fieldErrors)[0] ?? "Check the form." };
  }
  const { email, full_name, role } = parsed.data;

  const temporaryPassword = `Inv#${randomBytes(6).toString("base64url")}9`;
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: { full_name, role },
  });
  if (error) return { error: error.message };

  const { error: roleError } = await admin
    .from("user_roles")
    .upsert({ user_id: data.user.id, role, full_name }, { onConflict: "user_id" });
  if (roleError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return { error: `User created but role assignment failed: ${roleError.message}` };
  }

  revalidatePath("/admin/users");
  return { ok: true, createdEmail: email, temporaryPassword };
}

export async function updateUserRoleAction(formData: FormData): Promise<void> {
  if (!(await requireOwner())) return;
  const parsed = roleUpdateSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return;

  const admin = createAdminClient();
  await admin
    .from("user_roles")
    .upsert({ user_id: parsed.data.user_id, role: parsed.data.role }, { onConflict: "user_id" });

  revalidatePath("/admin/users");
}

export async function setUserActiveAction(formData: FormData): Promise<void> {
  const owner = await requireOwner();
  if (!owner) return;
  const parsed = activeSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return;
  // Never let the Owner deactivate themselves and lose access.
  if (parsed.data.user_id === owner.id && !parsed.data.is_active) return;

  const admin = createAdminClient();
  await admin.from("user_roles").update({ is_active: parsed.data.is_active }).eq("user_id", parsed.data.user_id);

  revalidatePath("/admin/users");
}

export async function deleteUserAction(formData: FormData): Promise<void> {
  const owner = await requireOwner();
  if (!owner) return;
  const parsed = deleteSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return;
  // Never delete yourself; another Owner (or the DB) can remove this account.
  if (parsed.data.user_id === owner.id) return;

  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(parsed.data.user_id);

  revalidatePath("/admin/users");
}
