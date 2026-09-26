import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { daysUntilDeadline, istDateString } from "@/lib/rules/dates";
import { canRead, isApprover, type AppRole } from "@/lib/rules/access";
import { createClient } from "@/lib/supabase/server";
import { updatePursueDecisionAction } from "@/app/requirements/actions";
import { UploadForm } from "./upload-form";

export const dynamic = "force-dynamic";

export default async function RequirementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: requirement, error } = await supabase
    .from("requirements")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return (
      <AppShell>
        <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          {error.message}
        </p>
      </AppShell>
    );
  }
  if (!requirement) notFound();

  const [lineItems, coverage, documents, userResult] = await Promise.all([
    supabase.from("v_line_item_coverage").select("*").eq("requirement_id", id).order("line_no"),
    supabase.from("v_requirement_coverage").select("*").eq("requirement_id", id).maybeSingle(),
    supabase.from("documents").select("*").eq("requirement_id", id).order("created_at", { ascending: false }),
    supabase.auth.getUser(),
  ]);

  const user = userResult.data.user;
  let role: AppRole | null = null;
  if (user) {
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();
    role = (roleRow?.role as AppRole | undefined) ?? null;
  }

  const docsWithUrls = await Promise.all(
    (documents.data ?? []).map(async (doc) => {
      const { data } = await supabase.storage
        .from(doc.storage_bucket)
        .createSignedUrl(doc.storage_path, 3600);
      return { ...doc, signedUrl: data?.signedUrl ?? null };
    }),
  );

  const deadline = requirement.submission_deadline;
  const days = deadline ? daysUntilDeadline(deadline) : null;

  return (
    <AppShell>
      <Link href="/requirements" className="text-sm text-teal hover:underline">
        ← Requirements
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">{requirement.project_name}</h1>
        {requirement.rfi_number && <span className="mono rounded bg-content px-2 py-0.5 text-xs">{requirement.rfi_number}</span>}
      </div>
      <p className="mt-1 text-sm opacity-70">
        {requirement.customer_agency}
        {requirement.customer_division ? ` · ${requirement.customer_division}` : ""}
        {requirement.customer_sub_division ? ` · ${requirement.customer_sub_division}` : ""}
      </p>
      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        {canRead(role, "sourcing") && (
          <Link href={`/sourcing/${requirement.id}`} className="btn-outline">
            Sourcing &amp; coverage
          </Link>
        )}
        {canRead(role, "quotation") && (
          <Link href={`/quotations/new?requirement_id=${requirement.id}`} className="btn-outline">
            New quotation
          </Link>
        )}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <dt className="opacity-60">Status</dt>
          <dd className="font-medium">{requirement.status}</dd>
        </div>
        <div>
          <dt className="opacity-60">Deadline</dt>
          <dd className="font-medium">
            {deadline ? `${istDateString(deadline)}${days !== null ? ` (${days}d)` : ""}` : "—"}
          </dd>
        </div>
        <div>
          <dt className="opacity-60">Source</dt>
          <dd className="font-medium">{requirement.source.replace(/_/g, " ")}</dd>
        </div>
        <div>
          <dt className="opacity-60">Pursue</dt>
          <dd className="font-medium">{requirement.pursue_decision.replace(/_/g, " ")}</dd>
        </div>
      </dl>

      {coverage.data && (
        <section className="mt-6 rounded border border-black/10 bg-white p-4">
          <h2 className="font-medium">Quantity coverage</h2>
          <div className="mt-2 flex flex-wrap gap-6 text-sm">
            <span>Required: <strong>{Number(coverage.data.required_quantity).toLocaleString("en-IN")}</strong></span>
            <span>Firm committed: <strong className="text-green-800">{Number(coverage.data.firm_committed).toLocaleString("en-IN")}</strong></span>
            <span>Indicated only: <strong>{Number(coverage.data.indicated_available).toLocaleString("en-IN")}</strong></span>
            <span>Uncovered: <strong className={Number(coverage.data.uncovered_quantity) > 0 ? "text-amber-800" : "text-green-800"}>{Number(coverage.data.uncovered_quantity).toLocaleString("en-IN")}</strong></span>
          </div>
        </section>
      )}

      <section className="mt-6">
        <h2 className="font-medium">Line items ({lineItems.data?.length ?? 0})</h2>
        <table className="mt-2 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/10">
              <th className="py-2 pr-3">#</th>
              <th className="py-2 pr-3">Part number</th>
              <th className="py-2 pr-3">Client part</th>
              <th className="py-2 pr-3">Description</th>
              <th className="py-2 pr-3 text-right">Qty</th>
              <th className="py-2 pr-3">UoM</th>
              <th className="py-2 pr-3">Delivery</th>
              <th className="py-2 pr-3 text-right">Firm</th>
              <th className="py-2 text-right">Uncovered</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.data?.map((line) => (
              <tr key={line.line_item_id} className="border-b border-black/5">
                <td className="py-2 pr-3">{line.line_no}</td>
                <td className="py-2 pr-3 font-mono text-xs">{line.part_number}</td>
                <td className="py-2 pr-3 font-mono text-xs">{line.client_part_number ?? "—"}</td>
                <td className="py-2 pr-3">{line.description}</td>
                <td className="py-2 pr-3 text-right">{Number(line.required_quantity).toLocaleString("en-IN")}</td>
                <td className="py-2 pr-3">{line.uom ?? "—"}</td>
                <td className="py-2 pr-3">
                  {line.required_delivery_date ? istDateString(line.required_delivery_date) : "—"}
                </td>
                <td className="py-2 pr-3 text-right">{Number(line.firm_committed).toLocaleString("en-IN")}</td>
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

      {isApprover(role) && (
        <section className="mt-6 rounded border border-black/10 bg-white p-4">
          <h2 className="font-medium">Pursue decision</h2>
          <form action={updatePursueDecisionAction} className="mt-2 flex flex-wrap items-end gap-3 text-sm">
            <input type="hidden" name="requirement_id" value={requirement.id} />
            <div>
              <label className="block text-xs font-medium" htmlFor="pursue_decision">
                Decision
              </label>
              <select
                id="pursue_decision"
                name="pursue_decision"
                defaultValue={requirement.pursue_decision}
                className="mt-1 rounded border border-black/20 bg-white px-2 py-1.5"
              >
                <option value="undecided">Undecided</option>
                <option value="pursued">Pursue</option>
                <option value="not_pursued">Do not pursue</option>
              </select>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="regret_letter_logged"
                defaultChecked={requirement.regret_letter_logged}
              />
              Regret letter logged
            </label>
            <button type="submit" className="rounded border border-black/20 px-3 py-1.5">
              Save
            </button>
          </form>
        </section>
      )}

      <section className="mt-6 rounded border border-black/10 bg-white p-4">
        <h2 className="font-medium">Documents</h2>
        {docsWithUrls.length === 0 ? (
          <p className="mt-2 text-sm opacity-70">No documents linked to this requirement.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {docsWithUrls.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between border-b border-black/5 py-1">
                <span>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{doc.document_type}</span>{" "}
                  {doc.title ?? doc.file_name}
                </span>
                {doc.signedUrl ? (
                  <a href={doc.signedUrl} className="text-teal hover:underline" target="_blank" rel="noreferrer">
                    Open (1h link)
                  </a>
                ) : (
                  <span className="opacity-50">unavailable</span>
                )}
              </li>
            ))}
          </ul>
        )}
        <UploadForm requirementId={requirement.id} />
      </section>
    </AppShell>
  );
}
