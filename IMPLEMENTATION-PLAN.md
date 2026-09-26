# Inverbrass Defence CRM — IMPLEMENTATION-PLAN.md

> Intended destination: `D:\FWAI\projects\InverBase\IMPLEMENTATION-PLAN.md`. Saved here because plan
> mode permits writes only inside the plan directory; an implementation-capable agent should copy this
> file to the project root unchanged.

Read `Inverbrass CRM — PRD v1.md` and `inverbrass-crm-tech-stack.md` first. Where they disagree, the
tech-stack document wins. Follow this order literally; do not reorder, merge, or skip steps.

## Sequencing risk, stated first

1. **The PRD's Phase 1/2/3 order is client-value order, not build order.** If you follow it literally
   (RFI → OEM → coverage → quotation, then PO → PDI → invoicing), you build the requirement spine before
   you know what the second half needs, and you rebuild it when PO, PDI, invoice and commission arrive.
   The data model is the expensive thing here, so lock it once, up front, then build vertical slices.
2. **The PRD would have you put approval on a single boolean.** `inverbrass-crm-tech-stack.md` locks two
   levels (Group Head, then Management). Build two levels. A single `approved` flag is a defect, not a
   shortcut.
3. **The obvious demo order is the wrong order.** The plain-language assistant is the only model-dependent
   feature and is the least valuable part of the system. Build it last, off by default. Everything the
   client actually asked for works with every provider rate-limited.
4. **Do not load real OEM capacity or client history until Step 2's model is validated against a real
   sample of the client workbook.** PRD §13 lists data quality as a named risk; a wrong import poisons
   past-bid intelligence, coverage and win/loss reporting at once.

## The rule that sets the order

Everything that works without a model comes first. Ranked, the plan is:

| Step | Model call needed? |
|---|---|
| 1. Foundation and guardrails | No |
| 2. Data model, enums and constraints | No |
| 3. Auth, roles, RLS, audit, approvals | No |
| 4. RFI and line items | No |
| 5. OEM master | No |
| 6. Sourcing and quantity coverage | No |
| 7. Historical Excel ingestion | No |
| 8. Quotation and bid intelligence | No |
| 9. Post-submission and Purchase Order | No |
| 10. Material readiness, PDI, LD risk | No |
| 11. OEM invoicing, delivery, payments, commission | No |
| 12. Document vault | No |
| 13. Dashboard, reports, deterministic queries | No |
| 14. Optional AI assistant | Yes — optional, last, off by default |

Steps 1-13 satisfy every committed PRD module with zero model calls. Step 14 only rephrases questions the
Step 13 layer already answers, and must fall back to it whenever a provider fails.

## Design tokens (visual language)

> SUPERSEDED 26 Sep 2026 by a member-supplied design system (Ink Navy rail, Signal Teal / Alert Amber /
> Clear Green / Risk Red, Space Grotesk + IBM Plex Sans + IBM Plex Mono). The member's design is
> implemented in `src/app/globals.css`, `src/app/layout.tsx` and `src/components/app-shell.tsx`, and it
> supplies the Risk Red this section asked for before Step 10. The palette below is kept only for
> history.

The palette is fixed. Define it once as Tailwind v4 theme tokens in `src/app/globals.css` and use those
token names everywhere. Do not introduce new hues; make tints with opacity of these five only.

| Token | Hex | Role |
|---|---|---|
| Cream | `#F7F3EC` | App background and canvas |
| Ink Blue | `#1B2A4A` | Headings, nav chrome, primary text on light surfaces |
| Near Black | `#14161A` | Body text and high-emphasis numbers |
| Deep Teal | `#0F6B6B` | **Restrained accent only** — active nav item, links, focused input ring, selected row marker, small badge |
| Warm Sand | `#C9A227` | Attention and status — pending, at-risk, expiring, overdue |

Usage rules:

- **Teal is an accent, never a surface.** Do not fill large areas with it or make it the default button
  colour. Buttons read as Ink Blue or Near Black on Cream; teal marks the single active or selected state.
- Backgrounds are Cream. Separate surfaces with Ink Blue or teal borders at low opacity, not with new greys.
- Warm Sand marks attention. Pair it with Near Black text and a word (for example "At risk"), never colour
  alone.
- No dark mode in the MVP; the palette is a light theme.
- Verify every text/background pairing for contrast on a real screen, and never convey status by colour
  alone — always add the label.

**Gap to flag:** the palette has no error or danger colour. A failed PDI and destructive actions need to
read as wrong, and teal must not be borrowed for that. Either treat Warm Sand as the warning colour with
Near Black text, or add one accessible red token explicitly — decide before Step 10.

## Steps

### Step 1 — Foundation and guardrails

- **What:** repo skeleton on Next.js App Router + TypeScript strict; the fixed palette wired into Tailwind v4
  as `@theme` tokens (see Design tokens); local Supabase via `supabase start`; the migrations harness; env
  plumbing that names a missing variable; npm scripts for typecheck, lint, test; a health page.
- **Why here:** nothing later can be proven without a reproducible database and a page to look at.
- **Demonstrable:** `next dev` serves a health page that shows app version, Supabase reachability, and the
  exact name of any missing env var; `supabase db reset` applies migrations from empty; typecheck and test
  scripts run.
- **If wrong downstream:** migration drift and untraceable failures in every later step; nothing is
  reproducible for the handoff.

### Step 2 — Data model, enums and constraints (the spine)

- **What:** all tables for the full PRD data model — requirements, line_items, oems, oem_contacts,
  oem_certifications, sourcing_requests, sourcing_responses, quantity_commitments, quotations,
  quotation_versions, purchase_orders, material_readiness, pdis, oem_invoices, deliveries, payments,
  commission_invoices, documents, approvals, audit_log — plus every status enum, and the hard DB
  constraints. Validate the model against a real sample of the client workbook before moving on.
- **Why here:** this is the decision that is most expensive to reverse (see below). Locking it before any
  UI stops the model being written three times.
- **Demonstrable:** `supabase db reset` builds the schema; `supabase db diff` is empty; SQL constraint tests
  pass; a seeded demo dataset loads; a read-only schema page lists tables and row counts.
- **If wrong downstream:** coverage math, LD risk, approvals and commission gating all read this spine;
  a wrong shape here surfaces as wrong numbers long after the build "succeeded".

### Step 3 — Auth, roles, RLS, audit and approvals

- **What:** invite-only Supabase Auth; the roles Owner, Group Head, Management, Sales, Operations, Finance;
  deny-by-default Row Level Security with one `auth_role()` helper; DB-triggered audit logging of material
  changes; a `record_approval()` function that enforces the two-level order.
- **Why here:** security and audit cannot be retrofitted onto live tables, and RLS policies must be written
  against the real schema from Step 2.
- **Demonstrable:** two seeded users with different roles see different data; every role has a passing deny
  test (not just an allow test); an edit produces an audit row naming actor, change and time; a stage cannot
  advance on one approval.
- **If wrong downstream:** every module's permissions are suspect, and the audit trail is decorative.

### Step 4 — RFI and line items

- **What:** create/edit RFI with the PRD Module 1 fields; up to 500 line items per requirement as real
  rows; bulk paste entry; attachments to private Storage; deadline view with pre-deadline reminders;
  assigned employee; special remarks; pursue decision and regret letter note.
- **Why here:** the RFI is the root every other module hangs off; it needs no model.
- **Demonstrable:** an RFI with 500 line items saves and reopens intact; an attachment is retrievable via a
  signed URL; the deadline list shows what is due and overdue.
- **If wrong downstream:** line items must be rows, not text or JSON, or quotation, coverage and PO all
  break later.

### Step 5 — OEM master

- **What:** OEM records with the PRD Module 2 fields, multiple contacts, and certification records with
  expiry dates; the government-vendor-list approval status stored with its source.
- **Why here:** sourcing, coverage and quotation all reference OEMs.
- **Demonstrable:** an OEM with contacts and certifications is created; the certification-expiry view lists
  what is expiring.
- **If wrong downstream:** coverage and quotation price from the wrong OEM entity; expiry reminders miss.

### Step 6 — Sourcing and quantity coverage

- **What:** sourcing request/response log (email, WhatsApp, phone recorded as note or attachment); the
  quantity-commitment ledger with a mandatory firm-vs-availability distinction; the uncovered-balance
  calculation; the global-per-OEM capacity view.
- **Why here:** highest-value Phase 1 deterministic feature, and every later quantity depends on it. Use the
  ledger design in "Most expensive decision below" so per-order vs global stays reversible.
- **Demonstrable:** the PRD example computes on screen — 1,000 needed, OEM A 600 + OEM B 400, uncovered 0;
  flipping a commitment from availability to firm changes the uncovered balance; with OEM A holding 1,000
  and 700 committed elsewhere, only 300 shows available.
- **If wrong downstream:** a green coverage bar that no OEM ever confirmed; the whole pipeline lies.

### Step 7 — Historical Excel ingestion

- **What:** a one-off, server-side script run by the team (not part of the deployed app) that maps the
  client workbook into RFIs, quotations and OEMs; dry-run mode; per-row rejection report; row-count
  reconciliation; a review pass before commit.
- **Why here:** past-bid intelligence in Step 8 is worthless with no history, and real data is the hardest
  test of the Step 2 model.
- **Demonstrable:** an import report states rows read, inserted and rejected with a reason per rejected row;
  past-bid queries then return real history.
- **If wrong downstream:** silently skipped or mis-mapped rows make win/loss and past-bid intelligence wrong
  with no visible error. No `.xlsx` parser ships in the app (see the tech-stack exclusions); parse offline.

### Step 8 — Quotation and bid intelligence

- **What:** quotation builder from an RFI; OEM price, freight, GST, lead time, payment terms, target margin
  as a suggestion that never auto-sets the figure; flexible government-format export per agency; PNC status;
  technical and commercial compliance flags; version history; loss reason, optional L1 price and competitor;
  past-bid search by part number, agency or product type; two-level approval before submission.
- **Why here:** needs RFI, OEM and coverage in place; all deterministic.
- **Demonstrable:** a quote is built, comparable past bids appear under each of the three filters, and a
  submission attempt without both approvals is refused.
- **If wrong downstream:** versioning or approval order broken here corrupts the audit trail the client
  explicitly asked for.

### Step 9 — Post-submission and Purchase Order

- **What:** post-submission statuses; PO fields from PRD Module 4; a PO can only be created from an approved
  quotation (DB constraint, no orphan POs); the order-verification checklist (spec, price, feasibility,
  documents) with Group Head sign-off.
- **Why here:** the first place a quotation becomes a commitment; still deterministic.
- **Demonstrable:** creating a PO without an approved quotation fails at the database, and the verification
  checklist is recorded against the accepted order.
- **If wrong downstream:** orphan PO or unverified order undermines every downstream invoice and commission.

### Step 10 — Material readiness, PDI and LD risk

- **What:** OEM production/QC status, batch and serial numbers, tentative PDI date; PDI with separate
  offered/cleared/rejected quantities, selectable agency, rejection remarks and re-PDI flag; a failed PDI
  blocks dispatch and locks invoicing; the LD-risk engine comparing expected completion against the
  committed deadline and opening an extension request before the due date.
- **Why here:** needs POs, and it is the client's #3 pain point — the highest-value deterministic feature.
- **Demonstrable:** an at-risk order shows its days-to-deadline before the deadline; a failed PDI blocks the
  next step; updating production status moves the risk.
- **If wrong downstream:** IST day-boundary errors make the LD alert fire late; the failure is invisible
  until a real deadline is missed. Uses the tech-stack date rule (store UTC, compute in `Asia/Kolkata`).

### Step 11 — OEM invoicing, delivery, payments and commission

- **What:** OEM invoice only after PDI clearance; multiple invoices per PO; partial deliveries with visible
  balance; partial payments with RTGS/NEFT/wire modes and proof; commission invoice only after the OEM has
  been paid, computed on the OEM invoice value at the OEM-wise percentage, with GST and TDS.
- **Why here:** the end of the chain; every gate it enforces was defined in Steps 2, 9 and 10.
- **Demonstrable:** invoicing is refused before PDI clearance; commission is refused before the payment
  milestone; a partial payment reduces the balance; one PO shows many invoices.
- **If wrong downstream:** if the commission gate lives only in the UI, an early commission invoice passes
  review and is wrong in front of the client.

### Step 12 — Document vault

- **What:** document metadata with issue/expiry dates, linked to a PO and through it the RFI or OEM;
  renewal reminders for the 3-5 year approval cycles.
- **Why here:** documents depend on the POs and requirements already built; deterministic.
- **Demonstrable:** every document shows its linked PO; the expiring-documents view lists upcoming renewals.
- **If wrong downstream:** a document with no PO link is exactly the pain point the client flagged.

### Step 13 — Dashboard, reports, search and deterministic queries

- **What:** the PRD §10 management dashboard and reports; search across history; a deterministic answer
  layer for the plain-language questions (counts, won/lost, why-lost) built from SQL and fixed filters.
- **Why here:** the data is only reportable once every module writes to it. It is still model-free.
- **Demonstrable:** the dashboard renders real KPIs; "how many orders", "won this month" and "why did we
  lose" are answered from stored data with no model.
- **If wrong downstream:** every number on this page is only as right as the steps beneath it — that is why
  it is near the end.

### Step 14 — Optional AI assistant (last, off by default)

- **What:** a provider-agnostic server route that rephrases the Step 13 answers; structured fields only,
  never tender documents; disabled unless a key is configured; on any provider error it falls back to the
  Step 13 answer.
- **Why here:** it is the only model-dependent feature; shipping it earlier tempts the build to depend on a
  provider that may be rate-limited.
- **Demonstrable:** with no key, every question still answers; with a key, answers are rephrased and nothing
  functional changes; killing the key changes nothing but wording.
- **If wrong downstream:** if any save path or core query imports the model, the app stops being usable when
  providers are down — the exact failure the ordering rule exists to prevent.

## The one decision most expensive to reverse

**The requirement spine: how line items, quantity commitments and coverage are stored, and how
RFI → Quotation → PO → Invoice are linked, together with the status enums.**

It is expensive because quantity coverage math, LD risk, approval gates, past-bid intelligence, invoicing
and commission all read it, and client history is loaded into it in Step 7. Changing it later means
migrating live data and re-verifying every derived number.

Lock it this way so the client's still-open capacity question does not force a rewrite:

- Store every commitment as a row in `quantity_commitments`: `oem_id`, `requirement_id`, `line_item_id`,
  `quantity`, `firm` (boolean), `source`.
- Only `firm = true` rows reduce an uncovered balance (PRD Module 2 rule).
- Global-per-OEM capacity is a **view** over these rows across all open requirements. Per-order coverage is
  the same rows filtered to one requirement.
- Default the UI to the PRD's global-per-OEM assumption, but keep per-order derivable. Confirming either way
  later becomes a view change, not a data migration.

## Steps that can silently half-work

- **RLS (Step 3).** The dev/owner account sees everything, so missing policies look fine. It fails only when
  a Sales user can read Finance data. Mitigation: a deny test per role from day one.
- **Audit trail (Step 3).** App-written logs miss changes made by other paths. Mitigation: DB triggers.
- **Two-level approval (Step 3).** Collapsing to one flag looks approved and fails only in audit review.
- **Quantity coverage (Step 6).** If `firm` is not enforced, coverage shows green on unconfirmed stock.
- **Historical import (Step 7).** Rows skipped or mis-mapped import "successfully". Mitigation: per-row
  rejection report and row-count reconciliation.
- **LD risk (Step 10).** A timezone or day-boundary error fires the extension request late, silently, until
  a real deadline is missed.
- **Commission gate (Step 11).** Enforced only in the UI, it passes an early commission invoice raised by
  any other path.

## Migration and rollout

- Develop against the local Supabase stack; every schema change is a migration file in git, never a dashboard
  edit. Types are regenerated after each migration.
- Deploy the Next.js app to Vercel (tech-stack choice) with the Supabase URL and anon key set as environment
  variables. Confirm no service-role key is in the client bundle.
- Vercel deployment protection returns a 302 to a login and will break the shared demo link; turn it off for
  the demo URL, then verify with a real fetch of the live page, not the CLI's output.
- Historical ingestion (Step 7) is a reviewed one-off run, never part of the deployed app.
- No production data is loaded before the Step 2 model has been validated against the client workbook.

## Validation

- Each step is done only when its "Demonstrable" line has been run and its real output pasted into
  `WORKLOG.md`, and the claim recorded in `REPORT.md` per `AGENTS.md`.
- Vitest: rule modules and Zod schemas — coverage math, commission gating, approval order.
- SQL tests: RLS allow **and deny** per role; the no-orphan-PO constraint; the commission-after-payment gate;
  the two-level order.
- Playwright: sign-in, create an RFI, quote through both approvals, create a PO from the approved quotation
  only.
- Manual: all modules at phone width on a real device, with the Design tokens applied and teal used only as a restrained accent.

## Client-owned questions carried forward (do not block)

- Whether Finance also checks order verification (PRD §2).
- Whether the PDI conducting agency varies by contract (PRD §2).
- Whether commission-after-payment holds in all payment-term cases (PRD §2).
- Confirmation of the global-per-OEM capacity model — the design above is deliberately reversible, so the
  build proceeds on the PRD assumption.

## Constraints on the agent

- Build strictly in the step order above; do not start a later step to make the demo look better.
- No schema change outside a migration file; no ORM; no second data store; no public signup.
- No model call on any save path or core query; Step 14 stays optional and last.
- Treat every contradiction between `Inverbrass CRM — PRD v1.md` and `inverbrass-crm-tech-stack.md` as
  resolved in favour of the tech-stack document, and note the contradiction in `REPORT.md`.

## Recovered requirements — client workbook, 26 Sep 2026 (added by the member)

The member supplied the client's workbook after the PRD was written. It has five tabs: **Sheet1**
(order-management stage overview), **Input Sheet** (per-stage fields and system requirements),
**Master Data Inputs** (Customer / Product / Competitor masters), **Dashboard requirements**
(management tiles, reports, roles, automation, integrations, attachments, KPIs) and **Sheet7** (a note).
These requirements are now part of the brief. Implemented in this build:

- Automatic RFI (`RFI/YYYY/NNNN`) and quotation (`QTN/YYYY/NNNN`) numbering, assigned by a DB trigger.
- Master data: Customer Master and Product/Part Master tables, with a new `master` permission area.
- Second part number (OEM part and corresponding client part) on requirement line items and the part master.
- Per-stage fields the PRD omitted: requirement quotation-validity and staggered delivery; quotation
  currency, discount, validity and internal notes; PO special conditions and PDI inspector; material
  readiness quantity-ready; PDI linked item, inspector and dispatch clearance; invoice courier details;
  delivery closure status and remarks; payment remarks; commission invoice dates and gross value.
- Management dashboard tiles (pending deliveries, pending OEM invoices, overdue invoices, commission
  receivable, revenue by OEM/client, monthly sales, employee-wise performance) and the eight Critical KPIs.
- Reports: client/OEM/product-wise and monthly/yearly sales, pending quotations, PO tracking, delivery
  status, invoice aging, outstanding payments/follow-up, commission receivable, margin, GST/TDS summary,
  profitability, OEM performance, employee performance.
- Sales "My RFIs" filter; read-only audit-log page for privileged roles; CSV (Excel-compatible) export of
  every report; print-to-PDF quotation.
- Master data links into the stages: `requirements.customer_id`, `purchase_orders.customer_id` and
  `line_items.product_id`, matched by name/part number on create. A `/process` page shows the Sheet1
  nine-stage flow with each stage's linking key, its hard gate and live record counts, and how Customer,
  OEM and Part masters feed the chain.

Deferred, with reasons recorded in `REPORT.md` (not silently dropped): outbound email reminders,
payment-due email reminders and escalation-by-email (TECH-STACK defers all outbound messaging to Phase 2),
GeM portal integration (portal has no API; Excel/CSV import is the path), WhatsApp (optional) and a
server-side `.xlsx` writer (CSV is used instead). Competitor master remains a free-text field until the
client provides its columns.

Naming note: the workbook names the company "Supreme Q" in the Input Sheet (commission/employee
columns) while the PRD, TECH-STACK and this plan say "Inverbrass". The build keeps "Inverbrass" and the
contradiction is recorded in `REPORT.md` for the member to confirm.
