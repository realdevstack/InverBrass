-- Inverbrass Defence CRM — every status enum for the requirement spine.
-- Open questions were resolved in favour of TECH-STACK.md: two approval levels,
-- and the six-role set (owner, group_head, management, sales, operations, finance).

-- Module 1 — Requirement / RFI
create type public.requirement_status as enum (
  'received', 'qualifying', 'quoted', 'submitted', 'won', 'lost', 'cancelled'
);
create type public.bid_type as enum ('single', 'double');
create type public.submission_type as enum ('hard_copy', 'soft_copy', 'both');
create type public.enquiry_source as enum (
  'email', 'gem_portal', 'client_portal', 'direct_customer', 'through_oem'
);
create type public.approval_needed as enum ('rcma', 'cemilac', 'lcso', 'mil', 'none');
create type public.pursue_decision as enum ('undecided', 'pursued', 'not_pursued');

-- Module 2 — OEM master, sourcing and quantity coverage
create type public.oem_approval_status as enum ('approved', 'not_approved', 'pending', 'unknown');
create type public.sourcing_channel as enum ('email', 'whatsapp', 'phone', 'portal', 'other');
create type public.sourcing_response_type as enum (
  'no_response', 'price_indication', 'availability', 'firm_quote', 'decline'
);

-- Module 3 — Quotation and bid intelligence
create type public.quotation_status as enum (
  'draft', 'pending_group_head', 'pending_management', 'approved',
  'submitted', 'clarification_requested', 'technical_clarification',
  'commercial_negotiation', 'awaiting_approval', 'won', 'lost', 'cancelled'
);
create type public.pnc_status as enum ('not_applicable', 'pending', 'in_progress', 'completed');
create type public.loss_reason as enum (
  'price', 'technical_non_compliance', 'delivery_timeline', 'competitor_preference',
  'quantity_or_capacity', 'cancelled', 'not_pursued', 'other'
);
create type public.post_submission_status as enum (
  'submitted', 'clarification_requested', 'technical_clarification',
  'commercial_negotiation', 'awaiting_approval', 'won', 'lost', 'cancelled'
);

-- Module 4 — Purchase order and material readiness
create type public.po_status as enum ('open', 'processing', 'completed', 'cancelled');
create type public.material_status as enum (
  'not_started', 'in_production', 'ready', 'qc_pending', 'qc_passed', 'qc_failed'
);

-- Module 5 — PDI, invoicing and delivery
create type public.pdi_mode as enum ('vc', 'physical');
create type public.inspection_agency as enum ('dgqa', 'client_agency', 'internal', 'third_party');
create type public.pdi_result as enum ('pending', 'cleared', 'partially_cleared', 'rejected');
create type public.invoice_status as enum ('raised', 'submitted', 'approved', 'paid', 'cancelled');
create type public.delivery_status as enum ('in_transit', 'delivered', 'partially_delivered', 'cancelled');
create type public.material_acceptance_status as enum (
  'pending', 'accepted', 'partially_accepted', 'rejected'
);

-- Module 6 — Payments and commission
create type public.payment_mode as enum ('rtgs', 'neft', 'wire', 'other');
create type public.payment_status as enum ('pending', 'partially_paid', 'paid', 'overdue');
create type public.followup_status as enum ('none', 'reminded', 'escalated', 'resolved');
create type public.commission_status as enum ('draft', 'raised', 'submitted', 'partially_paid', 'paid', 'overdue');

-- Module 6 — Document vault
create type public.document_type as enum (
  'rcma', 'cemilac', 'dgqa', 'lcso', 'mil', 'test_certificate', 'delivery_challan',
  'lr_copy', 'payment_proof', 'po_copy', 'invoice_copy', 'pdi_report', 'regret_letter',
  'tender_document', 'technical_specification', 'drawing', 'proof_of_delivery', 'other'
);

-- Module 7 — Approvals and audit
create type public.approval_stage as enum (
  'rfi_qualified', 'quotation_submitted', 'oem_selected', 'order_accepted', 'document_approved'
);
create type public.approval_level as enum ('group_head', 'management');
create type public.approval_decision as enum ('pending', 'approved', 'rejected');
create type public.audit_action as enum ('insert', 'update', 'delete');
create type public.user_role as enum ('owner', 'group_head', 'management', 'sales', 'operations', 'finance');
