import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";
import { RequirementForm } from "./requirement-form";

export const dynamic = "force-dynamic";

export default async function NewRequirementPage() {
  const supabase = await createClient();
  const [oems, employees] = await Promise.all([
    supabase.from("oems").select("id, name").eq("is_active", true).order("name"),
    supabase.from("user_roles").select("user_id, full_name").eq("is_active", true).order("full_name"),
  ]);

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold">New requirement</h1>
      <p className="mt-1 text-sm opacity-70">
        The RFI is the central record: everything else in the system hangs off it.
      </p>
      <RequirementForm
        oems={(oems.data ?? []).map((o) => ({ id: o.id, name: o.name }))}
        employees={(employees.data ?? []).map((e) => ({ id: e.user_id, name: e.full_name ?? e.user_id }))}
      />
    </AppShell>
  );
}
