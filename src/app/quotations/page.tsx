import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { formatInr } from "@/lib/rules/dates";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { tone: string; dot: string }> = {
  won: { tone: "text-clear", dot: "dot-clear" },
  lost: { tone: "text-risk", dot: "dot-risk" },
  cancelled: { tone: "text-muted-ink", dot: "dot-pending" },
  draft: { tone: "text-muted-ink", dot: "dot-pending" },
  approved: { tone: "text-progress", dot: "dot-progress" },
  submitted: { tone: "text-progress", dot: "dot-progress" },
};

export default async function QuotationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; agency?: string; type?: string }>;
}) {
  const { q, agency, type } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("v_past_bids").select("*").order("created_at", { ascending: false }).limit(100);
  if (q) query = query.ilike("part_number", `%${q}%`);
  if (agency) query = query.ilike("customer_agency", `%${agency}%`);
  if (type) query = query.ilike("product_type", `%${type}%`);

  const { data, error } = await query;
  const filtered = Boolean(q || agency || type);

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Quotations &amp; bid intelligence</h1>
        <Link href="/quotations/new" className="btn-primary">New quotation</Link>
      </div>

      <form className="panel mt-4 grid gap-3 p-4 sm:grid-cols-4" action="/quotations">
        <div>
          <label className="label" htmlFor="q">Part number</label>
          <input id="q" name="q" defaultValue={q} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="agency">Agency</label>
          <input id="agency" name="agency" defaultValue={agency} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="type">Product type</label>
          <input id="type" name="type" defaultValue={type} className="input" />
        </div>
        <div className="flex items-end gap-2">
          <button type="submit" className="btn-outline">Search history</button>
          {filtered && <Link href="/quotations" className="text-sm">Clear</Link>}
        </div>
      </form>

      {error && (
        <p role="alert" className="mt-4 rounded border border-risk/40 bg-risk/10 p-3 text-sm text-risk">{error.message}</p>
      )}

      <section className="panel mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-hairline text-muted-ink">
              <th className="px-3 py-2">Project</th>
              <th className="px-3 py-2">Agency</th>
              <th className="px-3 py-2">Part</th>
              <th className="px-3 py-2">OEM</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Final price</th>
              <th className="px-3 py-2">Loss / L1</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((row) => {
              const tone = STATUS[row.status ?? ""] ?? { tone: "text-muted-ink", dot: "dot-pending" };
              return (
                <tr key={row.quotation_id} className="status-row border-b border-hairline" data-status={row.status === "won" ? "clear" : row.status === "lost" ? "risk" : "progress"}>
                  <td className="px-3 py-2">
                    <Link href={`/quotations/${row.quotation_id}`} className="hover:underline">{row.project_name}</Link>
                    <span className="mono ml-2 text-xs text-muted-ink">v{row.version}</span>
                  </td>
                  <td className="px-3 py-2">{row.customer_agency}</td>
                  <td className="mono px-3 py-2 text-xs">{row.part_number ?? "—"}</td>
                  <td className="px-3 py-2">{row.oem_name ?? "—"}</td>
                  <td className={`px-3 py-2 ${tone.tone}`}>
                    <span className={`dot ${tone.dot}`} />
                    {(row.status ?? "").replace(/_/g, " ")}
                  </td>
                  <td className="mono px-3 py-2 text-right">{row.final_price === null ? "—" : formatInr(Number(row.final_price))}</td>
                  <td className="px-3 py-2 text-xs">
                    {row.loss_reason ? (row.loss_reason as string).replace(/_/g, " ") : "—"}
                    {row.l1_price !== null ? ` · L1 ${formatInr(Number(row.l1_price))}` : ""}
                  </td>
                </tr>
              );
            })}
            {data && data.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-ink">
                {filtered ? "No comparable past bids." : "No quotations yet."}
              </td></tr>
            )}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
