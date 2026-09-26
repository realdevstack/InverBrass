/**
 * Pure line-item parsing for bulk paste entry (PRD Module 1: up to 500 part
 * numbers per requirement). The database stores each line as a real row; this
 * turns pasted text (tab, comma or 2+ spaces separated) into rows, rejecting
 * bad lines with a reason instead of silently dropping them.
 *
 * Columns: part number, description, quantity, uom, required delivery date,
 * and an optional trailing client part number (the workbook's second part
 * number, "corresponding client part number").
 */

export const MAX_LINE_ITEMS = 500;

export type ParsedLineItem = {
  line_no: number;
  part_number: string;
  client_part_number: string | null;
  description: string | null;
  quantity: number;
  uom: string | null;
  required_delivery_date: string | null;
};

export type LineItemParseError = { line: number; raw: string; reason: string };

export type LineItemParseResult = {
  rows: ParsedLineItem[];
  errors: LineItemParseError[];
};

function splitColumns(line: string): string[] {
  if (line.includes("\t")) return line.split("\t").map((c) => c.trim());
  if (line.includes(",")) return line.split(",").map((c) => c.trim());
  return line.split(/\s{2,}/).map((c) => c.trim());
}

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseDeliveryDate(value: string): string | null | "invalid" {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = DATE_RE.exec(trimmed);
  if (!match) return "invalid";
  const [, y, m, d] = match;
  const date = new Date(`${y}-${m}-${d}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "invalid";
  if (date.getUTCFullYear() !== Number(y) || date.getUTCMonth() + 1 !== Number(m) || date.getUTCDate() !== Number(d)) {
    return "invalid";
  }
  return `${y}-${m}-${d}`;
}

export function parseLineItemsBulk(
  text: string,
  max: number = MAX_LINE_ITEMS,
): LineItemParseResult {
  const rows: ParsedLineItem[] = [];
  const errors: LineItemParseError[] = [];

  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i];
    if (!raw.trim() || raw.trim().startsWith("#")) continue;

    const cols = splitColumns(raw.trim());
    const [partNumber = "", description = "", quantityText = "", uom = "", delivery = "", clientPart = ""] = cols;

    if (cols.length < 3) {
      errors.push({ line: i + 1, raw, reason: "Expected at least: part number, description, quantity" });
      continue;
    }
    if (!partNumber) {
      errors.push({ line: i + 1, raw, reason: "Part number is required" });
      continue;
    }
    const quantity = Number(quantityText);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      errors.push({ line: i + 1, raw, reason: `Quantity must be a positive number (got "${quantityText}")` });
      continue;
    }
    const parsedDate = delivery ? parseDeliveryDate(delivery) : null;
    if (parsedDate === "invalid") {
      errors.push({ line: i + 1, raw, reason: `Required delivery date must be YYYY-MM-DD (got "${delivery}")` });
      continue;
    }
    if (rows.length >= max) {
      errors.push({ line: i + 1, raw, reason: `Only ${max} line items are allowed per requirement` });
      continue;
    }

    rows.push({
      line_no: rows.length + 1,
      part_number: partNumber,
      client_part_number: clientPart || null,
      description: description || null,
      quantity,
      uom: uom || null,
      required_delivery_date: parsedDate,
    });
  }

  return { rows, errors };
}
