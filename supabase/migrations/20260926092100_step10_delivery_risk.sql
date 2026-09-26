-- Step 10 — the order risk view and the extension-request fields.
--
-- LD risk compares expected completion (from material readiness) against the
-- committed deadline. The committed deadline is its own column so it survives a
-- line-item edit; it is backfilled from the line item's required delivery date.

alter table public.purchase_orders
  add column committed_deadline date,
  add column extension_requested_at timestamptz,
  add column extension_note text;

update public.purchase_orders po
set committed_deadline = li.required_delivery_date
from public.line_items li
where po.line_item_id = li.id
  and po.committed_deadline is null
  and li.required_delivery_date is not null;

create view public.v_order_risk
with (security_invoker = true) as
select
  po.id as purchase_order_id,
  po.po_number,
  po.status,
  po.requirement_id,
  r.project_name,
  r.customer_agency,
  po.oem_id,
  o.name as oem_name,
  po.quantity_ordered,
  po.po_value,
  po.committed_deadline,
  po.extension_requested_at,
  po.extension_note,
  mr.production_status,
  mr.qc_status,
  mr.tentative_pdi_date,
  mr.expected_completion_date,
  mr.batch_number,
  mr.serial_number,
  pdi.latest_pdi_result,
  pdi.latest_pdi_date,
  pdi.rejected_quantity,
  inv.invoiced_quantity,
  case when po.committed_deadline is null then null else (po.committed_deadline - current_date) end as days_to_deadline
from public.purchase_orders po
join public.requirements r on r.id = po.requirement_id
left join public.oems o on o.id = po.oem_id
left join lateral (
  select
    m.production_status,
    m.qc_status,
    m.tentative_pdi_date,
    m.expected_completion_date,
    m.batch_number,
    m.serial_number
  from public.material_readiness m
  where m.purchase_order_id = po.id
  order by m.created_at desc
  limit 1
) mr on true
left join lateral (
  select
    p.result as latest_pdi_result,
    p.conducted_date as latest_pdi_date,
    p.quantity_rejected as rejected_quantity
  from public.pdis p
  where p.purchase_order_id = po.id
  order by p.created_at desc
  limit 1
) pdi on true
left join lateral (
  select coalesce(sum(i.quantity_invoiced), 0) as invoiced_quantity
  from public.oem_invoices i
  where i.purchase_order_id = po.id
    and i.status <> 'cancelled'
) inv on true;
