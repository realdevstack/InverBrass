-- Core entities: the requirement (RFI), its line items, and the OEM master.

create table public.requirements (
  id uuid primary key default gen_random_uuid(),
  project_name text not null check (length(btrim(project_name)) > 0),
  customer_agency text not null check (length(btrim(customer_agency)) > 0),
  customer_division text,
  customer_sub_division text,
  source public.enquiry_source not null default 'email',
  gem_tender_number text,
  bid_type public.bid_type not null default 'single',
  submission_type public.submission_type not null default 'soft_copy',
  technical_specs text,
  special_remarks public.approval_needed not null default 'none',
  submission_deadline timestamptz,
  reminder_days_before integer not null default 7 check (reminder_days_before between 0 and 90),
  assigned_employee_id uuid references auth.users (id) on delete set null,
  status public.requirement_status not null default 'received',
  pursue_decision public.pursue_decision not null default 'undecided',
  regret_letter_logged boolean not null default false,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index requirements_status_idx on public.requirements (status);
create index requirements_assigned_idx on public.requirements (assigned_employee_id);
create index requirements_deadline_idx on public.requirements (submission_deadline);

create trigger requirements_set_updated_at
  before update on public.requirements
  for each row execute function public.set_updated_at();

-- Up to 500 part numbers per requirement: real rows, never text or JSON.
create table public.line_items (
  id uuid primary key default gen_random_uuid(),
  requirement_id uuid not null references public.requirements (id) on delete cascade,
  line_no integer not null check (line_no between 1 and 500),
  part_number text not null check (length(btrim(part_number)) > 0),
  description text,
  quantity numeric(14, 3) not null check (quantity > 0),
  uom text,
  required_delivery_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (requirement_id, line_no)
);

create index line_items_requirement_idx on public.line_items (requirement_id);
create index line_items_part_number_idx on public.line_items (part_number);

create trigger line_items_set_updated_at
  before update on public.line_items
  for each row execute function public.set_updated_at();

create table public.oems (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(btrim(name)) > 0),
  brand_product_category text,
  country_of_origin text,
  product_portfolio text,
  moq_rules text,
  lead_time_days integer check (lead_time_days is null or lead_time_days >= 0),
  pricing_validity text,
  freight_terms text,
  warranty_terms text,
  payment_terms text,
  commission_percentage numeric(5, 2) not null default 0
    check (commission_percentage between 0 and 100),
  nda_status text,
  bank_details text,
  -- The capacity model is global-per-OEM (PRD assumption #7). capacity is the
  -- OEM-declared total; NULL means "not stated", not zero.
  capacity numeric(14, 3) check (capacity is null or capacity >= 0),
  -- OEM approval comes from the government agency's own vendor list; Inverbrass
  -- stores the status and its source, it does not decide it.
  govt_vendor_list_status public.oem_approval_status not null default 'unknown',
  govt_vendor_list_source text,
  is_active boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index oems_active_idx on public.oems (is_active);

create trigger oems_set_updated_at
  before update on public.oems
  for each row execute function public.set_updated_at();

create table public.oem_contacts (
  id uuid primary key default gen_random_uuid(),
  oem_id uuid not null references public.oems (id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  designation text,
  email text,
  phone text,
  is_primary boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index oem_contacts_oem_idx on public.oem_contacts (oem_id);

create trigger oem_contacts_set_updated_at
  before update on public.oem_contacts
  for each row execute function public.set_updated_at();
