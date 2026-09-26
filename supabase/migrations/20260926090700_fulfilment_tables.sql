-- Modules 4-6 — material readiness, PDI, OEM invoices, deliveries, payments and commission.

create table public.material_readiness (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders (id) on delete cascade,
  line_item_id uuid,
  batch_number text,
  serial_number text,
  production_status public.material_status not null default 'not_started',
  qc_status public.material_status not null default 'not_started',
  tentative_pdi_date date,
  expected_completion_date date,
  remarks text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index material_readiness_po_idx on public.material_readiness (purchase_order_id);

create trigger material_readiness_set_updated_at
  before update on public.material_readiness
  for each row execute function public.set_updated_at();

-- Quantity offered / cleared / rejected are three separate numbers, not one flag.
create table public.pdis (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders (id) on delete cascade,
  material_readiness_id uuid references public.material_readiness (id) on delete set null,
  inspection_type public.pdi_mode not null default 'physical',
  inspection_agency public.inspection_agency not null default 'internal',
  scheduled_date date,
  conducted_date date,
  quantity_offered numeric(14, 3) not null default 0 check (quantity_offered >= 0),
  quantity_cleared numeric(14, 3) not null default 0 check (quantity_cleared >= 0),
  quantity_rejected numeric(14, 3) not null default 0 check (quantity_rejected >= 0),
  result public.pdi_result not null default 'pending',
  rejection_remarks text,
  re_pdi_required boolean not null default false,
  report_document_id uuid references public.documents (id) on delete set null,
  conducted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (quantity_cleared + quantity_rejected <= quantity_offered)
);

create index pdis_po_idx on public.pdis (purchase_order_id);
create index pdis_result_idx on public.pdis (result);

create trigger pdis_set_updated_at
  before update on public.pdis
  for each row execute function public.set_updated_at();

create table public.oem_invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null check (length(btrim(invoice_number)) > 0),
  invoice_date date not null,
  purchase_order_id uuid not null references public.purchase_orders (id) on delete restrict,
  pdi_id uuid references public.pdis (id) on delete restrict,
  quantity_invoiced numeric(14, 3) not null check (quantity_invoiced > 0),
  is_full_invoice boolean not null default true,
  balance_quantity numeric(14, 3) not null default 0 check (balance_quantity >= 0),
  net_amount numeric(14, 2) not null default 0 check (net_amount >= 0),
  gst_amount numeric(14, 2) not null default 0 check (gst_amount >= 0),
  gross_amount numeric(14, 2) not null default 0 check (gross_amount >= 0),
  dispatch_date date,
  lr_awb_number text,
  e_way_bill_number text,
  documents_submitted text,
  payment_due_date date,
  status public.invoice_status not null default 'raised',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (purchase_order_id, invoice_number)
);

create index oem_invoices_po_idx on public.oem_invoices (purchase_order_id);
create index oem_invoices_status_idx on public.oem_invoices (status);

create trigger oem_invoices_set_updated_at
  before update on public.oem_invoices
  for each row execute function public.set_updated_at();

create table public.deliveries (
  id uuid primary key default gen_random_uuid(),
  delivery_reference text,
  oem_invoice_id uuid not null references public.oem_invoices (id) on delete cascade,
  delivery_date date,
  location text,
  quantity_delivered numeric(14, 3) not null check (quantity_delivered > 0),
  delivery_status public.delivery_status not null default 'in_transit',
  material_acceptance_status public.material_acceptance_status not null default 'pending',
  grn_number text,
  pending_balance numeric(14, 3) not null default 0 check (pending_balance >= 0),
  proof_of_delivery_document_id uuid references public.documents (id) on delete set null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index deliveries_invoice_idx on public.deliveries (oem_invoice_id);

create trigger deliveries_set_updated_at
  before update on public.deliveries
  for each row execute function public.set_updated_at();

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  payment_reference text,
  oem_invoice_id uuid not null references public.oem_invoices (id) on delete cascade,
  customer text,
  oem_id uuid references public.oems (id) on delete set null,
  invoice_amount numeric(14, 2) not null default 0 check (invoice_amount >= 0),
  amount_received numeric(14, 2) not null check (amount_received > 0),
  balance_outstanding numeric(14, 2) not null default 0 check (balance_outstanding >= 0),
  payment_date date not null,
  terms text,
  mode public.payment_mode not null default 'neft',
  proof_document_id uuid references public.documents (id) on delete set null,
  overdue_days integer not null default 0 check (overdue_days >= 0),
  followup_status public.followup_status not null default 'none',
  status public.payment_status not null default 'pending',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payments_invoice_idx on public.payments (oem_invoice_id);
create index payments_date_idx on public.payments (payment_date);

create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

create table public.commission_invoices (
  id uuid primary key default gen_random_uuid(),
  commission_invoice_number text not null unique check (length(btrim(commission_invoice_number)) > 0),
  oem_invoice_id uuid not null references public.oem_invoices (id) on delete restrict,
  oem_id uuid references public.oems (id) on delete set null,
  customer_name text,
  commission_percentage numeric(5, 2) not null check (commission_percentage between 0 and 100),
  base_invoice_amount numeric(14, 2) not null check (base_invoice_amount >= 0),
  commission_amount numeric(14, 2) not null check (commission_amount >= 0),
  gst_amount numeric(14, 2) not null default 0 check (gst_amount >= 0),
  tds_amount numeric(14, 2) not null default 0 check (tds_amount >= 0),
  payment_status public.commission_status not null default 'draft',
  outstanding_amount numeric(14, 2) not null default 0 check (outstanding_amount >= 0),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index commission_invoices_oem_voucher_idx on public.commission_invoices (oem_invoice_id);

create trigger commission_invoices_set_updated_at
  before update on public.commission_invoices
  for each row execute function public.set_updated_at();
