/**
 * Reminder email templates — placeholders only.
 *
 * These build the exact subject line and body text a reminder would use, filled
 * with live record data, so the team can review the wording and send it from
 * their own mail client. Nothing here sends anything: there is no provider, no
 * cron and no queue (outbound messaging is deferred to Phase 2 in TECH-STACK).
 *
 * Everything is pure and unit-tested.
 */
import { daysUntilDeadline, formatInr, istDateString } from "@/lib/rules/dates";

export type EmailDraft = {
  key: string;
  name: string;
  audience: string;
  /** Where the mail would go; shown as guidance, never auto-resolved to a real address. */
  to: string;
  subject: string;
  body: string;
};

export type TemplateField = { token: string; description: string };

export type EmailTemplateSpec = {
  key: string;
  name: string;
  audience: string;
  purpose: string;
  fields: TemplateField[];
};

const SIGNATURE = ["Regards,", "Inverbras", "This is a system-generated placeholder — review before sending."].join(
  "\n",
);

export const EMAIL_TEMPLATE_CATALOGUE: EmailTemplateSpec[] = [
  {
    key: "rfi_deadline",
    name: "RFI submission deadline reminder",
    audience: "Internal — the assigned employee / Sales",
    purpose: "Sent inside the RFI reminder window so a tender submission deadline is not missed.",
    fields: [
      { token: "{{rfi_number}}", description: "Auto RFI number, e.g. RFI/2026/0004" },
      { token: "{{project_name}}", description: "Requirement project name" },
      { token: "{{customer_agency}}", description: "Government agency / customer" },
      { token: "{{submission_deadline}}", description: "Deadline date (IST)" },
      { token: "{{days_left}}", description: "Whole days remaining until the deadline" },
    ],
  },
  {
    key: "payment_due",
    name: "Payment due reminder",
    audience: "External — the customer",
    purpose: "Sent when an OEM invoice's payment due date is reached with a balance outstanding.",
    fields: [
      { token: "{{invoice_number}}", description: "OEM invoice number" },
      { token: "{{po_number}}", description: "Purchase order number" },
      { token: "{{gross_amount}}", description: "Invoice gross value (INR)" },
      { token: "{{balance_outstanding}}", description: "Unpaid balance (INR)" },
      { token: "{{payment_due_date}}", description: "Due date (IST)" },
      { token: "{{overdue_days}}", description: "Days past the due date" },
    ],
  },
  {
    key: "payment_escalation",
    name: "Overdue payment escalation",
    audience: "External — the customer, copied to management",
    purpose: "Sent when a payment is overdue past the escalation threshold.",
    fields: [
      { token: "{{invoice_number}}", description: "OEM invoice number" },
      { token: "{{po_number}}", description: "Purchase order number" },
      { token: "{{balance_outstanding}}", description: "Unpaid balance (INR)" },
      { token: "{{overdue_days}}", description: "Days past the due date" },
      { token: "{{escalation_to}}", description: "Escalation contact / role" },
    ],
  },
  {
    key: "document_expiry",
    name: "Document expiry reminder",
    audience: "Internal — Operations / Finance",
    purpose: "Sent before a compliance document or approval expires.",
    fields: [
      { token: "{{title}}", description: "Document title" },
      { token: "{{document_type}}", description: "Document type, e.g. RCMA, DGQA" },
      { token: "{{linked_to}}", description: "PO number, requirement or OEM it belongs to" },
      { token: "{{expiry_date}}", description: "Expiry date (IST)" },
      { token: "{{days_to_expiry}}", description: "Whole days remaining" },
    ],
  },
  {
    key: "certification_expiry",
    name: "OEM certification expiry reminder",
    audience: "Internal — Operations / Management",
    purpose: "Sent before an OEM certification or vendor approval lapses.",
    fields: [
      { token: "{{oem_name}}", description: "OEM name" },
      { token: "{{certification_type}}", description: "Certification type" },
      { token: "{{expiry_date}}", description: "Expiry date (IST)" },
      { token: "{{days_remaining}}", description: "Whole days remaining" },
      { token: "{{expiry_state}}", description: "Expired or due soon" },
    ],
  },
];

export function rfiDeadlineReminder(input: {
  rfiNumber: string;
  projectName: string;
  customerAgency: string;
  submissionDeadline: string;
  daysLeft: number;
  assignedTo?: string | null;
}): EmailDraft {
  const when = input.daysLeft <= 0 ? "due today" : `${input.daysLeft} day(s) from today`;
  return {
    key: "rfi_deadline",
    name: "RFI submission deadline reminder",
    audience: "Internal — the assigned employee / Sales",
    to: input.assignedTo ? `${input.assignedTo} (assigned employee)` : "assigned employee / Sales team",
    subject: `Reminder: ${input.rfiNumber} submission due ${istDateString(input.submissionDeadline)}`,
    body: [
      `Dear ${input.assignedTo ?? "Team"},`,
      "",
      `RFI ${input.rfiNumber} for ${input.projectName} (${input.customerAgency}) is due on ` +
        `${istDateString(input.submissionDeadline)} — ${when}.`,
      "",
      "Please confirm the quotation, technical documents and submission format are ready before the deadline.",
      "",
      SIGNATURE,
    ].join("\n"),
  };
}

export function paymentDueReminder(input: {
  invoiceNumber: string;
  poNumber: string;
  customer: string;
  grossAmount: number;
  balanceOutstanding: number;
  paymentDueDate: string | null;
  overdueDays: number;
}): EmailDraft {
  const due = input.paymentDueDate ? istDateString(input.paymentDueDate) : "not recorded";
  const overdue = input.overdueDays > 0 ? ` (${input.overdueDays} day(s) overdue)` : "";
  return {
    key: "payment_due",
    name: "Payment due reminder",
    audience: "External — the customer",
    to: `${input.customer} (customer contact)`,
    subject: `Payment reminder: invoice ${input.invoiceNumber} — ${formatInr(input.balanceOutstanding)} outstanding`,
    body: [
      `Dear ${input.customer},`,
      "",
      `Invoice ${input.invoiceNumber} against PO ${input.poNumber} shows an outstanding balance of ` +
        `${formatInr(input.balanceOutstanding)} of a gross value of ${formatInr(input.grossAmount)}.`,
      `Payment due date: ${due}${overdue}.`,
      "",
      "We request you to process the payment at the earliest. Please share the payment reference once done.",
      "",
      SIGNATURE,
    ].join("\n"),
  };
}

export function paymentEscalation(input: {
  invoiceNumber: string;
  poNumber: string;
  customer: string;
  balanceOutstanding: number;
  overdueDays: number;
  escalationTo: string;
}): EmailDraft {
  return {
    key: "payment_escalation",
    name: "Overdue payment escalation",
    audience: "External — the customer, copied to management",
    to: `${input.customer} (customer contact), copy to ${input.escalationTo}`,
    subject: `Escalation: invoice ${input.invoiceNumber} is ${input.overdueDays} days overdue`,
    body: [
      `Dear ${input.customer},`,
      "",
      `Invoice ${input.invoiceNumber} against PO ${input.poNumber} is ${input.overdueDays} day(s) overdue ` +
        `with a balance of ${formatInr(input.balanceOutstanding)}.`,
      `This has been escalated to ${input.escalationTo}.`,
      "",
      "Please treat this as a priority and confirm the payment timeline.",
      "",
      SIGNATURE,
    ].join("\n"),
  };
}

export function documentExpiryReminder(input: {
  title: string;
  documentType: string;
  linkedTo: string;
  expiryDate: string;
  daysToExpiry: number;
}): EmailDraft {
  const state = input.daysToExpiry < 0 ? "has expired" : "expires";
  return {
    key: "document_expiry",
    name: "Document expiry reminder",
    audience: "Internal — Operations / Finance",
    to: "Operations / Finance team",
    subject: `Document expiry: ${input.title} — ${istDateString(input.expiryDate)}`,
    body: [
      "Dear Team,",
      "",
      `The document "${input.title}" (${input.documentType}) linked to ${input.linkedTo} ` +
        `${state} on ${istDateString(input.expiryDate)} (${input.daysToExpiry} day(s) remaining).`,
      "",
      "Please arrange the renewal and upload the renewed copy to the document vault.",
      "",
      SIGNATURE,
    ].join("\n"),
  };
}

export function certificationExpiryReminder(input: {
  oemName: string;
  certificationType: string;
  expiryDate: string | null;
  daysRemaining: number | null;
  expiryState: string;
}): EmailDraft {
  const state =
    input.expiryState === "expired" ? "has expired" : input.expiryState === "due_soon" ? "is due soon" : "expires";
  const when = input.expiryDate ? ` on ${istDateString(input.expiryDate)}` : "";
  const remaining = input.daysRemaining !== null ? ` (${input.daysRemaining} day(s) remaining)` : "";
  return {
    key: "certification_expiry",
    name: "OEM certification expiry reminder",
    audience: "Internal — Operations / Management",
    to: "Operations / Management team",
    subject: `Certification expiry: ${input.oemName} — ${input.certificationType}`,
    body: [
      "Dear Team,",
      "",
      `OEM ${input.oemName} certification ${input.certificationType} ${state}${when}${remaining}.`,
      "",
      "Please obtain the renewed certificate and record its new validity in the OEM master.",
      "",
      SIGNATURE,
    ].join("\n"),
  };
}

/** Whole IST days from today until a deadline; re-exported so the page needs one import. */
export { daysUntilDeadline };
