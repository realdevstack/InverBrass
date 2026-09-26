import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("id, name, division, sub_division, gst_number, gem_registration, is_active")
    .order("name");

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Customer master</h1>
        <Link href="/customers/new" className="btn-primary">New customer</Link>
      </div>
      {error && <p role="alert" className="mt-4 rounded border border-risk/40 bg-risk/10 p-3 text-sm text-risk">{error.message}</p>}

      <section className="panel mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-hairline text-muted-ink">
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Division / sub-division</th>
              <th className="px-3 py-2">GST</th>
              <th className="px-3 py-2">GeM registration</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((c) => (
              <tr key={c.id} className="border-b border-hairline">
                <td className="px-3 py-2"><Link href={`/customers/${c.id}`} className="hover:underline">{c.name}</Link></td>
                <td className="px-3 py-2">{[c.division, c.sub_division].filter(Boolean).join(" / ") || "—"}</td>
                <td className="mono px-3 py-2 text-xs">{c.gst_number ?? "—"}</td>
                <td className="px-3 py-2 text-xs">{c.gem_registration ?? "—"}</td>
                <td className="px-3 py-2">{c.is_active ? "active" : "inactive"}</td>
              </tr>
            ))}
            {data?.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-ink">No customers yet.</td></tr>}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
