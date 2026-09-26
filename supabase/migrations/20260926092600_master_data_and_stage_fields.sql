-- Recovered requirements from the client workbook:
--   "Master Data Inputs" tab  -> Customer Master and Product / Part Master.
--   "Input Sheet" tab         -> per-stage fields the PRD omitted.
--
-- New area 'master' is added to both permission helpers so RLS covers the two
-- new tables; the app mirror in src/lib/rules/access.ts must match (parity test).

create type public.dispatch_clearance as enum ('pending', 'approved', 'hold');
create type public.delivery_closure as enum ('pending', 'closed');

-- --- Master data -----------------------------------------------------------

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(btrim(name)) > 0),
  division text,
  sub_division text,
  billing_address text,
  delivery_address text,
  gst_number text,
  gem_registration text,
  inverbrass_vendor_registration text,
  portal_login_mapping text,
  payment_terms text,
  approval_requirements text,
  is_active boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customers_active_idx on public.customers (is_active);

create trigger customers_set_updated_at
  before update on public.customers for each row execute function public.set_updated_at();

create table public.customer_contacts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  designation text,
  email text,
  phone text,
  is_primary boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customer_contacts_customer_idx on public.customer_contacts (customer_id);

create trigger customer_contacts_set_updated_at
  before update on public.customer_contacts for each row execute function public.set_updated_at();

create table public.products (
  id uuid primary key default gen_random_uuid(),
  part_number text not null check (length(btrim(part_number)) > 0),
  client_part_number text,
  description text,
  hsn_code text,
  oem_id uuid references public.oems (id) on delete set null,
  uom text,
  product_category text,
  technical_specifications text,
  compliance_certifications text[] not null default '{}',
  shelf_life text,
  export_restriction text,
  lead_time_days integer check (lead_time_days is null or lead_time_days >= 0),
  moq numeric(14, 3) check (moq is null or moq >= 0),
  standard_price numeric(14, 2) check (standard_price is null or standard_price >= 0),
  currency text not null default 'INR' check (length(btrim(currency)) between 1 and 8),
  is_active boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_part_number_idx on public.products (part_number);
create index products_client_part_number_idx on public.products (client_part_number);
create index products_oem_idx on public.products (oem_id);

create trigger products_set_updated_at
  before update on public.products for each row execute function public.set_updated_at();

-- --- Per-stage fields the PRD omitted --------------------------------------

alter table public.requirements
  add column quotation_validity_days integer check (quotation_validity_days is null or quotation_validity_days >= 0),
  add column staggered_delivery boolean not null default false;

alter table public.line_items
  add column client_part_number text,
  add column oem_id uuid references public.oems (id) on delete set null;

alter table public.quotations
  add column currency text not null default 'INR' check (length(btrim(currency)) between 1 and 8),
  add column discount_amount numeric(14, 2) check (discount_amount is null or discount_amount >= 0),
  add column validity_days integer check (validity_days is null or validity_days >= 0),
  add column internal_notes text,
  add column attachment_document_id uuid references public.documents (id) on delete set null;

alter table public.purchase_orders
  add column special_conditions text,
  add column pdi_inspector text,
  add column amendment_note text;

alter table public.material_readiness
  add column quantity_ready numeric(14, 3) check (quantity_ready is null or quantity_ready >= 0);

alter table public.pdis
  add column line_item_id uuid references public.line_items (id) on delete set null,
  add column inspector_details text,
  add column dispatch_clearance public.dispatch_clearance not null default 'pending',
  add column test_certificate_document_id uuid references public.documents (id) on delete set null;

alter table public.oem_invoices
  add column courier_details text;

alter table public.deliveries
  add column closure_status public.delivery_closure not null default 'pending',
  add column remarks text;

alter table public.payments
  add column remarks text;

alter table public.commission_invoices
  add column invoice_date date,
  add column payment_due_date date,
  add column payment_received_date date,
  add column gross_invoice_value numeric(14, 2) check (gross_invoice_value is null or gross_invoice_value >= 0);

-- --- Extend the permission helpers with the 'master' area ------------------

create or replace function public.role_can_read(p_area text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with access(role, areas) as (
    values
      ('owner',      array['requirements','oem','sourcing','quotation','order','fulfilment','finance','documents','master','admin']),
      ('group_head', array['requirements','oem','sourcing','quotation','order','fulfilment','finance','documents','master','admin']),
      ('management', array['requirements','oem','sourcing','quotation','order','fulfilment','finance','documents','master','admin']),
      ('sales',      array['requirements','oem','sourcing','quotation','documents','master']),
      ('operations', array['requirements','oem','order','fulfilment','documents','master']),
      ('finance',    array['requirements','oem','order','finance','documents','master'])
  )
  select coalesce((select p_area = any(areas) from access where role = public.auth_role()::text), false);
$$;

create or replace function public.role_can_write(p_area text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with access(role, areas) as (
    values
      ('owner',      array['requirements','oem','sourcing','quotation','order','fulfilment','finance','documents','master','admin']),
      ('group_head', array['requirements','oem','sourcing','quotation','order','documents','master','admin']),
      ('management', array['requirements','oem','sourcing','quotation','order','documents','master','admin']),
      ('sales',      array['requirements','oem','sourcing','quotation','documents','master']),
      ('operations', array['order','fulfilment','documents']),
      ('finance',    array['finance','documents'])
  )
  select coalesce((select p_area = any(areas) from access where role = public.auth_role()::text), false);
$$;

grant execute on function public.role_can_read(text) to authenticated;
grant execute on function public.role_can_write(text) to authenticated;

alter table public.customers enable row level security;
create policy customers_select on public.customers for select to authenticated
  using (public.role_can_read('master'));
create policy customers_write on public.customers for all to authenticated
  using (public.role_can_write('master')) with check (public.role_can_write('master'));

alter table public.customer_contacts enable row level security;
create policy customer_contacts_select on public.customer_contacts for select to authenticated
  using (public.role_can_read('master'));
create policy customer_contacts_write on public.customer_contacts for all to authenticated
  using (public.role_can_write('master')) with check (public.role_can_write('master'));

alter table public.products enable row level security;
create policy products_select on public.products for select to authenticated
  using (public.role_can_read('master'));
create policy products_write on public.products for all to authenticated
  using (public.role_can_write('master')) with check (public.role_can_write('master'));

-- Audit the new master tables like the rest.
create trigger customers_audit after insert or update or delete on public.customers
  for each row execute function public.audit_trigger();
create trigger customer_contacts_audit after insert or update or delete on public.customer_contacts
  for each row execute function public.audit_trigger();
create trigger products_audit after insert or update or delete on public.products
  for each row execute function public.audit_trigger();
