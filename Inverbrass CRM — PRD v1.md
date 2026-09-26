# Inverbrass Defence CRM — Product Requirements Document (PRD v1)

Sep 26, 2026 · Prepared by @Krishhna Saai Pawan

## 1. Executive Summary

Ram Prasad runs Inverbrass, a defence contract consultancy. Government and defence agencies send him requirements (RFI/tender), and he fulfils them through a network of OEM suppliers, earning commission on the deals he closes.

**Today's volume:** roughly 25-30 enquiries/month, \~20 quotations, \~10 orders, 20-25 active orders at any time, handled by a 15-20 person team (Sales, Operations, Finance, under Group Head/Management).

**How it runs today:** Excel, email, phone and memory. Quotation prep takes 3-4 days, OEM communication 1-10 days, document creation about a week, follow-ups 3-4 hours a day. Nothing is searchable, so every quote starts from scratch.

**Pain points driving this project:**

- Slow system (Excel-based), prone to inaccuracy
- Liquidated Damages (LD) risk from late deliveries, with no early-warning follow-up
- Payment collection delays, no automatic reminders
- Documents not systematically linked to the PO that requires them
- OEM performance and capacity tracked manually, no history to draw on

**Goal:** one requirement, one record, one timeline. Replace Excel/email with a system where every RFI, quotation, PO, PDI, delivery, payment and commission traces back to a single requirement, with quantity coverage, document expiry and delivery risk visible before anyone has to ask.

This PRD is based on the client's own detailed workbook (Inverbrass\_Odoo\_Order\_Management\_sheet.xlsx), a requirements brief, and a pain-points note, and fills remaining gaps with explicit assumptions in Section 2.

## 2. Assumptions Made in This Version

Ram Prasad confirmed some open items and asked us to proceed with assumptions on the rest. These are logged here so they can be corrected later without reopening the whole PRD.

| Area | Assumption made | Confirm with client |
| --- | --- | --- |
| OEM count | Not shared yet. Build OEM master to handle any number, no hardcoded limits. Client will share real numbers once MVP looks good | Actual OEM count, active vs dormant split |
| PDI conducted by | Not shared. Assume PDI can be done by DGQA, the client agency itself, or a third party, and the PO record simply stores which one applies per order (a dropdown, not a fixed rule) | Whether this varies by contract type or agency |
| L1 (winning bid) price | Sometimes disclosed, sometimes not. Make the L1 price an optional field on a lost bid, never mandatory | None, this is now the working rule |
| Order verification before acceptance | Assume this checks: technical specification match, price match against the approved quote, delivery feasibility against the required date, and document completeness. Checked by Operations, with Group Head sign-off before the order moves to PO stage | Whether Finance also checks anything at this step |
| Loss reasons | Client confirmed: use all of price, technical non-compliance, delivery timeline, competitor preference, quantity or capacity, cancelled, not pursued, other | None, this is now the working rule |
| Post-submission statuses | Client confirmed: use as proposed — submitted, clarification requested, technical clarification, commercial negotiation, awaiting approval, won, lost, cancelled | None, this is now the working rule |
| OEM capacity model | Not yet decided by client (open question 1 from the original brief). Assume capacity is tracked **globally per OEM** (not per order) for MVP, with the uncovered/committed balance recalculated across all open orders. This is the harder but more correct model | Confirm before build starts, this affects the data model |
| Commission timing | Based on the client's own workbook: commission invoice can only be raised after the OEM has been paid by the government client. Built as a hard rule, not a toggle | Confirm this is correct in all cases, or only for standard payment terms |
| Group Head vs Management role | Treated as the same approval role for MVP (single-level approval on quotes, OEM selection, orders) | Whether Group Head and Management are actually two separate approval levels |

## 3. Users, Roles and Permissions

Team size: 15-20 people. Internal use only, no OEM or government-side logins. Used on both phone and laptop, so the UI needs to work responsively on both.

| Role | Who | Can do |
| --- | --- | --- |
| Owner / Group Head / Management | Ram Prasad and senior management | Full access. Decides whether to pursue an enquiry. Final sign-off to move a record to the next stage (RFI to quotation, quotation to order, OEM selection, document approval) |
| Sales | Sales team | Create and edit RFIs, create quotations, view assigned accounts, manage OEM sourcing and shortlisting |
| Operations | Ops team | Delivery tracking, PDI updates, material readiness updates, document uploads |
| Finance | Finance team | Invoice creation, payment tracking, commission management, GST and financial reports |

**Approval rule:** every stage transition (RFI qualified, quotation sent, order accepted, OEM selected, document approved) requires an explicit approve action from Group Head/Management before the record proceeds. This matches the client's own instruction: "approve to proceed to the next step/stage."

**Audit trail:** every material change (status change, price change, OEM change, approval) is logged with what changed, who changed it, and when.

## 4. Module 1 — Requirement and RFI

The RFI is the central record. Everything else in the system hangs off it.

**Fields:**

- Project name, customer/agency (with division and sub-division, e.g. HAL/DRDO and their internal unit)
- Source of enquiry: email, GeM portal, client portal, direct from customer, or through an OEM
- GeM tender number (if applicable)
- Bid type: single bid or double bid
- Submission type: hard copy, soft copy, or both
- Line items: up to 500 part numbers per requirement, each with its own part number, description, quantity, and required delivery date. Not one text field, a proper repeating line-item table
- Technical specifications, drawings, tender documents (file uploads)
- Submission deadline, with reminder alerts before the deadline
- Assigned employee (who in the 15-20 person team owns this RFI)
- Special remarks: RCMA approval, CEMILAC, LCSO, MIL, or no approvals needed

**Statuses:** received, qualifying, quoted, submitted, won, lost, cancelled.

**Pursue decision:** Group Head reviews and decides whether to pursue. If not pursued, a regret letter is logged against the RFI (generic template, filled from RFI data).

**Import:** tenders can arrive as Excel, PDF, or scanned paper. All three formats need to be importable, PDF and scanned paper at minimum as document attachments against the RFI; structured import (auto-populating line items) is a stretch goal for Excel/structured PDF, manual entry is the fallback for scanned paper.

**Reminders:** automatic reminders ahead of the submission deadline (see Module 5 for exact timing).

## 5. Module 2 — OEM Master, Sourcing and Quantity Coverage

**OEM master record:** OEM name, brand/product category, country of origin, contact persons (multiple), product portfolio, MOQ rules, lead time, pricing validity rules, freight terms, warranty terms, payment terms, commission percentage, NDA/agreement status, certification details with expiry dates, bank details.

**Approval status:** an OEM is marked approved based on the **government agency's own vendor list**, not an internal Inverbrass decision. The system stores this status and its source, it does not decide it.

**Sourcing flow:** from an RFI, shortlist OEMs who can supply the required part(s). Record each request sent and the response received. OEMs may reply by email, WhatsApp, or phone — all three need to be loggable against the sourcing request (as a note/attachment, not necessarily live integration for WhatsApp in MVP).

**Quantity coverage (the hard part):** show required quantity against OEM committed quantity, with uncovered balance visible. Example: 1,000 needed, OEM A commits 600, OEM B commits 400, coverage 1,000, uncovered 0. Several OEMs and several shipments can cover one requirement.

**Firm commitment vs availability:** the system must distinguish a firm quantity commitment (backed by a quote or written confirmation) from a mere availability or price indication. Only firm commitments count toward closing the uncovered balance. The team should not be able to confidently commit a quantity that OEMs have not actually covered.

**Capacity model (flagged assumption):** built as global-per-OEM for MVP — if OEM A has 1,000 total capacity and 700 is already committed elsewhere, only 300 shows as available for a new requirement. This is Assumption #7 in Section 2 and needs client confirmation before OEM capacity data is loaded.

**OEM performance:** currently tracked manually and is a known pain point. The system should capture delivery timeliness and PDI pass/fail history automatically as orders complete, building a performance record over time without needing separate manual entry.

## 6. Module 3 — Quotation and Bid Intelligence

**Build a quote from the requirement:** OEM price, freight charges, taxes/GST, delivery terms, lead time, payment terms, target margin, recommended price. Margin is decided case by case, not a fixed percentage by category, so the system suggests but never auto-sets the final price.

**Government format:** quotes must go out in the government/agency's own format, not a single fixed Inverbrass template. The system needs a flexible quote template per agency, or an export that can be reformatted, rather than one rigid layout.

**Price Negotiation Committee (PNC):** track PNC status as a distinct field on the quotation, since agencies may route quotes through a negotiation committee before acceptance.

**Past bid intelligence:** before pricing, show comparable past bids: what was quoted, won or lost, and the price. "Comparable" can mean same part number, same agency, or same product type, all three should be usable as search filters, not just one fixed definition.

**Versioning and approval:** quotations are versioned (revision tracking) and require Group Head approval before submission, matching "approve to proceed to the next step."

**Technical and commercial compliance:** track both as explicit yes/no fields on the quotation, since agencies evaluate them separately.

**Losses:** when a bid is lost, capture a structured reason from: price, technical non-compliance, delivery timeline, competitor preference, quantity or capacity, cancelled, not pursued, other. Capture the winning (L1) price as an optional field, since it's only sometimes disclosed. Capture competitor details where known.

## 7. Module 4 — Post-Submission, Purchase Order and Material Readiness

**Post-submission statuses (confirmed as proposed):** submitted, clarification requested, technical clarification, commercial negotiation, awaiting approval, won, lost, cancelled.

**Automatic follow-up:** reminders before the government responds — client wants reminders 7 to 10 days before an expected response, sent by email or another channel per the client's preference, plus follow-ups for outstanding document requests.

**Order verification before acceptance (assumption):** on receiving a PO, Operations checks technical spec match, price match against the approved quote, delivery feasibility against the required date, and document completeness, with Group Head sign-off before the order is accepted. To confirm with client once reviewed.

**Purchase Order fields:** PO number, PO date, linked quotation (no orphan POs, every PO maps to an approved quotation), customer, OEM, part number, quantity ordered, unit price, PO value, taxes/GST, delivery schedule, partial delivery allowed (yes/no), PDI required (yes/no) and mode (VC or physical), documentation required, warranty terms, payment terms, status (open/processing/completed), PO copy attachment.

**Material Readiness Module (new, from client's workbook — for critical or delayed dispatches):** tracks OEM production status (in production/ready), internal QC status, batch and serial numbers, tentative PDI date, ahead of PDI actually being scheduled. This gives early visibility into delays before they become a PDI or delivery problem, directly supporting the LD-risk pain point.

## 8. Module 5 — PDI/Inspection, OEM Invoicing and Delivery

**PDI (Pre-Dispatch Inspection):** quantity offered, quantity cleared, quantity rejected, tracked as separate numbers, not one pass/fail flag. Inspection type: physical, VC, or third-party. Inspection agency: DGQA, client agency, or internal — since who conducts it wasn't confirmed, this is a selectable field rather than a fixed rule (Assumption in Section 2). Rejection reason captured as remarks. Re-PDI flag if a failed batch needs re-inspection. A failed or held PDI blocks dispatch, and invoicing is locked until PDI is approved.

**LD (Liquidated Damages) risk — pain point priority:** this is the client's #3 pain point. The system tracks the committed delivery deadline against expected completion (from Material Readiness and PDI status) and automatically triggers a **request for delivery extension before the due date**, not after. This is a proactive alert, not a reactive one, and is one of the highest-value features for the client.

**OEM Invoice to Client:** raised only after PDI clearance. Fields: invoice number, date, linked PO and PDI, quantity invoiced, full/partial, balance quantity, net/GST/gross amounts, dispatch date, LR/AWB number, e-way bill, documents submitted, payment due date, status (raised/submitted/approved/paid). Supports multiple invoices against one PO.

**Delivery:** delivery reference, linked invoice, delivery date, location, quantity delivered, delivery status (in transit/delivered), material acceptance status, GRN number, pending balance, proof of delivery upload. Supports partial deliveries with the outstanding balance always visible, and flags delivery risk early (expected completion vs committed deadline) so the team isn't asked "where is our order" before they already know the answer.

## 9. Module 6 — Payments, Commission and Document Vault

**Payment tracking:** partial payments supported. Fields: payment reference, linked invoice, customer, OEM, invoice amount, amount received, balance outstanding, payment date, terms, mode (RTGS/NEFT/wire), payment proof upload, overdue days, follow-up status, escalation workflow for overdue payments. One invoice can be fulfilled by several delivery events, and one PO can have multiple invoices.

**Commission (confirmed rule, not an assumption):** commission invoice is calculated on the OEM's invoice value to the client, and can only be raised **after the OEM has been paid**. Fields: commission invoice number, linked OEM invoice, OEM name, customer name, commission percentage (OEM-wise), base invoice amount, commission amount, GST, TDS deducted, payment status, outstanding amount.

**Document and compliance vault:** type, supplier, issue date, expiry date, linked product/PO/requirement, with expiry reminders. Covers RCMA, CEMILAC, DGQA, LCSO, MIL approvals, test certificates, delivery challans, LR copies, payment proofs. Approved item lists typically renew every 3-5 years, tracked with renewal reminders.

**Pain point — documents from the PO:** the client specifically flagged that all valid documents should be maintained and traceable back to the PO that required them. The document vault enforces this link: every document is tied to a PO (and through it, to the requirement), not just floating in a generic folder.

## 10. Module 7 — Search & History, Dashboard, Approvals and Audit

**Search and history:** search all history for a comparable requirement (by part number, agency, or product type) and surface past OEM, price, delivery time, margin, documents and problems, so no quote starts from scratch.

**Plain-language queries:** answer questions like "how many orders are there?", "how many contracts did we win this month?", "what did we lose?", "why did we lose them?" — answered only from stored data, never invented.

**Dashboard (Management view):**

- *Pending/at-risk:* Total RFIs, Active Quotations, Open POs, Pending Deliveries, Pending Payments (from client to Inverbrass), **Pending Invoices from OEM to client**, Overdue Payments, deliveries at risk vs committed deadline, documents expiring
- *Performance/positive KPIs:* Won vs Lost Opportunities, Tender Conversion Ratio, Average Quotation Turnaround Time, Delivery Adherence, Payment Collection Cycle, Commission Recovery Time, Commission Receivable, OEM Performance, Client Repeat Business, Employee-wise Performance, Revenue by OEM, Revenue by Client, Monthly/Yearly Sales Trend
- *Reports:* Client-wise, OEM-wise, product-wise sales; PO tracking; delivery status; PDI status; invoice aging; outstanding payments; margin report; GST and TDS summary; profitability report

**Approvals:** stage-gate approvals on quotes, OEM selection, documents and orders, as defined in Section 3.

**Audit trail:** every material change logged (what, who, when), covering price changes, status changes, OEM changes and document approvals.

## 11. Data Model Summary (key entities)

```
Requirement / RFI (1) ──< Line Item (many, up to 500 per RFI)
Requirement (1) ──< Quotation (many, versioned)
Quotation (approved, 1) ──< Purchase Order (1, no orphan POs)
Purchase Order (1) ──< Material Readiness (many, per line/batch)
Purchase Order (1) ──< PDI (many, per batch/dispatch)
Purchase Order (1) ──< OEM Invoice (many)
OEM Invoice (1) ──< Delivery (many, partial deliveries)
OEM Invoice (1) ──< Payment (many, partial payments)
OEM Invoice (1) ──< Commission Invoice (1, only after OEM payment milestone)
OEM (1) ──< Sourcing Request/Response (many, per requirement)
OEM (1) ──< Quantity Commitment (many, across requirements — global capacity model)
Document (many) ── linked to Requirement, PO, and/or OEM
```

This mirrors the relationships already established in the client's own workbook (Odoo-style module list) and satisfies the core rules: every quotation comes from an RFI, every PO maps to an approved quotation, many line items per requirement, many invoices per PO, many deliveries per invoice, quantity balance visible end to end.

## 12. MVP Phasing and Out of Scope

**Phase 1 (highest priority, per the client's own brief):**

- Requirement and RFI module, with line items and import of old Excel history
- OEM master and sourcing
- Quantity coverage (firm commitment vs availability, global capacity model)
- Quotation and bid intelligence, with past-bid search

**Phase 2:**

- Post-submission tracking and follow-up reminders
- Purchase Order module
- Material Readiness module
- PDI/Inspection module, with LD-risk early warning

**Phase 3:**

- OEM Invoicing and Delivery
- Payments and Commission
- Document vault with expiry reminders
- Dashboard, plain-language queries, roles/approvals/audit

**Explicitly Out of Scope:**

- No automatic legal or compliance judgement, and no automatic final bid price — the system suggests, a human decides
- No OEM chosen without human approval
- Not a full accounting or ERP replacement
- Not a generic document generator
- No government-portal automation or auto-messaging as a baseline requirement (GeM portal support and WhatsApp notifications are noted as "if feasible"/"optional" in the client's own notes, not committed for MVP)

## 13. Open Questions, Risks and Recommended Tech Stack

**Still open (from Section 2, tracked here for visibility):**

1. OEM capacity model — confirm global-per-OEM before loading OEM data
2. Whether Group Head and Management are one approval level or two
3. Whether Finance checks anything at order verification, beyond Ops and Group Head
4. Confirm PDI conducting agency does or doesn't vary by contract

**Key risks:**

- **Data sensitivity:** defence tender data may need to stay within India, and some documents could be sensitive. Needs a direct answer from the client before deciding on hosting region and whether any AI-based features (like the plain-language query assistant) can process tender content, or must be restricted to structured fields only
- **Data quality:** past-bid intelligence and win/loss analysis are only as good as the Excel history being migrated. Needs a review pass on the actual sheets before import, not just the template structure
- **Scope creep on Phase 1:** the client's brief explicitly says the first three items (RFI, OEM master, quantity coverage) matter most — resist adding Phase 2/3 features into the first build

**Recommended tech stack:**

- Frontend: Next.js, deployed on Vercel or Netlify
- Database: Postgres via Supabase or Neon (matches the client's own request to move OEM data off Excel into one of these), with auth included
- Rationale: keeps data in Postgres so it survives a refresh, and cleanly separates what is missing, what failed, and what is empty on screen, per the client's own stack guidance
