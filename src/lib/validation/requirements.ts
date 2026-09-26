import { z } from "zod";

/**
 * One Zod schema for the RFI, reused by the Server Action (and, later, the
 * client form) so validation cannot drift between the two.
 */

const optionalText = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((v) => (v && v.length > 0 ? v : null));

export const requirementInputSchema = z.object({
  project_name: z.string().trim().min(1, "Project name is required").max(200),
  customer_agency: z.string().trim().min(1, "Customer / agency is required").max(200),
  customer_division: optionalText,
  customer_sub_division: optionalText,
  source: z.enum(["email", "gem_portal", "client_portal", "direct_customer", "through_oem"], {
    message: "Choose a source of enquiry",
  }),
  gem_tender_number: optionalText,
  bid_type: z.enum(["single", "double"]),
  submission_type: z.enum(["hard_copy", "soft_copy", "both"]),
  special_remarks: z.enum(["rcma", "cemilac", "lcso", "mil", "none"]),
  submission_deadline: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? new Date(v).toISOString() : null))
    .refine((v) => v === null || !Number.isNaN(Date.parse(v)), "Submission deadline is not a valid date"),
  assigned_employee_id: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  primary_oem_id: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  quotation_validity_days: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null))
    .refine((v) => v === null || (Number.isFinite(Number(v)) && Number(v) >= 0), "Enter a valid number of days")
    .transform((v) => (v === null ? null : Number(v))),
  staggered_delivery: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.undefined()])
    .transform((v) => v === "on" || v === "true"),
  remarks: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  line_items_text: z.string().optional(),
});

export type RequirementInput = z.infer<typeof requirementInputSchema>;

export const pursueDecisionSchema = z.object({
  requirement_id: z.string().uuid(),
  pursue_decision: z.enum(["undecided", "pursued", "not_pursued"]),
  regret_letter_logged: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.undefined()])
    .transform((v) => v === "on" || v === "true"),
});
