-- Document vault, OEM certifications, approvals and the audit log.

-- Every document has metadata and a private storage path. The client's pain
-- point is documents floating free of the PO that required them, so a document
-- must be linked to at least one of a PO, a requirement or an OEM.
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  document_type public.document_type not null,
  title text,
  supplier text,
  issue_date date,
  expiry_date date,
  renewal_reminder_days integer not null default 90 check (renewal_reminder_days >= 0),
  purchase_order_id uuid references public.purchase_orders (id) on delete cascade,
  requirement_id uuid references public.requirements (id) on delete cascade,
  oem_id uuid references public.oems (id) on delete cascade,
  line_item_id uuid,
  storage_bucket text not null default 'documents',
  storage_path text not null check (length(btrim(storage_path)) > 0),
  file_name text,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  notes text,
  uploaded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (purchase_order_id is not null or requirement_id is not null or oem_id is not null)
);

create index documents_po_idx on public.documents (purchase_order_id);
create index documents_requirement_idx on public.documents (requirement_id);
create index documents_oem_idx on public.documents (oem_id);
create index documents_expiry_idx on public.documents (expiry_date);

create trigger documents_set_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();

create table public.oem_certifications (
  id uuid primary key default gen_random_uuid(),
  oem_id uuid not null references public.oems (id) on delete cascade,
  certification_type text not null check (length(btrim(certification_type)) > 0),
  reference_number text,
  issued_by text,
  issue_date date,
  expiry_date date,
  reminder_days integer not null default 90 check (reminder_days >= 0),
  document_id uuid references public.documents (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index oem_certifications_oem_idx on public.oem_certifications (oem_id);
create index oem_certifications_expiry_idx on public.oem_certifications (expiry_date);

create trigger oem_certifications_set_updated_at
  before update on public.oem_certifications
  for each row execute function public.set_updated_at();

-- Two sequential approval levels (Group Head, then Management) per stage. The
-- order is data here, and record_approval() enforces it.
create table public.approvals (
  id uuid primary key default gen_random_uuid(),
  stage public.approval_stage not null,
  entity_type text not null check (length(btrim(entity_type)) > 0),
  entity_id uuid not null,
  level public.approval_level not null,
  decision public.approval_decision not null default 'pending',
  actor_id uuid references auth.users (id) on delete set null,
  note text,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  unique (entity_type, entity_id, stage, level)
);

create index approvals_entity_idx on public.approvals (entity_type, entity_id);
create index approvals_stage_idx on public.approvals (stage);

create table public.audit_log (
  id bigint generated always as identity primary key,
  table_name text not null,
  record_id uuid,
  action public.audit_action not null,
  actor_id uuid,
  changed_fields text[],
  old_values jsonb,
  new_values jsonb,
  at timestamptz not null default now()
);

create index audit_log_table_idx on public.audit_log (table_name, record_id);
create index audit_log_at_idx on public.audit_log (at desc);
