-- Module 4 — purchase orders. A PO always maps to an approved quotation:
-- quotation_id is NOT NULL, the composite FK ties the PO to the quotation's own
-- requirement, and a trigger (added with the other hard rules) refuses any
-- quotation that is not approved.

create table public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  po_number text not null unique check (length(btrim(po_number)) > 0),
  po_date date not null,
  quotation_id uuid not null,
  requirement_id uuid not null references public.requirements (id) on delete restrict,
  customer text not null check (length(btrim(customer)) > 0),
  oem_id uuid references public.oems (id) on delete set null,
  line_item_id uuid,
  part_number text,
  quantity_ordered numeric(14, 3) not null check (quantity_ordered > 0),
  unit_price numeric(14, 2) not null check (unit_price >= 0),
  po_value numeric(14, 2) not null check (po_value >= 0),
  taxes_gst numeric(14, 2) not null default 0 check (taxes_gst >= 0),
  delivery_schedule text,
  partial_delivery_allowed boolean not null default true,
  pdi_required boolean not null default true,
  pdi_mode public.pdi_mode,
  documentation_required text,
  warranty_terms text,
  payment_terms text,
  status public.po_status not null default 'open',
  -- Forward reference to public.documents; FK added once documents exists.
  po_copy_document_id uuid,
  -- Order-verification checklist (Ops) with Group Head sign-off before acceptance.
  verification_spec_match boolean,
  verification_price_match boolean,
  verification_feasibility boolean,
  verification_documents_complete boolean,
  verified_by uuid references auth.users (id) on delete set null,
  verified_at timestamptz,
  group_head_signoff_by uuid references auth.users (id) on delete set null,
  group_head_signoff_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (quotation_id, requirement_id)
    references public.quotations (id, requirement_id) on delete restrict,
  foreign key (line_item_id, requirement_id)
    references public.line_items (id, requirement_id) on delete set null
);

create index purchase_orders_quotation_idx on public.purchase_orders (quotation_id);
create index purchase_orders_requirement_idx on public.purchase_orders (requirement_id);
create index purchase_orders_oem_idx on public.purchase_orders (oem_id);
create index purchase_orders_status_idx on public.purchase_orders (status);

create trigger purchase_orders_set_updated_at
  before update on public.purchase_orders
  for each row execute function public.set_updated_at();
