import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { ContactForm } from "@/app/master/master-forms";
import { formatInr } from "@/lib/rules/dates";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: customer, error } = await supabase.from("customers").select("*").eq("id", id).maybeSingle();
  if (error) {
    return (
      <AppShell>
        <p role="alert" className="rounded border border-risk/40 bg-risk/10 p-3 text-sm text-risk">{error.message}</p>
      </AppShell>
    );
  }
  if (!customer) notFound();

  const [contacts, pos] = await Promise.all([
    supabase.from("customer_contacts").select("*").eq("customer_id", id).order("is_primary", { ascending: false }),
    supabase.from("purchase_orders").select("id, po_number, po_value, status").eq("customer", customer.name),
  ]);

  return (
    <AppShell>
      <Link href="/customers" className="text-sm hover:underline">← Customers</Link>
      <h1 className="mt-2 text-2xl font-semibold">{customer.name}</h1>
      <p className="mt-1 text-sm text-muted-ink">
        {[customer.division, customer.sub_division].filter(Boolean).join(" / ") || "—"}
      </p>

      <section className="panel mt-4 grid gap-3 p-4 text-sm sm:grid-cols-3">
        <div><p className="label">GST number</p><p className="mono">{customer.gst_number ?? "—"}</p></div>
        <div><p className="label">GeM registration</p><p>{customer.gem_registration ?? "—"}</p></div>
        <div><p className="label">Vendor registration</p><p>{customer.inverbrass_vendor_registration ?? "—"}</p></div>
        <div><p className="label">Portal login mapping</p><p>{customer.portal_login_mapping ?? "—"}</p></div>
        <div><p className="label">Payment terms</p><p>{customer.payment_terms ?? "—"}</p></div>
        <div><p className="label">Approval requirements</p><p>{customer.approval_requirements ?? "—"}</p></div>
        <div className="sm:col-span-3"><p className="label">Billing address</p><p>{customer.billing_address ?? "—"}</p></div>
        <div className="sm:col-span-3"><p className="label">Delivery address</p><p>{customer.delivery_address ?? "—"}</p></div>
      </section>

      <section className="panel mt-6 p-4">
        <h2 className="font-medium">Contacts ({contacts.data?.length ?? 0})</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {contacts.data?.map((c) => (
            <li key={c.id} className="border-b border-hairline py-1">
              <span className="font-medium">{c.name}</span>
              {c.designation ? ` · ${c.designation}` : ""}
              {c.email ? ` · ${c.email}` : ""}
              {c.phone ? ` · ${c.phone}` : ""}
              {c.is_primary && <span className="ml-2 rounded bg-clear/20 px-1.5 py-0.5 text-xs">primary</span>}
            </li>
          ))}
          {contacts.data?.length === 0 && <li className="text-muted-ink">No contacts recorded.</li>}
        </ul>
        <ContactForm customerId={id} />
      </section>

      <section className="panel mt-6 p-4">
        <h2 className="font-medium">Purchase orders for this customer ({pos.data?.length ?? 0})</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {pos.data?.map((po) => (
            <li key={po.id} className="flex justify-between border-b border-hairline py-1">
              <Link href={`/orders/${po.id}`} className="mono hover:underline">{po.po_number}</Link>
              <span className="mono">{formatInr(Number(po.po_value))} · {po.status}</span>
            </li>
          ))}
          {pos.data?.length === 0 && <li className="text-muted-ink">No POs yet.</li>}
        </ul>
      </section>
    </AppShell>
  );
}
