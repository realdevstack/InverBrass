-- How the master data joins the order-management stages (Sheet1 flow):
--   Customer Master  -> requirements.customer_id, purchase_orders.customer_id
--   Product / Part   -> line_items.product_id (the RFI line that becomes a quote,
--                       a PO line, a PDI item, an invoice line and a delivery)
-- The links are nullable and additive: existing free-text customer_agency and
-- part_number keep working, so nothing breaks if a master row is missing.

alter table public.requirements
  add column if not exists customer_id uuid references public.customers (id) on delete set null;

alter table public.purchase_orders
  add column if not exists customer_id uuid references public.customers (id) on delete set null;

alter table public.line_items
  add column if not exists product_id uuid references public.products (id) on delete set null;

create index if not exists requirements_customer_idx on public.requirements (customer_id);
create index if not exists purchase_orders_customer_idx on public.purchase_orders (customer_id);
create index if not exists line_items_product_idx on public.line_items (product_id);

-- PDI status report (Operational Reports): one row per PDI with its links, so
-- the report shows the inspection outcome against the PO and part.
create view public.v_pdi_status
with (security_invoker = true) as
select
  p.id as pdi_id,
  p.pdi_number,
  p.purchase_order_id,
  po.po_number,
  o.name as oem_name,
  po.customer,
  p.line_item_id,
  li.part_number,
  p.inspection_type,
  p.inspection_agency,
  p.scheduled_date,
  p.conducted_date,
  p.quantity_offered,
  p.quantity_cleared,
  p.quantity_rejected,
  p.result,
  p.dispatch_clearance,
  p.re_pdi_required,
  p.inspector_details
from public.pdis p
join public.purchase_orders po on po.id = p.purchase_order_id
left join public.oems o on o.id = po.oem_id
left join public.line_items li on li.id = p.line_item_id;
