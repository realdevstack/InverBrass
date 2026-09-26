import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { istDateString } from "@/lib/rules/dates";
import { canRead, type AppRole } from "@/lib/rules/access";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ table?: string }> }) {
  const { table } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: AppRole | null = null;
  if (user) {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
    role = (data?.role as AppRole | undefined) ?? null;
  }

  if (!canRead(role, "admin")) {
    return (
      <AppShell>
        <h1 className="text-2xl font-semibold">Audit log</h1>
        <p role="alert" className="mt-4 rounded border border-alert/40 bg-alert/10 p-3 text-sm">
          Only Owner, Group Head and Management can read the audit trail.
        </p>
      </AppShell>
    );
  }

  let query = supabase
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (table) query = query.eq("table_name", table);
  const { data, error } = await query;

  const tables = [...new Set((data ?? []).map((r) => r.table_name).filter(Boolean))].sort();

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold">Audit log</h1>
      <p className="mt-1 text-sm text-muted-ink">Who changed what, on which record, and when. Read-only.</p>

      {error && <p role="alert" className="mt-4 rounded border border-risk/40 bg-risk/10 p-3 text-sm text-risk">{error.message}</p>}

      {tables.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Link href="/admin/audit" className={`rounded border px-2 py-1 ${!table ? "border-signal" : "border-hairline"}`}>all</Link>
          {tables.map((t) => (
            <Link key={t} href={`/admin/audit?table=${t}`} className={`rounded border px-2 py-1 ${table === t ? "border-signal" : "border-hairline"}`}>
              {t}
            </Link>
          ))}
        </div>
      )}

      <section className="panel mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-hairline text-muted-ink">
              <th className="px-3 py-2">When</th>
              <th className="px-3 py-2">Table</th>
              <th className="px-3 py-2">Action</th>
              <th className="px-3 py-2">Record</th>
              <th className="px-3 py-2">Changed fields</th>
              <th className="px-3 py-2">Actor</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((row) => (
              <tr key={row.id} className="border-b border-hairline">
                <td className="px-3 py-2 text-xs">{row.at ? istDateString(row.at) : "—"}</td>
                <td className="mono px-3 py-2 text-xs">{row.table_name}</td>
                <td className="px-3 py-2">{row.action}</td>
                <td className="mono px-3 py-2 text-xs">{row.record_id?.slice(0, 8) ?? "—"}</td>
                <td className="px-3 py-2 text-xs">{Array.isArray(row.changed_fields) ? row.changed_fields.join(", ") : "—"}</td>
                <td className="mono px-3 py-2 text-xs">{row.actor_id?.slice(0, 8) ?? "system"}</td>
              </tr>
            ))}
            {data?.length === 0 && <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-ink">No audit entries.</td></tr>}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
