import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * CSV export of a report view. CSV opens directly in Excel, and it keeps the
 * export dependency-free (no .xlsx library ships in the app). RLS scopes the
 * rows to the signed-in user because this uses their session.
 */
const REPORTS: Record<string, string> = {
  "revenue-by-client": "v_revenue_by_client",
  "revenue-by-oem": "v_revenue_by_oem",
  "product-sales": "v_product_sales",
  "monthly-sales": "v_monthly_sales",
  "pending-quotations": "v_pending_quotations",
  "po-tracking": "v_po_tracking",
  "delivery-status": "v_delivery_status",
  "invoice-aging": "v_invoice_balances",
  "outstanding-payments": "v_followup_tracker",
  "commission-receivable": "v_commission_receivable",
  "margin-report": "v_margin_report",
  "tax-summary": "v_tax_summary",
  profitability: "v_profitability",
};

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = typeof value === "object" ? JSON.stringify(value) : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function GET(request: Request) {
  const report = new URL(request.url).searchParams.get("report") ?? "";
  const view = REPORTS[report];
  if (!view) {
    return NextResponse.json({ error: `Unknown report "${report}".`, available: Object.keys(REPORTS) }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from(view as never).select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const rows = (data ?? []) as Array<Record<string, unknown>>;
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => csvCell(row[h])).join(",")),
  ];
  const csv = lines.join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${report}.csv"`,
    },
  });
}
