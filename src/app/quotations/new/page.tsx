import { AppShell } from "@/components/app-shell";
import { CreateQuotationForm } from "@/app/quotations/quotation-forms";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function NewQuotationPage({
  searchParams,
}: {
  searchParams: Promise<{ requirement_id?: string }>;
}) {
  const { requirement_id } = await searchParams;
  const supabase = await createClient();

  const [requirements, oems, lineItems] = await Promise.all([
    supabase.from("requirements").select("id, project_name, customer_agency").order("created_at", { ascending: false }),
    supabase.from("oems").select("id, name").eq("is_active", true).order("name"),
    supabase.from("line_items").select("id, requirement_id, line_no, part_number").order("line_no"),
  ]);

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold">New quotation</h1>
      <p className="mt-1 text-sm text-muted-ink">
        The recommended price is a suggestion; the final price is entered by a human and never auto-set.
      </p>
      <CreateQuotationForm
        initialRequirementId={requirement_id}
        requirements={(requirements.data ?? []).map((r) => ({
          id: r.id,
          label: `${r.project_name} · ${r.customer_agency}`,
        }))}
        oems={(oems.data ?? []).map((o) => ({ id: o.id, label: o.name }))}
        lineItems={(lineItems.data ?? []).map((l) => ({
          id: l.id,
          requirementId: l.requirement_id,
          label: `#${l.line_no} ${l.part_number}`,
        }))}
      />
    </AppShell>
  );
}
