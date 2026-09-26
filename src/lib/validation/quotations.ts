import { z } from "zod";

import { optionalDate, optionalNumber, optionalText, optionalUuid } from "@/lib/validation/common";

/** Tri-state yes/no/unknown for compliance flags. */
function triBool() {
  return z
    .union([z.literal(""), z.literal("true"), z.literal("false"), z.undefined()])
    .transform((v) => (v === "true" ? true : v === "false" ? false : null));
}

export const quotationInputSchema = z.object({
  requirement_id: z.string().uuid(),
  oem_id: optionalUuid(),
  line_item_id: optionalUuid(),
  currency: optionalText(8),
  oem_quotation_number: optionalText(100),
  quotation_date: optionalDate(),
  unit_price: optionalNumber({ min: 0 }),
  quantity: optionalNumber({ min: 0 }),
  oem_price: optionalNumber({ min: 0 }),
  freight_amount: optionalNumber({ min: 0 }),
  gst_amount: optionalNumber({ min: 0 }),
  discount_amount: optionalNumber({ min: 0 }),
  target_margin_percentage: optionalNumber({ min: -100, max: 100 }),
  recommended_price: optionalNumber({ min: 0 }),
  final_price: optionalNumber({ min: 0 }),
  validity_days: optionalNumber({ min: 0, integer: true }),
  internal_notes: optionalText(2000),
  delivery_terms: optionalText(300),
  lead_time_days: optionalNumber({ min: 0, integer: true }),
  payment_terms: optionalText(300),
  export_format: optionalText(200),
  pnc_status: z.enum(["not_applicable", "pending", "in_progress", "completed"]),
  technical_compliance: triBool(),
  commercial_compliance: triBool(),
});

export type QuotationInput = z.infer<typeof quotationInputSchema>;

export const quotationUpdateSchema = quotationInputSchema.extend({
  quotation_id: z.string().uuid(),
});

export const lossCaptureSchema = z.object({
  quotation_id: z.string().uuid(),
  loss_reason: z.enum([
    "price",
    "technical_non_compliance",
    "delivery_timeline",
    "competitor_preference",
    "quantity_or_capacity",
    "cancelled",
    "not_pursued",
    "other",
  ]),
  l1_price: optionalNumber({ min: 0 }),
  competitor: optionalText(200),
});

export const QUOTATION_STATUSES = [
  "draft",
  "pending_group_head",
  "pending_management",
  "approved",
  "submitted",
  "clarification_requested",
  "technical_clarification",
  "commercial_negotiation",
  "awaiting_approval",
  "won",
  "lost",
  "cancelled",
] as const;

export const quotationStatusSchema = z.object({
  quotation_id: z.string().uuid(),
  status: z.enum(QUOTATION_STATUSES),
});

export const approvalSchema = z.object({
  quotation_id: z.string().uuid(),
  level: z.enum(["group_head", "management"]),
  decision: z.enum(["approved", "rejected"]),
  note: optionalText(500),
});
