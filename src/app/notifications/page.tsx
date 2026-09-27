import { AppShell } from "@/components/app-shell";
import { canRead, type AppRole } from "@/lib/rules/access";
import { daysUntilDeadline } from "@/lib/rules/dates";
import {
  EMAIL_TEMPLATE_CATALOGUE,
  certificationExpiryReminder,
  documentExpiryReminder,
  paymentDueReminder,
  paymentEscalation,
  rfiDeadlineReminder,
  type EmailDraft,
} from "@/lib/rules/email-templates";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Overdue payments older than this get the escalation wording. */
const ESCALATION_AFTER_DAYS = 30;

function mailtoHref(draft: EmailDraft): string {
  const query = new URLSearchParams({ subject: draft.subject, body: draft.body });
  return `mailto:?${query.toString()}`;
}

function DraftCard({ draft }: { draft: EmailDraft }) {
  return (
    <li className="panel p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">{draft.name}</p>
        <a href={mailtoHref(draft)} className="btn-outline text-xs">Open in mail client</a>
      </div>
      <p className="mt-1 text-xs text-muted-ink">
        <span className="label">To</span> {draft.to}
      </p>
      <p className="mt-2 text-sm">
        <span className="label">Subject</span> {draft.subject}
      </p>
      <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded border border-hairline bg-content p-3 text-sm">
        {draft.body}
      </pre>
    </li>
  );
}

function DraftSection({ title, note, drafts }: { title: string; note: string; drafts: EmailDraft[] }) {
  return (
    <div className="mt-4">
      <h3 className="font-medium">{title}</h3>
      <p className="text-xs text-muted-ink">{note}</p>
      {drafts.length === 0 ? (
        <p className="mt-2 rounded border border-hairline bg-content p-3 text-sm text-muted-ink">
          Nothing here right now — the template is still shown in the catalogue below.
        </p>
      ) : (
        <ul className="mt-2 space-y-3">
          {drafts.map((draft, index) => (
            <DraftCard key={`${draft.key}-${index}`} draft={draft} />
          ))}
        </ul>
      )}
    </div>
  );
}

const SAMPLE_DRAFTS: EmailDraft[] = [
  paymentDueReminder({
    invoiceNumber: "INV/2026/9001",
    poNumber: "PO/EXAMPLE/2026/001",
    customer: "Example Customer",
    grossAmount: 14750000,
    balanceOutstanding: 4425000,
    paymentDueDate: "2026-10-25",
    overdueDays: 12,
  }),
  paymentEscalation({
    invoiceNumber: "INV/2026/9001",
    poNumber: "PO/EXAMPLE/2026/001",
    customer: "Example Customer",
    balanceOutstanding: 4425000,
    overdueDays: 45,
    escalationTo: "Management",
  }),
  rfiDeadlineReminder({
    rfiNumber: "RFI/2026/9001",
    projectName: "Example Radio Requirement",
    customerAgency: "Example Agency",
    submissionDeadline: "2026-10-05",
    daysLeft: 4,
    assignedTo: "Sales Team",
  }),
  documentExpiryReminder({
    title: "Example DGQA certificate",
    documentType: "dgqa",
    linkedTo: "PO/EXAMPLE/2026/001",
    expiryDate: "2026-11-30",
    daysToExpiry: 60,
  }),
  certificationExpiryReminder({
    oemName: "Example OEM",
    certificationType: "vendor approval",
    expiryDate: "2026-11-30",
    daysRemaining: 60,
    expiryState: "due_soon",
  }),
];

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: AppRole | null = null;
  if (user) {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
    role = (data?.role as AppRole | undefined) ?? null;
  }

  const canFinance = canRead(role, "finance");
  const canDocs = canRead(role, "documents");
  const canOem = canRead(role, "oem");
  const canReq = canRead(role, "requirements");

  const [overdue, expiringDocs, certs, openRfis] = await Promise.all([
    supabase
      .from("v_followup_tracker")
      .select("*")
      .gt("overdue_days", 0)
      .order("overdue_days", { ascending: false })
      .limit(20),
    supabase
      .from("v_document_register")
      .select("*")
      .not("days_to_expiry", "is", null)
      .lte("days_to_expiry", 90)
      .order("days_to_expiry", { ascending: true })
      .limit(20),
    supabase
      .from("v_oem_certification_expiry")
      .select("*")
      .in("expiry_state", ["expired", "due_soon"])
      .order("days_remaining", { ascending: true })
      .limit(20),
    supabase
      .from("requirements")
      .select("id, rfi_number, project_name, customer_agency, submission_deadline, reminder_days_before")
      .in("status", ["received", "qualifying", "quoted"])
      .not("submission_deadline", "is", null)
      .order("submission_deadline", { ascending: true })
      .limit(50),
  ]);

  const overdueDrafts: EmailDraft[] = (overdue.data ?? []).map((row) => {
    const base = {
      invoiceNumber: row.invoice_number ?? "—",
      poNumber: "linked PO",
      customer: row.customer ?? "Customer",
      balanceOutstanding: Number(row.balance_outstanding ?? 0),
      overdueDays: Number(row.overdue_days ?? 0),
    };
    if (base.overdueDays > ESCALATION_AFTER_DAYS) {
      return paymentEscalation({ ...base, escalationTo: "Management" });
    }
    return paymentDueReminder({
      invoiceNumber: base.invoiceNumber,
      poNumber: base.poNumber,
      customer: base.customer,
      grossAmount: Number(row.balance_outstanding ?? 0) + Number(row.paid_amount ?? 0),
      balanceOutstanding: base.balanceOutstanding,
      paymentDueDate: row.payment_due_date ?? null,
      overdueDays: base.overdueDays,
    });
  });

  const documentDrafts: EmailDraft[] = (expiringDocs.data ?? []).map((doc) =>
    documentExpiryReminder({
      title: doc.title ?? doc.file_name ?? "Document",
      documentType: (doc.document_type ?? "document").replace(/_/g, " "),
      linkedTo: doc.po_number ? `PO ${doc.po_number}` : doc.project_name ?? doc.oem_name ?? "the requirement",
      expiryDate: doc.expiry_date ?? "",
      daysToExpiry: Number(doc.days_to_expiry ?? 0),
    }),
  );

  const certificationDrafts: EmailDraft[] = (certs.data ?? []).map((cert) =>
    certificationExpiryReminder({
      oemName: cert.oem_name ?? "OEM",
      certificationType: (cert.certification_type ?? "certification").replace(/_/g, " "),
      expiryDate: cert.expiry_date ?? null,
      daysRemaining: cert.days_remaining === null ? null : Number(cert.days_remaining),
      expiryState: cert.expiry_state ?? "valid",
    }),
  );

  const rfiDrafts: EmailDraft[] = (openRfis.data ?? [])
    .map((rfi) => ({
      rfi,
      daysLeft: daysUntilDeadline(rfi.submission_deadline as string),
    }))
    .filter(({ rfi, daysLeft }) => daysLeft <= (rfi.reminder_days_before ?? 7))
    .map(({ rfi, daysLeft }) =>
      rfiDeadlineReminder({
        rfiNumber: rfi.rfi_number ?? "RFI",
        projectName: rfi.project_name,
        customerAgency: rfi.customer_agency,
        submissionDeadline: rfi.submission_deadline as string,
        daysLeft,
      }),
    );

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold">Reminder emails</h1>
      <p className="mt-1 max-w-3xl text-sm text-muted-ink">
        These are the exact subject lines and bodies a reminder would use, filled from live records. They are
        placeholders only — nothing is sent automatically. Open one in your mail client or copy the text. Outbound
        sending is deferred to Phase 2.
      </p>

      <section className="mt-4">
        <h2 className="text-lg font-bold">Drafts from current records</h2>
        {canFinance && (
          <DraftSection
            title="Overdue payments"
            note={`Payment-due reminder, or escalation when more than ${ESCALATION_AFTER_DAYS} days overdue.`}
            drafts={overdueDrafts}
          />
        )}
        {canDocs && (
          <DraftSection
            title="Documents expiring within 90 days"
            note="Compliance documents and approvals nearing expiry."
            drafts={documentDrafts}
          />
        )}
        {canOem && (
          <DraftSection
            title="OEM certifications expiring"
            note="Expired or inside the OEM renewal reminder window."
            drafts={certificationDrafts}
          />
        )}
        {canReq && (
          <DraftSection
            title="RFI submission deadlines"
            note="Open RFIs inside their own reminder window."
            drafts={rfiDrafts}
          />
        )}
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-bold">Template catalogue</h2>
        <p className="mt-1 text-sm text-muted-ink">
          Every reminder the system produces, with its merge fields and a filled sample (sample values are illustrative,
          not live records).
        </p>
        <ul className="mt-3 space-y-3">
          {EMAIL_TEMPLATE_CATALOGUE.map((spec) => {
            const sample = SAMPLE_DRAFTS.find((draft) => draft.key === spec.key);
            return (
              <li key={spec.key} className="panel p-4">
                <h3 className="font-medium">{spec.name}</h3>
                <p className="text-sm text-muted-ink">{spec.purpose}</p>
                <p className="mt-1 text-xs text-muted-ink">
                  <span className="label">Audience</span> {spec.audience}
                </p>
                <p className="mt-2 text-xs">
                  <span className="label">Merge fields</span>{" "}
                  <span className="mono">{spec.fields.map((f) => f.token).join("  ")}</span>
                </p>
                {sample && (
                  <>
                    <p className="mt-3 text-sm">
                      <span className="label">Sample subject</span> {sample.subject}
                    </p>
                    <pre className="mt-1 whitespace-pre-wrap rounded border border-hairline bg-content p-3 text-sm">
                      {sample.body}
                    </pre>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </AppShell>
  );
}
