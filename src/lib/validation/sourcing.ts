import { z } from "zod";

import {
  checkbox,
  optionalDate,
  optionalNumber,
  optionalText,
  optionalUuid,
  requiredNumber,
} from "@/lib/validation/common";

export const sourcingRequestSchema = z.object({
  requirement_id: z.string().uuid(),
  oem_id: z.string().uuid("Choose an OEM"),
  line_item_id: optionalUuid(),
  channel: z.enum(["email", "whatsapp", "phone", "portal", "other"]),
  subject: optionalText(300),
  message: optionalText(2000),
});

export const sourcingResponseSchema = z.object({
  sourcing_request_id: z.string().uuid(),
  response_type: z.enum(["no_response", "price_indication", "availability", "firm_quote", "decline"]),
  response_text: optionalText(2000),
  quoted_unit_price: optionalNumber({ min: 0 }),
  lead_time_days: optionalNumber({ min: 0, integer: true }),
  valid_until: optionalDate(),
});

export const commitmentSchema = z.object({
  requirement_id: z.string().uuid(),
  oem_id: z.string().uuid("Choose an OEM"),
  line_item_id: optionalUuid(),
  quantity: requiredNumber({ min: 0.001 }),
  firm: checkbox(),
  source: optionalText(200),
  notes: optionalText(500),
});
