import { z } from "zod";

/**
 * Shared form-field building blocks. HTML forms always submit strings, so these
 * normalise empty input to null and reject malformed numbers/dates with a clear
 * reason — the same scheme reused by the Server Actions.
 */

export function optionalText(max = 500) {
  return z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null));
}

export function requiredText(message: string, max = 200) {
  return z.string().trim().min(1, message).max(max);
}

export function optionalNumber(options: { min?: number; max?: number; integer?: boolean } = {}) {
  return z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null))
    .refine((v) => {
      if (v === null) return true;
      const n = Number(v);
      if (!Number.isFinite(n)) return false;
      if (options.integer && !Number.isInteger(n)) return false;
      if (options.min !== undefined && n < options.min) return false;
      if (options.max !== undefined && n > options.max) return false;
      return true;
    }, "Enter a valid number")
    .transform((v) => (v === null ? null : Number(v)));
}

export function optionalDate() {
  return z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null))
    .refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), "Use the date picker (YYYY-MM-DD)")
    .transform((v) => v);
}

export function optionalUuid() {
  return z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null))
    .refine((v) => v === null || z.string().uuid().safeParse(v).success, "Invalid id");
}

export function checkbox() {
  return z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.undefined()])
    .transform((v) => v === "on" || v === "true");
}

export function requiredNumber(options: { min?: number; max?: number } = {}) {
  return z
    .string()
    .trim()
    .min(1, "This field is required")
    .refine((v) => {
      const n = Number(v);
      if (!Number.isFinite(n)) return false;
      if (options.min !== undefined && n < options.min) return false;
      if (options.max !== undefined && n > options.max) return false;
      return true;
    }, "Enter a valid number")
    .transform((v) => Number(v));
}
