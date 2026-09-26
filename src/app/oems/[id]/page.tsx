import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { CertificationForm, ContactForm } from "@/app/oems/oem-forms";
import { istDateString } from "@/lib/rules/dates";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const EXPIRY_TONES: Record<string, string> = {
  expired: "text-red-700",
  due_soon: "text-amber-800",
  valid: "text-green-800",
  no_expiry: "opacity-60",
};

export default async function OemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: oem, error } = await supabase.from("oems").select("*").eq("id", id).maybeSingle();
  if (error) {
    return (
      <AppShell>
        <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900">{error.message}</p>
      </AppShell>
    );
  }
  if (!oem) notFound();

  const [contacts, certifications, capacity, linkedDocuments] = await Promise.all([
    supabase.from("oem_contacts").select("*").eq("oem_id", id).order("is_primary", { ascending: false }),
    supabase.from("v_oem_certification_expiry").select("*").eq("oem_id", id).order("expiry_date", { ascending: true, nullsFirst: false }),
    supabase.from("v_oem_capacity").select("*").eq("oem_id", id).maybeSingle(),
    supabase.from("documents").select("id, document_type, title, file_name, expiry_date").eq("oem_id", id),
  ]);

  return (
    <AppShell>
      <Link href="/oems" className="text-sm text-teal hover:underline">← OEMs</Link>
      <h1 className="mt-2 text-2xl font-semibold">{oem.name}</h1>
      <p className="mt-1 text-sm opacity-70">
        {oem.brand_product_category ?? "—"} · {oem.country_of_origin ?? "—"}
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <dt className="opacity-60">Vendor-list status</dt>
          <dd className="font-medium">
            {oem.govt_vendor_list_status}
            {oem.govt_vendor_list_source ? ` (${oem.govt_vendor_list_source})` : ""}
          </dd>
        </div>
        <div>
          <dt className="opacity-60">Commission</dt>
          <dd className="font-medium">{Number(oem.commission_percentage).toFixed(2)}%</dd>
        </div>
        <div>
          <dt className="opacity-60">Lead time</dt>
          <dd className="font-medium">{oem.lead_time_days ?? "—"} days</dd>
        </div>
        <div>
          <dt className="opacity-60">Capacity</dt>
          <dd className="font-medium">
            {oem.capacity === null
              ? "not stated"
              : `${Number(capacity.data?.available_quantity ?? 0).toLocaleString("en-IN")} available of ${Number(oem.capacity).toLocaleString("en-IN")}`}
          </dd>
        </div>
      </dl>

      <section className="mt-6 rounded border border-black/10 bg-white p-4 text-sm">
        <h2 className="font-medium">Commercial terms</h2>
        <dl className="mt-2 grid gap-2 sm:grid-cols-2">
          <div><dt className="opacity-60">MOQ</dt><dd>{oem.moq_rules ?? "—"}</dd></div>
          <div><dt className="opacity-60">Pricing validity</dt><dd>{oem.pricing_validity ?? "—"}</dd></div>
          <div><dt className="opacity-60">Freight</dt><dd>{oem.freight_terms ?? "—"}</dd></div>
          <div><dt className="opacity-60">Warranty</dt><dd>{oem.warranty_terms ?? "—"}</dd></div>
          <div><dt className="opacity-60">Payment terms</dt><dd>{oem.payment_terms ?? "—"}</dd></div>
          <div><dt className="opacity-60">NDA status</dt><dd>{oem.nda_status ?? "—"}</dd></div>
          <div className="sm:col-span-2"><dt className="opacity-60">Portfolio</dt><dd>{oem.product_portfolio ?? "—"}</dd></div>
          <div className="sm:col-span-2"><dt className="opacity-60">Bank details</dt><dd>{oem.bank_details ?? "—"}</dd></div>
        </dl>
      </section>

      <section className="mt-6 rounded border border-black/10 bg-white p-4">
        <h2 className="font-medium">Contacts ({contacts.data?.length ?? 0})</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {contacts.data?.map((c) => (
            <li key={c.id} className="border-b border-black/5 py-1">
              <span className="font-medium">{c.name}</span>
              {c.designation ? ` · ${c.designation}` : ""}
              {c.email ? ` · ${c.email}` : ""}
              {c.phone ? ` · ${c.phone}` : ""}
              {c.is_primary && <span className="ml-2 rounded bg-teal/10 px-1.5 py-0.5 text-xs text-teal">primary</span>}
            </li>
          ))}
          {contacts.data?.length === 0 && <li className="opacity-70">No contacts recorded.</li>}
        </ul>
        <ContactForm oemId={id} />
      </section>

      <section className="mt-6 rounded border border-black/10 bg-white p-4">
        <h2 className="font-medium">Certifications ({certifications.data?.length ?? 0})</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {certifications.data?.map((c) => (
            <li key={c.certification_id} className="flex flex-wrap items-center justify-between border-b border-black/5 py-1">
              <span>
                <span className="font-medium">{c.certification_type}</span>
                {c.reference_number ? ` · ${c.reference_number}` : ""}
                {c.issued_by ? ` · ${c.issued_by}` : ""}
              </span>
              <span className={EXPIRY_TONES[c.expiry_state ?? "no_expiry"] ?? ""}>
                {c.expiry_date ? `${istDateString(c.expiry_date)} · ${(c.expiry_state ?? "").replace(/_/g, " ")}` : "no expiry"}
                {c.days_remaining !== null ? ` (${c.days_remaining}d)` : ""}
              </span>
            </li>
          ))}
          {certifications.data?.length === 0 && <li className="opacity-70">No certifications recorded.</li>}
        </ul>
        <CertificationForm oemId={id} />
      </section>

      <section className="mt-6 rounded border border-black/10 bg-white p-4">
        <h2 className="font-medium">Linked documents ({linkedDocuments.data?.length ?? 0})</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {linkedDocuments.data?.map((d) => (
            <li key={d.id} className="border-b border-black/5 py-1">
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{d.document_type}</span>{" "}
              {d.title ?? d.file_name}
              {d.expiry_date ? ` · expires ${istDateString(d.expiry_date)}` : ""}
            </li>
          ))}
          {linkedDocuments.data?.length === 0 && <li className="opacity-70">No documents linked to this OEM.</li>}
        </ul>
        <p className="mt-2 text-xs opacity-70">Upload documents from the Documents module, linked to this OEM.</p>
      </section>
    </AppShell>
  );
}
