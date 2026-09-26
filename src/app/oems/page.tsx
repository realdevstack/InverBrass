import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { istDateString } from "@/lib/rules/dates";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function OemsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_oem_directory")
    .select("*")
    .order("name", { ascending: true });

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">OEM master</h1>
        <div className="flex gap-2">
          <Link href="/oems/expiring" className="rounded border border-black/20 px-3 py-1.5 text-sm">
            Certification expiry
          </Link>
          <Link href="/oems/new" className="rounded bg-teal px-3 py-1.5 text-sm font-medium text-white">
            New OEM
          </Link>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          {error.message}
        </p>
      )}

      <table className="mt-4 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-black/10">
            <th className="py-2 pr-3">Name</th>
            <th className="py-2 pr-3">Category</th>
            <th className="py-2 pr-3">Vendor list</th>
            <th className="py-2 pr-3">Contacts</th>
            <th className="py-2 pr-3">Certs</th>
            <th className="py-2 pr-3">Next expiry</th>
            <th className="py-2 pr-3 text-right">Committed</th>
            <th className="py-2 text-right">Available</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((row) => (
            <tr key={row.oem_id} className="border-b border-black/5">
              <td className="py-2 pr-3">
                <Link href={`/oems/${row.oem_id}`} className="text-teal hover:underline">
                  {row.name}
                </Link>
              </td>
              <td className="py-2 pr-3">{row.brand_product_category ?? "—"}</td>
              <td className="py-2 pr-3">
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">{row.govt_vendor_list_status}</span>
              </td>
              <td className="py-2 pr-3">{row.contact_count}</td>
              <td className="py-2 pr-3">{row.certification_count}</td>
              <td className="py-2 pr-3">{row.next_expiry_date ? istDateString(row.next_expiry_date) : "—"}</td>
              <td className="py-2 pr-3 text-right">{Number(row.committed_quantity).toLocaleString("en-IN")}</td>
              <td className="py-2 text-right">
                {row.available_quantity === null ? "—" : Number(row.available_quantity).toLocaleString("en-IN")}
              </td>
            </tr>
          ))}
          {data && data.length === 0 && (
            <tr>
              <td colSpan={8} className="py-6 text-center opacity-70">No OEMs yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </AppShell>
  );
}
