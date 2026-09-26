/**
 * The role/area permission matrix, mirrored from the database helpers
 * `role_can_read` / `role_can_write`. The database is the enforcement boundary
 * (RLS); this mirror only drives navigation and hides actions the user cannot
 * perform. `tests/sql/access-parity.test.ts` asserts the two never drift.
 */

export type AppRole = "owner" | "group_head" | "management" | "sales" | "operations" | "finance";

export const AREAS = [
  "requirements",
  "oem",
  "sourcing",
  "quotation",
  "order",
  "fulfilment",
  "finance",
  "documents",
  "master",
  "admin",
] as const;

export type Area = (typeof AREAS)[number];

export const APP_ROLES: AppRole[] = [
  "owner",
  "group_head",
  "management",
  "sales",
  "operations",
  "finance",
];

const ALL: Area[] = [...AREAS];

// Narrower than writes, and deliberately different per role so the navigation
// is meaningful: Sales owns RFI → sourcing → quotation, Operations owns
// order → fulfilment, Finance owns order → finance.
export const READ_MATRIX: Record<AppRole, Area[]> = {
  owner: ALL,
  group_head: ALL,
  management: ALL,
  sales: ["requirements", "oem", "sourcing", "quotation", "documents", "master"],
  operations: ["requirements", "oem", "order", "fulfilment", "documents", "master"],
  finance: ["requirements", "oem", "order", "finance", "documents", "master"],
};

export const WRITE_MATRIX: Record<AppRole, Area[]> = {
  owner: ALL,
  group_head: ["requirements", "oem", "sourcing", "quotation", "order", "documents", "master", "admin"],
  management: ["requirements", "oem", "sourcing", "quotation", "order", "documents", "master", "admin"],
  sales: ["requirements", "oem", "sourcing", "quotation", "documents", "master"],
  operations: ["order", "fulfilment", "documents"],
  finance: ["finance", "documents"],
};

export function canRead(role: AppRole | null | undefined, area: Area): boolean {
  if (!role) return false;
  return READ_MATRIX[role].includes(area);
}

export function canWrite(role: AppRole | null | undefined, area: Area): boolean {
  if (!role) return false;
  return WRITE_MATRIX[role].includes(area);
}

export function isApprover(role: AppRole | null | undefined): boolean {
  return role === "owner" || role === "group_head" || role === "management";
}
