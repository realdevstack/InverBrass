import { z } from "zod";

import { checkbox, optionalDate, optionalNumber, optionalText, optionalUuid, requiredNumber, requiredText } from "@/lib/validation/common";

export const purchaseOrderSchema = z.object({
  quotation_id: z.string().uuid("Choose an approved quotation"),
  po_number: requiredText("PO number is required", 100),
  po_date: z
    .string()
    .trim()
    .min(1, "PO date is required")
    .refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v), "PO date must be YYYY-MM-DD"),
  customer: requiredText("Customer is required", 200),
  oem_id: optionalUuid(),
  line_item_id: optionalUuid(),
  part_number: optionalText(200),
  quantity_ordered: requiredNumber({ min: 0.001 }),
  unit_price: requiredNumber({ min: 0 }),
  po_value: requiredNumber({ min: 0 }),
  taxes_gst: optionalNumber({ min: 0 }),
  delivery_schedule: optionalText(300),
  committed_deadline: optionalDate(),
  partial_delivery_allowed: checkbox(),
  pdi_required: checkbox(),
  pdi_mode: z.enum(["vc", "physical"]).optional(),
  documentation_required: optionalText(500),
  warranty_terms: optionalText(300),
  payment_terms: optionalText(300),
  special_conditions: optionalText(1000),
  pdi_inspector: optionalText(300),
});

export const verificationSchema = z.object({
  purchase_order_id: z.string().uuid(),
  verification_spec_match: checkbox(),
  verification_price_match: checkbox(),
  verification_feasibility: checkbox(),
  verification_documents_complete: checkbox(),
});

export const signoffSchema = z.object({
  purchase_order_id: z.string().uuid(),
});

export const poStatusSchema = z.object({
  purchase_order_id: z.string().uuid(),
  status: z.enum(["open", "processing", "completed", "cancelled"]),
});
