import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { istDateString } from "@/lib/rules/dates";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CertificationsExpiringPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_oem_certification_expiry")
    .select("*")
    .in("expiry_state", ["expired", "due_soon"])
    .order("days_remaining", { ascending: true });

  return (
    <AppShell>
      <Link href="/oems" className="text-sm text-teal hover:underline">← OEMs</Link>
      <h1 className="mt-2 text-2xl font-semibold">Certification expiry</h1>
      <p className="mt-1 text-sm opacity-70">Expired or inside the renewal reminder window.</p>

      {error && (
        <p role="alert" className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900">{error.message}</p>
      )}

      <table className="mt-4 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-black/10">
            <th className="py-2 pr-3">OEM</th>
            <th className="py-2 pr-3">Certification</th>
            <th className="py-2 pr-3">Reference</th>
            <th className="py-2 pr-3">Expiry</th>
            <th className="py-2 pr-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((c) => (
            <tr key={c.certification_id} className="border-b border-black/5">
              <td className="py-2 pr-3">
                <Link href={`/oems/${c.oem_id}`} className="text-teal hover:underline">{c.oem_name}</Link>
              </td>
              <td className="py-2 pr-3">{c.certification_type}</td>
              <td className="py-2 pr-3">{c.reference_number ?? "—"}</td>
              <td className="py-2 pr-3">{c.expiry_date ? istDateString(c.expiry_date) : "—"}</td>
              <td className={`py-2 pr-3 ${c.expiry_state === "expired" ? "text-red-700" : "text-amber-800"}`}>
                {c.expiry_state === "expired" ? "Expired" : "Due soon"} ({c.days_remaining}d)
              </td>
            </tr>
          ))}
          {data && data.length === 0 && (
            <tr><td colSpan={5} className="py-6 text-center opacity-70">Nothing expiring. Good.</td></tr>
          )}
        </tbody>
      </table>
    </AppShell>
  );
}
