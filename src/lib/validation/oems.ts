import { z } from "zod";

import {
  checkbox,
  optionalDate,
  optionalNumber,
  optionalText,
  optionalUuid,
  requiredText,
} from "@/lib/validation/common";

export const oemInputSchema = z.object({
  name: requiredText("OEM name is required"),
  brand_product_category: optionalText(200),
  country_of_origin: optionalText(100),
  product_portfolio: optionalText(1000),
  moq_rules: optionalText(300),
  lead_time_days: optionalNumber({ min: 0, integer: true }),
  pricing_validity: optionalText(200),
  freight_terms: optionalText(200),
  warranty_terms: optionalText(200),
  payment_terms: optionalText(300),
  commission_percentage: optionalNumber({ min: 0, max: 100 }),
  nda_status: optionalText(100),
  bank_details: optionalText(500),
  capacity: optionalNumber({ min: 0 }),
  govt_vendor_list_status: z.enum(["approved", "not_approved", "pending", "unknown"]),
  govt_vendor_list_source: optionalText(300),
});

export type OemInput = z.infer<typeof oemInputSchema>;

export const oemContactSchema = z.object({
  oem_id: z.string().uuid(),
  name: requiredText("Contact name is required"),
  designation: optionalText(120),
  email: optionalText(200),
  phone: optionalText(60),
  is_primary: checkbox(),
  notes: optionalText(500),
});

export const oemCertificationSchema = z.object({
  oem_id: z.string().uuid(),
  certification_type: requiredText("Certification type is required"),
  reference_number: optionalText(120),
  issued_by: optionalText(200),
  issue_date: optionalDate(),
  expiry_date: optionalDate(),
  reminder_days: optionalNumber({ min: 0, integer: true }),
  document_id: optionalUuid(),
});
