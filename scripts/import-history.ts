#!/usr/bin/env node
/**
 * One-off historical ingestion (IMPLEMENTATION-PLAN Step 7). Server-side, run by
 * the team, never part of the deployed app. No `.xlsx` parser ships: export the
 * client workbook's sheets to CSV offline, then:
 *
 *   npm run import:history -- scripts/sample-history.csv            # dry run
 *   npm run import:history -- scripts/sample-history.csv --commit   # reviewed write
 *
 * The dry run prints a per-row rejection report and row-count reconciliation and
 * writes nothing. The commit path wraps every write in one transaction and sets
 * `app.import_mode = 'on'`, the reviewed exception that lets historical outcomes
 * (won/lost) load without inventing approval rows.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

import {
  buildImportPlan,
  parseHistoryCsv,
  reconcile,
  type ImportPlan,
} from "../src/lib/rules/history-import";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadDbUrl(): string {
  if (process.env.SUPABASE_DB_URL) return process.env.SUPABASE_DB_URL.trim();
  const text = readFileSync(join(root, ".env.local"), "utf8");
  for (const raw of text.split(/\r?\n/)) {
    const match = /^SUPABASE_DB_URL=(.*)$/.exec(raw.trim());
    if (match) return match[1].trim();
  }
  throw new Error("SUPABASE_DB_URL is not set (add it to .env.local).");
}

function requirementStatus(plan: ImportPlan, key: string): "won" | "lost" | "submitted" {
  const results = plan.quotations.filter((q) => q.requirementKey === key).map((q) => q.result);
  if (results.includes("won")) return "won";
  if (results.includes("lost")) return "lost";
  return "submitted";
}

function isoDate(value: string | null): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

async function main() {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith("--"));
  const commit = args.includes("--commit");
  if (!file) {
    console.error("Usage: npm run import:history -- <path.csv> [--commit] [--report <path.json>]");
    process.exit(1);
  }
  const reportIndex = args.indexOf("--report");
  const reportPath = reportIndex >= 0 ? args[reportIndex + 1] : join(root, "scripts", "import-report.json");

  const text = readFileSync(resolve(root, file), "utf8");
  const plan = buildImportPlan(parseHistoryCsv(text));

  let inserted = 0;
  let skipped = 0;
  if (commit) {
    const sql = postgres(loadDbUrl(), { max: 1, ssl: "require", prepare: false, onnotice: () => {} });
    try {
      await sql.begin(async (tx) => {
        await tx.unsafe("set local app.import_mode = 'on'");
        const oemIds = new Map<string, string>();
        for (const oem of plan.oems) {
          const [row] = await tx<{ id: string }[]>`
            insert into public.oems (name, brand_product_category)
            values (${oem.name}, ${oem.category})
            on conflict (name) do update set brand_product_category = coalesce(public.oems.brand_product_category, excluded.brand_product_category)
            returning id
          `;
          oemIds.set(oem.name, row.id);
        }

        const requirementIds = new Map<string, string>();
        const lineItemIds = new Map<string, string>();
        for (const req of plan.requirements) {
          const [existing] = await tx<{ id: string }[]>`
            select id from public.requirements
            where project_name = ${req.projectName} and customer_agency = ${req.customerAgency}
            limit 1
          `;
          if (existing) {
            requirementIds.set(req.key, existing.id);
            continue;
          }
          const [row] = await tx<{ id: string }[]>`
            insert into public.requirements
              (project_name, customer_agency, customer_division, gem_tender_number, status, pursue_decision)
            values
              (${req.projectName}, ${req.customerAgency}, ${req.customerDivision}, ${req.gemTenderNumber},
               ${requirementStatus(plan, req.key)}::public.requirement_status,
               ${requirementStatus(plan, req.key) === "lost" ? "not_pursued" : "pursued"}::public.pursue_decision)
            returning id
          `;
          if (row) requirementIds.set(req.key, row.id);
        }

        for (const line of plan.lineItems) {
          const requirementId = requirementIds.get(line.requirementKey);
          if (!requirementId) continue;
          const [existing] = await tx<{ id: string }[]>`
            select id from public.line_items
            where requirement_id = ${requirementId} and part_number = ${line.partNumber} limit 1
          `;
          const [row] = existing
            ? [existing]
            : await tx<{ id: string }[]>`
                insert into public.line_items
                  (requirement_id, line_no, part_number, description, quantity, uom)
                values
                  (${requirementId},
                   (select coalesce(max(line_no), 0) + 1 from public.line_items where requirement_id = ${requirementId}),
                   ${line.partNumber}, ${line.description}, ${line.quantity}, ${line.uom})
                returning id
              `;
          if (row) lineItemIds.set(`${line.requirementKey}||${line.partNumber}`, row.id);
        }

        const versions = new Map<string, number>();
        for (const quote of plan.quotations) {
          const requirementId = requirementIds.get(quote.requirementKey);
          if (!requirementId) continue;
          const lineItemId = lineItemIds.get(`${quote.requirementKey}||${quote.partNumber}`) ?? null;
          const oemId = quote.oemName ? oemIds.get(quote.oemName) ?? null : null;

          const [duplicate] = await tx<{ id: string }[]>`
            select id from public.quotations
            where requirement_id = ${requirementId}
              and line_item_id is not distinct from ${lineItemId}
              and oem_id is not distinct from ${oemId}
            limit 1
          `;
          if (duplicate) {
            skipped += 1;
            continue;
          }

          const version = (versions.get(quote.requirementKey) ?? 0) + 1;
          versions.set(quote.requirementKey, version);
          await tx`
            insert into public.quotations
              (requirement_id, oem_id, line_item_id, version, status, oem_price, final_price,
               loss_reason, l1_price, competitor, submitted_at)
            values
              (${requirementId}, ${oemId}, ${lineItemId}, ${version},
               ${quote.result}::public.quotation_status,
               ${quote.quotedPrice}, ${quote.finalPrice},
               ${quote.lossReason}::public.loss_reason,
               ${quote.l1Price}, ${quote.competitor},
               ${isoDate(quote.submissionDate)})
          `;
          inserted += 1;
        }
      });
    } finally {
      await sql.end();
    }
  }

  const imported = commit ? inserted : plan.records.length;
  const skippedDuplicates = commit ? skipped : 0;
  const balance = reconcile(plan.rowsRead, imported + skippedDuplicates, plan.rejected.length);
  const report = {
    mode: commit ? "commit" : "dry-run",
    rowsRead: plan.rowsRead,
    imported,
    skippedDuplicates,
    rejected: plan.rejected.length,
    reconciliation: balance,
    rejectedRows: plan.rejected,
    requirements: plan.requirements.length,
    oems: plan.oems.length,
    lineItems: plan.lineItems.length,
    quotations: plan.quotations.length,
  };

  writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");

  console.log(
    `Import ${report.mode}: rows read ${report.rowsRead}, imported ${imported}, skipped ${skippedDuplicates}, rejected ${plan.rejected.length}`,
  );
  console.log(`Reconciliation: ${balance.balanced ? "balanced" : `UNBALANCED by ${balance.difference}`}`);
  for (const row of plan.rejected) console.log(`  row ${row.rowNumber}: ${row.reason}`);
  console.log(`Report written to ${reportPath}`);
  if (!commit) console.log("Dry run: nothing was written. Re-run with --commit after reviewing the report.");
  if (!balance.balanced) process.exitCode = 2;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
