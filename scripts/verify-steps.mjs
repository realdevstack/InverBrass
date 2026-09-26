#!/usr/bin/env node
/**
 * Read-only evidence for steps 5-13: row counts, the imported past-bid history,
 * the LD-risk row and the dashboard metrics. Prints a small JSON object only.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
function dbUrl() {
  if (process.env.SUPABASE_DB_URL) return process.env.SUPABASE_DB_URL.trim();
  for (const raw of readFileSync(join(root, ".env.local"), "utf8").split(/\r?\n/)) {
    const m = /^SUPABASE_DB_URL=(.*)$/.exec(raw.trim());
    if (m) return m[1].trim();
  }
  throw new Error("SUPABASE_DB_URL not set");
}

const sql = postgres(dbUrl(), { max: 1, ssl: "require", prepare: false, onnotice: () => {} });
try {
  const [counts] = await sql`
    select
      (select count(*)::int from public.requirements) as requirements,
      (select count(*)::int from public.quotations) as quotations,
      (select count(*)::int from public.oems) as oems,
      (select count(*)::int from public.purchase_orders) as purchase_orders,
      (select count(*)::int from public.pdis) as pdis,
      (select count(*)::int from public.oem_invoices) as oem_invoices,
      (select count(*)::int from public.payments) as payments,
      (select count(*)::int from public.commission_invoices) as commission_invoices,
      (select count(*)::int from public.documents) as documents
  `;
  const imported = await sql`
    select project_name, part_number, status, loss_reason
    from public.v_past_bids
    where project_name in ('Radar Module', 'Comms Unit')
    order by project_name, status
  `;
  const risk = await sql`
    select po_number, committed_deadline, days_to_deadline, production_status, latest_pdi_result
    from public.v_order_risk
    order by po_number
  `;
  const [metrics] = await sql`select * from public.v_dashboard_metrics`;
  const numbering = await sql`
    select rfi_number, project_name from public.requirements order by created_at limit 4
  `;
  const quotationNumbers = await sql`
    select quotation_number, status from public.quotations order by created_at limit 4
  `;
  const kpiRows = await sql`
    select
      (select count(*)::int from public.v_quotation_turnaround) as turnaround_rows,
      (select count(*)::int from public.v_delivery_adherence) as adherence_rows,
      (select count(*)::int from public.v_tax_summary) as tax_rows,
      (select count(*)::int from public.v_profitability) as profitability_rows
  `;

  const master = await sql`
    select
      (select count(*)::int from public.customers) as customers,
      (select count(*)::int from public.products) as products,
      (select count(*)::int from public.requirements where customer_id is not null) as requirements_linked_customer,
      (select count(*)::int from public.line_items where product_id is not null) as lines_linked_product,
      (select count(*)::int from public.purchase_orders where customer_id is not null) as pos_linked_customer,
      (select count(*)::int from public.pdis) as pdis
  `;

  console.log(JSON.stringify({ counts, master, imported, risk, metrics, numbering, quotationNumbers, kpiRows }, null, 2));
} finally {
  await sql.end();
}
