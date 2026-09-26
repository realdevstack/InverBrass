import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SourcingPage() {
  const supabase = await createClient();
  const [coverage, capacity] = await Promise.all([
    supabase
      .from("v_requirement_coverage")
      .select("*")
      .order("submission_deadline", { ascending: true, nullsFirst: false }),
    supabase.from("v_oem_capacity").select("*").order("name", { ascending: true }),
  ]);

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold">Sourcing &amp; quantity coverage</h1>
      <p className="mt-1 text-sm opacity-70">
        Only firm commitments reduce an uncovered balance; availability indications are shown but never counted.
      </p>

      {coverage.error && (
        <p role="alert" className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          {coverage.error.message}
        </p>
      )}

      <section className="mt-6">
        <h2 className="font-medium">Per-requirement coverage</h2>
        <table className="mt-2 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/10">
              <th className="py-2 pr-3">Requirement</th>
              <th className="py-2 pr-3">Agency</th>
              <th className="py-2 pr-3 text-right">Required</th>
              <th className="py-2 pr-3 text-right">Firm</th>
              <th className="py-2 pr-3 text-right">Indicated</th>
              <th className="py-2 text-right">Uncovered</th>
            </tr>
          </thead>
          <tbody>
            {coverage.data?.map((row) => (
              <tr key={row.requirement_id} className="border-b border-black/5">
                <td className="py-2 pr-3">
                  <Link href={`/sourcing/${row.requirement_id}`} className="text-teal hover:underline">
                    {row.project_name}
                  </Link>
                </td>
                <td className="py-2 pr-3">{row.customer_agency}</td>
                <td className="py-2 pr-3 text-right">{Number(row.required_quantity).toLocaleString("en-IN")}</td>
                <td className="py-2 pr-3 text-right text-green-800">{Number(row.firm_committed).toLocaleString("en-IN")}</td>
                <td className="py-2 pr-3 text-right">{Number(row.indicated_available).toLocaleString("en-IN")}</td>
                <td className="py-2 text-right">
                  <span className={Number(row.uncovered_quantity) > 0 ? "text-amber-800" : "text-green-800"}>
                    {Number(row.uncovered_quantity).toLocaleString("en-IN")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-8">
        <h2 className="font-medium">Global-per-OEM capacity</h2>
        <p className="text-xs opacity-70">
          Firm commitments across all live requirements. A null capacity means &quot;not stated&quot;, not zero.
        </p>
        <table className="mt-2 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/10">
              <th className="py-2 pr-3">OEM</th>
              <th className="py-2 pr-3 text-right">Capacity</th>
              <th className="py-2 pr-3 text-right">Committed</th>
              <th className="py-2 text-right">Available</th>
            </tr>
          </thead>
          <tbody>
            {capacity.data?.map((row) => (
              <tr key={row.oem_id} className="border-b border-black/5">
                <td className="py-2 pr-3">
                  <Link href={`/oems/${row.oem_id}`} className="text-teal hover:underline">{row.name}</Link>
                </td>
                <td className="py-2 pr-3 text-right">{row.capacity === null ? "—" : Number(row.capacity).toLocaleString("en-IN")}</td>
                <td className="py-2 pr-3 text-right">{Number(row.committed_quantity).toLocaleString("en-IN")}</td>
                <td className="py-2 text-right">
                  {row.available_quantity === null ? (
                    "—"
                  ) : (
                    <span className={Number(row.available_quantity) === 0 ? "text-amber-800" : "text-green-800"}>
                      {Number(row.available_quantity).toLocaleString("en-IN")}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
