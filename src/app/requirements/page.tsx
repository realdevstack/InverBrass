import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { daysUntilDeadline, istDateString } from "@/lib/rules/dates";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const STATUS_TONES: Record<string, string> = {
  received: "bg-content text-ink",
  qualifying: "bg-alert/20 text-ink",
  quoted: "bg-signal/20 text-ink",
  submitted: "bg-signal/20 text-ink",
  won: "bg-clear/20 text-ink",
  lost: "bg-risk/15 text-risk",
  cancelled: "bg-content text-muted-ink",
};

function deadlineCell(deadline: string | null) {
  if (!deadline) return <span className="opacity-50">—</span>;
  const days = daysUntilDeadline(deadline);
  const tone = days < 0 ? "text-risk" : days <= 3 ? "text-alert" : "text-clear";
  const label = days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "due today" : `${days}d left`;
  return (
    <span className={tone}>
      {istDateString(deadline)} · {label}
    </span>
  );
}

export default async function RequirementsPage({
  searchParams,
}: {
  searchParams: Promise<{ mine?: string }>;
}) {
  const { mine } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("v_requirement_coverage")
    .select("*")
    .order("submission_deadline", { ascending: true, nullsFirst: false });
  if (mine === "1" && user) query = query.eq("assigned_employee_id", user.id);

  const { data, error } = await query;

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Requirements (RFIs)</h1>
        <div className="flex gap-2">
          <Link href={mine === "1" ? "/requirements" : "/requirements?mine=1"} className={`btn-outline ${mine === "1" ? "border-signal" : ""}`}>
            {mine === "1" ? "All RFIs" : "My RFIs"}
          </Link>
          <Link href="/requirements/new" className="btn-primary">New requirement</Link>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded border border-risk/40 bg-risk/10 p-3 text-sm text-risk">
          {error.message}
        </p>
      )}

      <section className="panel mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-hairline text-muted-ink">
              <th className="px-3 py-2">RFI</th>
              <th className="px-3 py-2">Project</th>
              <th className="px-3 py-2">Agency</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Deadline</th>
              <th className="px-3 py-2 text-right">Required</th>
              <th className="px-3 py-2 text-right">Firm</th>
              <th className="px-3 py-2 text-right">Uncovered</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((row) => (
              <tr key={row.requirement_id} className="status-row border-b border-hairline" data-status={Number(row.uncovered_quantity) > 0 ? "pending" : "clear"}>
                <td className="mono px-3 py-2 text-xs">{row.rfi_number ?? "—"}</td>
                <td className="px-3 py-2">
                  <Link href={`/requirements/${row.requirement_id}`} className="hover:underline">
                    {row.project_name}
                  </Link>
                </td>
                <td className="px-3 py-2">{row.customer_agency}</td>
                <td className="px-3 py-2">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_TONES[row.status ?? ""] ?? ""}`}>
                    {row.status}
                  </span>
                </td>
                <td className="px-3 py-2">{deadlineCell(row.submission_deadline)}</td>
                <td className="mono px-3 py-2 text-right">{Number(row.required_quantity).toLocaleString("en-IN")}</td>
                <td className="mono px-3 py-2 text-right text-clear">{Number(row.firm_committed).toLocaleString("en-IN")}</td>
                <td className="mono px-3 py-2 text-right">
                  <span className={Number(row.uncovered_quantity) > 0 ? "text-alert" : "text-clear"}>
                    {Number(row.uncovered_quantity).toLocaleString("en-IN")}
                  </span>
                </td>
              </tr>
            ))}
            {data && data.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-muted-ink">
                  {mine === "1" ? "No RFIs assigned to you." : "No requirements yet. Create one to get started."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
