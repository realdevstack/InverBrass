-- Module 3 — quotations (versioned) and their revision snapshots.

create table public.quotations (
  id uuid primary key default gen_random_uuid(),
  requirement_id uuid not null references public.requirements (id) on delete cascade,
  oem_id uuid references public.oems (id) on delete set null,
  line_item_id uuid,
  version integer not null default 1 check (version >= 1),
  status public.quotation_status not null default 'draft',
  is_current boolean not null default true,
  -- Pricing inputs. recommended_price is a suggestion only: a human always sets
  -- final_price, so no column ever auto-writes the figure that leaves the door.
  oem_price numeric(14, 2) check (oem_price is null or oem_price >= 0),
  freight_amount numeric(14, 2) check (freight_amount is null or freight_amount >= 0),
  gst_amount numeric(14, 2) check (gst_amount is null or gst_amount >= 0),
  target_margin_percentage numeric(5, 2) check (target_margin_percentage is null or target_margin_percentage between -100 and 100),
  recommended_price numeric(14, 2) check (recommended_price is null or recommended_price >= 0),
  final_price numeric(14, 2) check (final_price is null or final_price >= 0),
  delivery_terms text,
  lead_time_days integer check (lead_time_days is null or lead_time_days >= 0),
  payment_terms text,
  -- Government-format export: store which agency format was used.
  export_format text,
  pnc_status public.pnc_status not null default 'not_applicable',
  technical_compliance boolean,
  commercial_compliance boolean,
  -- Loss intelligence (all optional; L1 price is only sometimes disclosed).
  loss_reason public.loss_reason,
  l1_price numeric(14, 2) check (l1_price is null or l1_price >= 0),
  competitor text,
  submitted_at timestamptz,
  post_submission_status public.post_submission_status,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (requirement_id, version),
  unique (id, requirement_id),
  foreign key (line_item_id, requirement_id)
    references public.line_items (id, requirement_id) on delete cascade
);

create index quotations_requirement_idx on public.quotations (requirement_id);
create index quotations_status_idx on public.quotations (status);
create index quotations_oem_idx on public.quotations (oem_id);

create trigger quotations_set_updated_at
  before update on public.quotations
  for each row execute function public.set_updated_at();

create table public.quotation_versions (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations (id) on delete cascade,
  version integer not null check (version >= 1),
  snapshot jsonb not null,
  change_note text,
  changed_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (quotation_id, version)
);

create index quotation_versions_quotation_idx on public.quotation_versions (quotation_id);
