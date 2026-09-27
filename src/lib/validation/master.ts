import { z } from "zod";

import { checkbox, optionalNumber, optionalText, optionalUuid, requiredText } from "@/lib/validation/common";

export const customerSchema = z.object({
  name: requiredText("Customer name is required"),
  division: optionalText(120),
  sub_division: optionalText(120),
  billing_address: optionalText(500),
  delivery_address: optionalText(500),
  gst_number: optionalText(60),
  gem_registration: optionalText(200),
  inverbras_vendor_registration: optionalText(200),
  portal_login_mapping: optionalText(200),
  payment_terms: optionalText(300),
  approval_requirements: optionalText(300),
});

export const customerContactSchema = z.object({
  customer_id: z.string().uuid(),
  name: requiredText("Contact name is required", 120),
  designation: optionalText(120),
  email: optionalText(200),
  phone: optionalText(60),
  is_primary: checkbox(),
});

export const productSchema = z.object({
  part_number: requiredText("Part number is required", 120),
  client_part_number: optionalText(120),
  description: optionalText(500),
  hsn_code: optionalText(30),
  oem_id: optionalUuid(),
  uom: optionalText(30),
  product_category: optionalText(120),
  technical_specifications: optionalText(1000),
  shelf_life: optionalText(120),
  export_restriction: optionalText(200),
  lead_time_days: optionalNumber({ min: 0, integer: true }),
  moq: optionalNumber({ min: 0 }),
  standard_price: optionalNumber({ min: 0 }),
  currency: optionalText(8),
});
