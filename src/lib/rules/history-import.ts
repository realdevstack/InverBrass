/**
 * Historical-ingestion rules (IMPLEMENTATION-PLAN Step 7).
 *
 * Pure and unit-tested: it turns a parsed client workbook export (CSV of the
 * Excel sheets) into a reviewed import plan, rejecting each bad row with a
 * reason instead of silently dropping or mis-mapping it. No `.xlsx` parser ships
 * in the app; the workbook is exported to CSV offline and this module (plus
 * `scripts/import-history.ts`) does the rest.
 */

export const LOSS_REASONS = [
  "price",
  "technical_non_compliance",
  "delivery_timeline",
  "competitor_preference",
  "quantity_or_capacity",
  "cancelled",
  "not_pursued",
  "other",
] as const;

export const IMPORT_RESULTS = [
  "draft",
  "submitted",
  "won",
  "lost",
  "cancelled",
] as const;

export type ImportResult = (typeof IMPORT_RESULTS)[number];

export type RawHistoryRow = Record<string, string>;

export type HistoryRecord = {
  rowNumber: number;
  projectName: string;
  customerAgency: string;
  customerDivision: string | null;
  gemTenderNumber: string | null;
  partNumber: string;
  description: string | null;
  quantity: number;
  uom: string | null;
  oemName: string;
  oemCategory: string | null;
  quotedPrice: number | null;
  finalPrice: number | null;
  result: ImportResult;
  lossReason: string | null;
  l1Price: number | null;
  competitor: string | null;
  submissionDate: string | null;
};

export type ImportRejection = { rowNumber: number; reason: string };

export type ImportPlan = {
  rowsRead: number;
  records: HistoryRecord[];
  rejected: ImportRejection[];
  requirements: Array<{
    key: string;
    projectName: string;
    customerAgency: string;
    customerDivision: string | null;
    gemTenderNumber: string | null;
  }>;
  oems: Array<{ name: string; category: string | null }>;
  lineItems: Array<{ requirementKey: string; partNumber: string; description: string | null; quantity: number; uom: string | null }>;
  quotations: Array<{
    requirementKey: string;
    partNumber: string;
    oemName: string;
    result: ImportResult;
    quotedPrice: number | null;
    finalPrice: number | null;
    lossReason: string | null;
    l1Price: number | null;
    competitor: string | null;
    submissionDate: string | null;
  }>;
};

/** Column aliases seen in workbook exports, mapped to canonical field names. */
const COLUMN_ALIASES: Record<string, string> = {
  project_name: "project_name",
  project: "project_name",
  rfi: "project_name",
  requirement: "project_name",
  customer_agency: "customer_agency",
  agency: "customer_agency",
  customer: "customer_agency",
  client: "customer_agency",
  customer_division: "customer_division",
  division: "customer_division",
  gem_tender_number: "gem_tender_number",
  tender_number: "gem_tender_number",
  gem: "gem_tender_number",
  part_number: "part_number",
  part: "part_number",
  part_no: "part_number",
  partno: "part_number",
  description: "description",
  desc: "description",
  quantity: "quantity",
  qty: "quantity",
  uom: "uom",
  unit: "uom",
  oem_name: "oem_name",
  oem: "oem_name",
  supplier: "oem_name",
  oem_category: "oem_category",
  category: "oem_category",
  quoted_price: "quoted_price",
  oem_price: "quoted_price",
  cost: "quoted_price",
  final_price: "final_price",
  quoted: "final_price",
  quote_price: "final_price",
  price: "final_price",
  result: "result",
  status: "result",
  outcome: "result",
  loss_reason: "loss_reason",
  reason: "loss_reason",
  l1_price: "l1_price",
  l1: "l1_price",
  competitor: "competitor",
  competitor_name: "competitor",
  submission_date: "submission_date",
  submitted_at: "submission_date",
  date: "submission_date",
};

function canonicalKey(header: string): string | null {
  const key = header.trim().toLowerCase().replace(/\s+/g, "_");
  return COLUMN_ALIASES[key] ?? null;
}

/** Minimal RFC-4180-ish parser: comma or tab separated, quoted fields supported. */
export function parseDelimited(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const delimiter = text.includes("\t") && !text.includes(",") ? "\t" : ",";

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char === "\r") {
      // ignore; \n handles the row break
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export function parseHistoryCsv(text: string): RawHistoryRow[] {
  const grid = parseDelimited(text).filter((r) => r.some((c) => c.trim().length > 0));
  if (grid.length === 0) return [];
  const headerRow = grid[0];
  const keys = headerRow.map(canonicalKey);
  const rows: RawHistoryRow[] = [];
  for (let r = 1; r < grid.length; r += 1) {
    const record: RawHistoryRow = {};
    grid[r].forEach((value, index) => {
      const key = keys[index];
      if (key) record[key] = value.trim();
    });
    rows.push(record);
  }
  return rows;
}

function asNumber(value: string | undefined): number | null | "invalid" {
  if (value === undefined || value.trim() === "") return null;
  const n = Number(value.replace(/,/g, ""));
  if (!Number.isFinite(n)) return "invalid";
  return n;
}

function normalizeResult(value: string): ImportResult | null {
  const v = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (v === "win" || v === "won_") return "won";
  if (v === "loss") return "lost";
  return (IMPORT_RESULTS as readonly string[]).includes(v) ? (v as ImportResult) : null;
}

export function validateHistoryRows(rows: RawHistoryRow[]): {
  records: HistoryRecord[];
  rejected: ImportRejection[];
} {
  const records: HistoryRecord[] = [];
  const rejected: ImportRejection[] = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 1;

    const projectName = (row.project_name ?? "").trim();
    if (!projectName) {
      rejected.push({ rowNumber, reason: "Missing project name" });
      return;
    }
    const customerAgency = (row.customer_agency ?? "").trim();
    if (!customerAgency) {
      rejected.push({ rowNumber, reason: "Missing customer / agency" });
      return;
    }
    const partNumber = (row.part_number ?? "").trim();
    if (!partNumber) {
      rejected.push({ rowNumber, reason: "Missing part number" });
      return;
    }
    const quantity = asNumber(row.quantity);
    if (quantity === "invalid" || quantity === null || quantity <= 0) {
      rejected.push({ rowNumber, reason: `Quantity must be a positive number (got "${row.quantity ?? ""}")` });
      return;
    }
    const result = normalizeResult(row.result ?? "");
    if (!result) {
      rejected.push({ rowNumber, reason: `Result must be one of: ${IMPORT_RESULTS.join(", ")} (got "${row.result ?? ""}")` });
      return;
    }
    const quotedPrice = asNumber(row.quoted_price);
    if (quotedPrice === "invalid" || (quotedPrice !== null && quotedPrice < 0)) {
      rejected.push({ rowNumber, reason: "quoted_price must be a non-negative number" });
      return;
    }
    const finalPrice = asNumber(row.final_price);
    if (finalPrice === "invalid" || (finalPrice !== null && finalPrice < 0)) {
      rejected.push({ rowNumber, reason: "final_price must be a non-negative number" });
      return;
    }
    const l1Price = asNumber(row.l1_price);
    if (l1Price === "invalid" || (l1Price !== null && l1Price < 0)) {
      rejected.push({ rowNumber, reason: "l1_price must be a non-negative number" });
      return;
    }
    const lossReasonRaw = (row.loss_reason ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
    if (lossReasonRaw && !(LOSS_REASONS as readonly string[]).includes(lossReasonRaw)) {
      rejected.push({ rowNumber, reason: `Unknown loss reason "${lossReasonRaw}"` });
      return;
    }

    records.push({
      rowNumber,
      projectName,
      customerAgency,
      customerDivision: row.customer_division?.trim() || null,
      gemTenderNumber: row.gem_tender_number?.trim() || null,
      partNumber,
      description: row.description?.trim() || null,
      quantity,
      uom: row.uom?.trim() || null,
      oemName: (row.oem_name ?? "").trim(),
      oemCategory: row.oem_category?.trim() || null,
      quotedPrice,
      finalPrice,
      result,
      lossReason: lossReasonRaw || null,
      l1Price,
      competitor: row.competitor?.trim() || null,
      submissionDate: row.submission_date?.trim() || null,
    });
  });

  return { records, rejected };
}

export function requirementKey(projectName: string, customerAgency: string): string {
  return `${projectName}||${customerAgency}`;
}

export function buildImportPlan(rows: RawHistoryRow[]): ImportPlan {
  const { records, rejected } = validateHistoryRows(rows);

  const requirements = new Map<string, ImportPlan["requirements"][number]>();
  const oems = new Map<string, { name: string; category: string | null }>();
  const lineItems = new Map<string, ImportPlan["lineItems"][number]>();
  const quotations: ImportPlan["quotations"] = [];

  for (const record of records) {
    const key = requirementKey(record.projectName, record.customerAgency);
    if (!requirements.has(key)) {
      requirements.set(key, {
        key,
        projectName: record.projectName,
        customerAgency: record.customerAgency,
        customerDivision: record.customerDivision,
        gemTenderNumber: record.gemTenderNumber,
      });
    }
    if (record.oemName && !oems.has(record.oemName)) {
      oems.set(record.oemName, { name: record.oemName, category: record.oemCategory });
    }
    const lineKey = `${key}||${record.partNumber}`;
    if (!lineItems.has(lineKey)) {
      lineItems.set(lineKey, {
        requirementKey: key,
        partNumber: record.partNumber,
        description: record.description,
        quantity: record.quantity,
        uom: record.uom,
      });
    }
    quotations.push({
      requirementKey: key,
      partNumber: record.partNumber,
      oemName: record.oemName,
      result: record.result,
      quotedPrice: record.quotedPrice,
      finalPrice: record.finalPrice,
      lossReason: record.lossReason,
      l1Price: record.l1Price,
      competitor: record.competitor,
      submissionDate: record.submissionDate,
    });
  }

  return {
    rowsRead: rows.length,
    records,
    rejected,
    requirements: [...requirements.values()],
    oems: [...oems.values()],
    lineItems: [...lineItems.values()],
    quotations,
  };
}

/** Row-count reconciliation: every row is either imported or rejected. */
export function reconcile(rowsRead: number, imported: number, rejected: number): {
  balanced: boolean;
  difference: number;
} {
  const difference = rowsRead - (imported + rejected);
  return { balanced: difference === 0, difference };
}
