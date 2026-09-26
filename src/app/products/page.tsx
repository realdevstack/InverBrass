import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { formatInr } from "@/lib/rules/dates";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const supabase = await createClient();
  const [products, oems] = await Promise.all([
    supabase.from("products").select("*").order("part_number"),
    supabase.from("oems").select("id, name"),
  ]);
  const oemName = new Map((oems.data ?? []).map((o) => [o.id, o.name]));

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Parts master</h1>
        <Link href="/products/new" className="btn-primary">New part</Link>
      </div>
      <p className="mt-1 text-sm text-muted-ink">
        OEM and client part numbers, HSN, compliance certifications, MOQ and standard price.
      </p>

      {products.error && <p role="alert" className="mt-4 rounded border border-risk/40 bg-risk/10 p-3 text-sm text-risk">{products.error.message}</p>}

      <section className="panel mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-hairline text-muted-ink">
              <th className="px-3 py-2">Part (OEM)</th>
              <th className="px-3 py-2">Client part</th>
              <th className="px-3 py-2">OEM</th>
              <th className="px-3 py-2">HSN</th>
              <th className="px-3 py-2">Compliance</th>
              <th className="px-3 py-2 text-right">MOQ</th>
              <th className="px-3 py-2 text-right">Std price</th>
            </tr>
          </thead>
          <tbody>
            {products.data?.map((p) => (
              <tr key={p.id} className="border-b border-hairline">
                <td className="mono px-3 py-2 text-xs">{p.part_number}</td>
                <td className="mono px-3 py-2 text-xs">{p.client_part_number ?? "—"}</td>
                <td className="px-3 py-2">{p.oem_id ? oemName.get(p.oem_id) ?? "—" : "—"}</td>
                <td className="mono px-3 py-2 text-xs">{p.hsn_code ?? "—"}</td>
                <td className="px-3 py-2 text-xs">{(p.compliance_certifications ?? []).join(", ") || "—"}</td>
                <td className="mono px-3 py-2 text-right">{p.moq === null ? "—" : Number(p.moq).toLocaleString("en-IN")}</td>
                <td className="mono px-3 py-2 text-right">
                  {p.standard_price === null ? "—" : `${formatInr(Number(p.standard_price))} ${p.currency}`}
                </td>
              </tr>
            ))}
            {products.data?.length === 0 && <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-ink">No parts yet.</td></tr>}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
