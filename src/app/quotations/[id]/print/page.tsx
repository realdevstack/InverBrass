import Link from "next/link";
import { notFound } from "next/navigation";

import { formatInr, istDateString } from "@/lib/rules/dates";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Print-friendly quotation. "PDF generation" is done by the browser's print to
 * PDF, so no PDF library ships in the app (TECH-STACK keeps the surface small).
 * The agency-specific layout is chosen by export_format on the quotation.
 */
export default async function QuotationPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: quotation } = await supabase.from("quotations").select("*").eq("id", id).maybeSingle();
  if (!quotation) notFound();

  const [requirement, oem, line, company] = await Promise.all([
    supabase.from("requirements").select("*").eq("id", quotation.requirement_id).maybeSingle(),
    supabase.from("oems").select("name, payment_terms, lead_time_days").eq("id", quotation.oem_id ?? "00000000-0000-0000-0000-000000000000").maybeSingle(),
    supabase.from("line_items").select("part_number, client_part_number, description, quantity, uom").eq("id", quotation.line_item_id ?? "00000000-0000-0000-0000-000000000000").maybeSingle(),
    Promise.resolve(null),
  ]);
  void company;

  const total =
    (quotation.final_price === null ? 0 : Number(quotation.final_price)) +
    (quotation.gst_amount === null ? 0 : Number(quotation.gst_amount)) -
    (quotation.discount_amount === null ? 0 : Number(quotation.discount_amount));

  return (
    <div className="mx-auto max-w-3xl bg-white p-8 text-near-black">
      <div className="flex items-start justify-between border-b border-hairline pb-3">
        <div>
          <h1 className="text-xl font-semibold">Quotation {quotation.quotation_number ?? ""}</h1>
          <p className="text-sm text-muted-ink">
            Version {quotation.version} · {quotation.currency ?? "INR"} · {quotation.export_format ?? "Standard format"}
          </p>
        </div>
        <Link href={`/quotations/${id}`} className="btn-outline print:hidden">Back</Link>
      </div>

      <section className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="label">Customer / agency</p>
          <p>{requirement.data?.customer_agency ?? "—"}</p>
          {requirement.data?.customer_division ? <p className="text-muted-ink">{requirement.data.customer_division}</p> : null}
          {requirement.data?.gem_tender_number ? <p className="mono text-xs">GeM: {requirement.data.gem_tender_number}</p> : null}
        </div>
        <div className="text-right">
          <p className="label">Project</p>
          <p>{requirement.data?.project_name ?? "—"}</p>
          <p className="text-muted-ink">RFI {requirement.data?.rfi_number ?? ""}</p>
        </div>
      </section>

      <table className="mt-6 w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-near-black/40">
            <th className="py-2">Part number</th>
            <th className="py-2">Client part</th>
            <th className="py-2">Description</th>
            <th className="py-2 text-right">Qty</th>
            <th className="py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-hairline">
            <td className="mono py-2 text-xs">{line.data?.part_number ?? "—"}</td>
            <td className="mono py-2 text-xs">{line.data?.client_part_number ?? "—"}</td>
            <td className="py-2">{line.data?.description ?? "—"}</td>
            <td className="mono py-2 text-right">
              {line.data ? `${Number(line.data.quantity).toLocaleString("en-IN")} ${line.data.uom ?? ""}` : "—"}
            </td>
            <td className="mono py-2 text-right">{quotation.final_price === null ? "—" : formatInr(Number(quotation.final_price))}</td>
          </tr>
        </tbody>
      </table>

      <section className="mt-4 ml-auto w-full max-w-xs text-sm">
        <div className="flex justify-between border-b border-hairline py-1"><span>Price</span><span className="mono">{quotation.final_price === null ? "—" : formatInr(Number(quotation.final_price))}</span></div>
        <div className="flex justify-between border-b border-hairline py-1"><span>GST</span><span className="mono">{quotation.gst_amount === null ? "—" : formatInr(Number(quotation.gst_amount))}</span></div>
        <div className="flex justify-between border-b border-hairline py-1"><span>Discount</span><span className="mono">{quotation.discount_amount === null ? "—" : formatInr(Number(quotation.discount_amount))}</span></div>
        <div className="flex justify-between py-1 font-semibold"><span>Total</span><span className="mono">{formatInr(total)}</span></div>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="label">Delivery terms</p>
          <p>{quotation.delivery_terms ?? "—"}</p>
          <p className="label mt-2">Lead time</p>
          <p>{quotation.lead_time_days ?? oem.data?.lead_time_days ?? "—"} days</p>
        </div>
        <div>
          <p className="label">Payment terms</p>
          <p>{quotation.payment_terms ?? oem.data?.payment_terms ?? "—"}</p>
          <p className="label mt-2">Validity</p>
          <p>{quotation.validity_days ? `${quotation.validity_days} days` : requirement.data?.quotation_validity_days ? `${requirement.data.quotation_validity_days} days` : "—"}</p>
        </div>
      </section>

      <p className="mt-6 text-xs text-muted-ink">
        Generated from stored data on {istDateString(new Date())}. PNC status: {(quotation.pnc_status ?? "").replace(/_/g, " ")}.
      </p>
    </div>
  );
}
