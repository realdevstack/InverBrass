import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { setCommitmentFirmAction } from "@/app/sourcing/actions";
import { CommitmentForm, SourcingRequestForm, SourcingResponseForm } from "@/app/sourcing/sourcing-forms";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SourcingDetailPage({
  params,
}: {
  params: Promise<{ requirementId: string }>;
}) {
  const { requirementId } = await params;
  const supabase = await createClient();

  const { data: requirement, error } = await supabase
    .from("requirements")
    .select("*")
    .eq("id", requirementId)
    .maybeSingle();
  if (error) {
    return (
      <AppShell>
        <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900">{error.message}</p>
      </AppShell>
    );
  }
  if (!requirement) notFound();

  const [coverage, lineCoverage, commitments, ledger, oems, lineItems, requests] = await Promise.all([
    supabase.from("v_requirement_coverage").select("*").eq("requirement_id", requirementId).maybeSingle(),
    supabase.from("v_line_item_coverage").select("*").eq("requirement_id", requirementId).order("line_no"),
    supabase.from("v_commitment_detail").select("*").eq("requirement_id", requirementId).order("created_at", { ascending: false }),
    supabase.from("v_sourcing_ledger").select("*").eq("requirement_id", requirementId).order("sent_at", { ascending: false }),
    supabase.from("oems").select("id, name").eq("is_active", true).order("name"),
    supabase.from("line_items").select("id, line_no, part_number").eq("requirement_id", requirementId).order("line_no"),
    supabase.from("sourcing_requests").select("id, oem_id, sent_at").eq("requirement_id", requirementId).order("sent_at", { ascending: false }),
  ]);

  const oemOptions = (oems.data ?? []).map((o) => ({ id: o.id, label: o.name }));
  const lineOptions = (lineItems.data ?? []).map((l) => ({ id: l.id, label: `#${l.line_no} ${l.part_number}` }));
  const oemName = new Map((oems.data ?? []).map((o) => [o.id, o.name]));
  const requestOptions = (requests.data ?? []).map((r) => ({
    id: r.id,
    label: `${oemName.get(r.oem_id) ?? "OEM"} · ${new Date(r.sent_at).toISOString().slice(0, 10)}`,
  }));

  return (
    <AppShell>
      <Link href="/sourcing" className="text-sm text-teal hover:underline">← Sourcing &amp; coverage</Link>
      <h1 className="mt-2 text-2xl font-semibold">{requirement.project_name}</h1>
      <p className="mt-1 text-sm opacity-70">{requirement.customer_agency}</p>

      {coverage.data && (
        <section className="mt-4 rounded border border-black/10 bg-white p-4">
          <h2 className="font-medium">Coverage</h2>
          <div className="mt-2 flex flex-wrap gap-6 text-sm">
            <span>Required: <strong>{Number(coverage.data.required_quantity).toLocaleString("en-IN")}</strong></span>
            <span>Firm: <strong className="text-green-800">{Number(coverage.data.firm_committed).toLocaleString("en-IN")}</strong></span>
            <span>Indicated: <strong>{Number(coverage.data.indicated_available).toLocaleString("en-IN")}</strong></span>
            <span>
              Uncovered:{" "}
              <strong className={Number(coverage.data.uncovered_quantity) > 0 ? "text-amber-800" : "text-green-800"}>
                {Number(coverage.data.uncovered_quantity).toLocaleString("en-IN")}
              </strong>
            </span>
          </div>
        </section>
      )}

      <section className="mt-6">
        <h2 className="font-medium">Line coverage</h2>
        <table className="mt-2 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/10">
              <th className="py-2 pr-3">#</th>
              <th className="py-2 pr-3">Part number</th>
              <th className="py-2 pr-3 text-right">Required</th>
              <th className="py-2 pr-3 text-right">Firm</th>
              <th className="py-2 pr-3 text-right">Indicated</th>
              <th className="py-2 text-right">Uncovered</th>
            </tr>
          </thead>
          <tbody>
            {lineCoverage.data?.map((line) => (
              <tr key={line.line_item_id} className="border-b border-black/5">
                <td className="py-2 pr-3">{line.line_no}</td>
                <td className="py-2 pr-3 font-mono text-xs">{line.part_number}</td>
                <td className="py-2 pr-3 text-right">{Number(line.required_quantity).toLocaleString("en-IN")}</td>
                <td className="py-2 pr-3 text-right text-green-800">{Number(line.firm_committed).toLocaleString("en-IN")}</td>
                <td className="py-2 pr-3 text-right">{Number(line.indicated_available).toLocaleString("en-IN")}</td>
                <td className="py-2 text-right">
                  <span className={Number(line.uncovered_quantity) > 0 ? "text-amber-800" : "text-green-800"}>
                    {Number(line.uncovered_quantity).toLocaleString("en-IN")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-6 rounded border border-black/10 bg-white p-4">
        <h2 className="font-medium">Quantity commitments</h2>
        <table className="mt-2 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/10">
              <th className="py-2 pr-3">OEM</th>
              <th className="py-2 pr-3">Part</th>
              <th className="py-2 pr-3 text-right">Qty</th>
              <th className="py-2 pr-3">Basis</th>
              <th className="py-2 pr-3">Source</th>
              <th className="py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {commitments.data?.map((c) => (
              <tr key={c.commitment_id} className="border-b border-black/5">
                <td className="py-2 pr-3">{c.oem_name}</td>
                <td className="py-2 pr-3 font-mono text-xs">{c.part_number ?? "—"}</td>
                <td className="py-2 pr-3 text-right">{Number(c.quantity).toLocaleString("en-IN")}</td>
                <td className="py-2 pr-3">
                  <span className={`rounded px-2 py-0.5 text-xs ${c.firm ? "bg-green-100 text-green-900" : "bg-amber-100 text-amber-900"}`}>
                    {c.firm ? "Firm" : "Availability"}
                  </span>
                </td>
                <td className="py-2 pr-3 text-xs">{c.source}</td>
                <td className="py-2 text-right">
                  <form action={setCommitmentFirmAction} className="inline">
                    <input type="hidden" name="commitment_id" value={c.commitment_id ?? ""} />
                    <input type="hidden" name="requirement_id" value={requirementId} />
                    <input type="hidden" name="firm" value={c.firm ? "false" : "true"} />
                    <button type="submit" className="rounded border border-black/20 px-2 py-1 text-xs">
                      {c.firm ? "Downgrade" : "Make firm"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {commitments.data?.length === 0 && (
              <tr><td colSpan={6} className="py-4 text-center text-sm opacity-70">No commitments recorded.</td></tr>
            )}
          </tbody>
        </table>
        <CommitmentForm requirementId={requirementId} oems={oemOptions} lineItems={lineOptions} />
      </section>

      <section className="mt-6 rounded border border-black/10 bg-white p-4">
        <h2 className="font-medium">Sourcing log</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {ledger.data?.map((r) => (
            <li key={r.sourcing_request_id} className="border-b border-black/5 py-1">
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{r.channel}</span>{" "}
              <span className="font-medium">{r.oem_name}</span>
              {r.part_number ? ` · ${r.part_number}` : ""}
              {r.subject ? ` · ${r.subject}` : ""}
              <span className="ml-2 opacity-70">
                {r.response_count && r.response_count > 0
                  ? `${r.response_count} response(s), latest: ${(r.latest_response_type ?? "").replace(/_/g, " ")}`
                  : "no response yet"}
              </span>
            </li>
          ))}
          {ledger.data?.length === 0 && <li className="opacity-70">No sourcing requests yet.</li>}
        </ul>
        <SourcingRequestForm requirementId={requirementId} oems={oemOptions} lineItems={lineOptions} />
        {requestOptions.length > 0 && (
          <div className="mt-4 border-t border-black/10 pt-3">
            <h3 className="text-sm font-medium">Record a response</h3>
            <SourcingResponseForm requests={requestOptions} />
          </div>
        )}
      </section>
    </AppShell>
  );
}
