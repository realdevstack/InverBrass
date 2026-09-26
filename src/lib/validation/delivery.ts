import { z } from "zod";

import { checkbox, optionalDate, optionalNumber, optionalText, optionalUuid, requiredNumber, requiredText } from "@/lib/validation/common";

export const MATERIAL_STATUSES = [
  "not_started",
  "in_production",
  "ready",
  "qc_pending",
  "qc_passed",
  "qc_failed",
] as const;

export const materialReadinessSchema = z.object({
  purchase_order_id: z.string().uuid(),
  line_item_id: optionalUuid(),
  batch_number: optionalText(120),
  serial_number: optionalText(200),
  quantity_ready: optionalNumber({ min: 0 }),
  production_status: z.enum(MATERIAL_STATUSES),
  qc_status: z.enum(MATERIAL_STATUSES),
  tentative_pdi_date: optionalDate(),
  expected_completion_date: optionalDate(),
  remarks: optionalText(1000),
});

export const pdiSchema = z.object({
  purchase_order_id: z.string().uuid(),
  material_readiness_id: optionalUuid(),
  line_item_id: optionalUuid(),
  inspector_details: optionalText(300),
  dispatch_clearance: z.enum(["pending", "approved", "hold"]),
  inspection_type: z.enum(["vc", "physical"]),
  inspection_agency: z.enum(["dgqa", "client_agency", "internal", "third_party"]),
  scheduled_date: optionalDate(),
  conducted_date: optionalDate(),
  quantity_offered: requiredNumber({ min: 0 }),
  quantity_cleared: optionalNumber({ min: 0 }),
  quantity_rejected: optionalNumber({ min: 0 }),
  rejection_remarks: optionalText(1000),
  re_pdi_required: checkbox(),
});

export const extensionRequestSchema = z.object({
  purchase_order_id: z.string().uuid(),
  extension_note: requiredText("Give a reason for the extension request", 1000),
});
