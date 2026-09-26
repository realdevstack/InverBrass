#!/usr/bin/env node
/** Prints demo-data row counts and the coverage/capacity views, for evidence. */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const text = readFileSync(join(root, ".env.local"), "utf8");
const match = /^SUPABASE_DB_URL=(.*)$/m.exec(text);
const sql = postgres(match[1].trim(), { max: 1, ssl: "require", prepare: false, onnotice: () => {} });

try {
  const [counts] = await sql`
    select
      (select count(*)::int from public.oems) as oems,
      (select count(*)::int from public.requirements) as requirements,
      (select count(*)::int from public.line_items) as line_items,
      (select count(*)::int from public.quantity_commitments) as quantity_commitments,
      (select count(*)::int from public.quotations) as quotations,
      (select count(*)::int from public.purchase_orders) as purchase_orders,
      (select count(*)::int from public.pdis) as pdis,
      (select count(*)::int from public.oem_invoices) as oem_invoices,
      (select count(*)::int from public.payments) as payments,
      (select count(*)::int from public.commission_invoices) as commission_invoices,
      (select count(*)::int from public.documents) as documents
  `;
  console.log("COUNTS", JSON.stringify(counts));

  const coverage = await sql`
    select requirement_id, required_quantity, firm_committed, uncovered_quantity
    from public.v_requirement_coverage
    order by requirement_id
  `;
  console.log("COVERAGE", JSON.stringify(coverage));

  const capacity = await sql`
    select name, capacity, committed_quantity, available_quantity
    from public.v_oem_capacity order by name
  `;
  console.log("CAPACITY", JSON.stringify(capacity));
} finally {
  await sql.end();
}
