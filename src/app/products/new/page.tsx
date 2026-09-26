import { AppShell } from "@/components/app-shell";
import { ProductCreateForm } from "@/app/master/master-forms";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const supabase = await createClient();
  const { data: oems } = await supabase.from("oems").select("id, name").eq("is_active", true).order("name");

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold">New part</h1>
      <p className="mt-1 text-sm text-muted-ink">Part master: OEM and client part numbers, HSN, compliance, MOQ.</p>
      <ProductCreateForm oems={(oems ?? []).map((o) => ({ id: o.id, name: o.name }))} />
    </AppShell>
  );
}
