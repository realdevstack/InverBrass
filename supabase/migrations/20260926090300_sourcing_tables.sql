-- Module 2 — sourcing log and the quantity-commitment ledger (the spine).

-- Let a commitment prove its line item belongs to its requirement.
alter table public.line_items
  add constraint line_items_id_requirement_key unique (id, requirement_id);

create table public.sourcing_requests (
  id uuid primary key default gen_random_uuid(),
  requirement_id uuid not null references public.requirements (id) on delete cascade,
  oem_id uuid not null references public.oems (id) on delete restrict,
  line_item_id uuid,
  channel public.sourcing_channel not null default 'email',
  subject text,
  message text,
  sent_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (line_item_id, requirement_id)
    references public.line_items (id, requirement_id) on delete cascade
);

create index sourcing_requests_requirement_idx on public.sourcing_requests (requirement_id);
create index sourcing_requests_oem_idx on public.sourcing_requests (oem_id);

create table public.sourcing_responses (
  id uuid primary key default gen_random_uuid(),
  sourcing_request_id uuid not null references public.sourcing_requests (id) on delete cascade,
  response_type public.sourcing_response_type not null default 'no_response',
  response_text text,
  quoted_unit_price numeric(14, 2) check (quoted_unit_price is null or quoted_unit_price >= 0),
  lead_time_days integer check (lead_time_days is null or lead_time_days >= 0),
  valid_until date,
  received_at timestamptz not null default now(),
  -- Forward reference to public.documents; the FK is added once documents exists.
  attachment_document_id uuid,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index sourcing_responses_request_idx on public.sourcing_responses (sourcing_request_id);

-- Every commitment is one row. Only firm = true reduces an uncovered balance.
-- Global-per-OEM capacity and per-order coverage are both views over these rows,
-- so confirming either model later is a view change, not a data migration.
create table public.quantity_commitments (
  id uuid primary key default gen_random_uuid(),
  oem_id uuid not null references public.oems (id) on delete restrict,
  requirement_id uuid not null references public.requirements (id) on delete cascade,
  line_item_id uuid,
  quantity numeric(14, 3) not null check (quantity > 0),
  firm boolean not null default false,
  source text not null default 'availability_indication'
    check (length(btrim(source)) > 0),
  sourcing_response_id uuid references public.sourcing_responses (id) on delete set null,
  notes text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- A firm commitment must name its backing source (quote or written confirmation).
  check (not firm or source <> 'availability_indication'),
  foreign key (line_item_id, requirement_id)
    references public.line_items (id, requirement_id) on delete cascade
);

create index quantity_commitments_oem_idx on public.quantity_commitments (oem_id);
create index quantity_commitments_requirement_idx on public.quantity_commitments (requirement_id);
create index quantity_commitments_line_item_idx on public.quantity_commitments (line_item_id);
create index quantity_commitments_firm_idx on public.quantity_commitments (firm);

create trigger quantity_commitments_set_updated_at
  before update on public.quantity_commitments
  for each row execute function public.set_updated_at();
