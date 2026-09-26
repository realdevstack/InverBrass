import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { DocumentUploadForm } from "@/app/documents/upload-form";
import type { Database } from "@/lib/database.types";
import { istDateString } from "@/lib/rules/dates";
import { createClient } from "@/lib/supabase/server";

type DocumentType = Database["public"]["Enums"]["document_type"];

export const dynamic = "force-dynamic";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ expiring?: string; type?: string }>;
}) {
  const { expiring, type } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("v_document_register").select("*").order("created_at", { ascending: false }).limit(200);
  if (type) query = query.eq("document_type", type as DocumentType);
  if (expiring === "1") query = query.not("days_to_expiry", "is", null).lte("days_to_expiry", 90);

  const [documents, pos, requirements, oems] = await Promise.all([
    query,
    supabase.from("purchase_orders").select("id, po_number").order("po_number"),
    supabase.from("requirements").select("id, project_name").order("project_name"),
    supabase.from("oems").select("id, name").order("name"),
  ]);

  const withUrls = await Promise.all(
    (documents.data ?? []).map(async (doc) => {
      const { data } = await supabase.storage.from("documents").createSignedUrl(doc.storage_path ?? "", 3600);
      return { doc, signedUrl: data?.signedUrl ?? null };
    }),
  );

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Document &amp; compliance vault</h1>
        <div className="flex gap-2">
          <Link href="/documents?expiring=1" className={`btn-outline ${expiring === "1" ? "border-alert text-alert" : ""}`}>
            Expiring / expired
          </Link>
          <Link href="/documents" className="btn-outline">All documents</Link>
        </div>
      </div>
      <p className="mt-1 text-sm text-muted-ink">
        Every document traces to the PO that required it (and through it the requirement), or to a requirement or OEM.
      </p>

      {documents.error && (
        <p role="alert" className="mt-4 rounded border border-risk/40 bg-risk/10 p-3 text-sm text-risk">{documents.error.message}</p>
      )}

      <section className="panel mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-hairline text-muted-ink">
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Linked PO</th>
              <th className="px-3 py-2">Requirement / OEM</th>
              <th className="px-3 py-2">Issue</th>
              <th className="px-3 py-2">Expiry</th>
              <th className="px-3 py-2">File</th>
            </tr>
          </thead>
          <tbody>
            {withUrls.map(({ doc, signedUrl }) => {
              const days = doc.days_to_expiry;
              const expiringSoon = days !== null && days <= 90;
              const expired = days !== null && days < 0;
              return (
                <tr key={doc.document_id} className="status-row border-b border-hairline" data-status={expired ? "risk" : expiringSoon ? "pending" : "clear"}>
                  <td className="px-3 py-2"><span className="rounded bg-content px-1.5 py-0.5 text-xs">{(doc.document_type ?? "").replace(/_/g, " ")}</span></td>
                  <td className="px-3 py-2">{doc.title ?? doc.file_name ?? "—"}</td>
                  <td className="mono px-3 py-2 text-xs">
                    {doc.purchase_order_id ? (
                      <Link href={`/orders/${doc.purchase_order_id}`} className="hover:underline">{doc.po_number}</Link>
                    ) : (
                      <span className="text-alert">no PO</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs">{doc.project_name ?? doc.oem_name ?? "—"}</td>
                  <td className="px-3 py-2">{doc.issue_date ? istDateString(doc.issue_date) : "—"}</td>
                  <td className={`px-3 py-2 ${expired ? "text-risk" : expiringSoon ? "text-alert" : ""}`}>
                    {doc.expiry_date ? `${istDateString(doc.expiry_date)}${days !== null ? ` (${days}d)` : ""}` : "—"}
                  </td>
                  <td className="px-3 py-2">
                    {signedUrl ? (
                      <a href={signedUrl} target="_blank" rel="noreferrer" className="hover:underline">Open (1h link)</a>
                    ) : (
                      <span className="text-muted-ink">unavailable</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {withUrls.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-ink">
                {expiring === "1" ? "Nothing expiring in the next 90 days." : "No documents yet."}
              </td></tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="panel mt-6 p-4">
        <h2 className="font-medium">Upload a document</h2>
        <DocumentUploadForm
          pos={(pos.data ?? []).map((p) => ({ id: p.id, label: p.po_number }))}
          requirements={(requirements.data ?? []).map((r) => ({ id: r.id, label: r.project_name }))}
          oems={(oems.data ?? []).map((o) => ({ id: o.id, label: o.name }))}
        />
      </section>
    </AppShell>
  );
}
