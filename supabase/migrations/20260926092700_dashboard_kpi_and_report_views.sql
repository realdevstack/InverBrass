-- Recovered requirements from the "Dashboard requirements" tab: the extra
-- management-dashboard tiles, the Critical KPIs, and the missing reports.
-- All read models; no new writes. security_invoker keeps RLS in force.

-- --- Management dashboard tiles -------------------------------------------

drop view if exists public.v_dashboard_metrics;

create view public.v_dashboard_metrics
with (security_invoker = true) as
select
  (select count(*) from public.requirements) as total_rfis,
  (select count(*) from public.requirements where status in ('received', 'qualifying')) as rfis_open,
  (select count(*) from public.quotations where status in ('draft', 'pending_group_head', 'pending_management', 'approved')) as active_quotations,
  (select count(*) from public.purchase_orders where status in ('open', 'processing')) as open_pos,
  (select count(*) from public.deliveries where delivery_status not in ('delivered', 'cancelled')) as pending_deliveries,
  (select count(*) from public.oem_invoices where status <> 'paid' and status <> 'cancelled') as pending_oem_invoices,
  (select count(*) from public.oem_invoices where status <> 'paid' and status <> 'cancelled' and payment_due_date < current_date) as overdue_invoices,
  (select coalesce(sum(c.outstanding_amount), 0) from public.commission_invoices c where c.payment_status <> 'paid') as commission_receivable,
  (select count(*) from public.documents where expiry_date is not null and expiry_date <= current_date + 90) as documents_expiring,
  (select count(*) from public.requirements where status = 'won') as won_requirements,
  (select count(*) from public.requirements where status = 'lost') as lost_requirements,
  (select count(*) from public.requirements where status = 'submitted') as submitted_requirements;

-- --- Critical KPIs ----------------------------------------------------------

create view public.v_quotation_turnaround
with (security_invoker = true) as
select
  q.id as quotation_id,
  q.requirement_id,
  q.created_at,
  q.submitted_at,
  case when q.submitted_at is null then null
       else greatest(round((extract(epoch from (q.submitted_at - q.created_at)) / 86400)::numeric, 2), 0)
  end as turnaround_days
from public.quotations q;

create view public.v_delivery_adherence
with (security_invoker = true) as
select
  d.id as delivery_id,
  i.purchase_order_id,
  po.oem_id,
  d.delivery_date,
  po.committed_deadline,
  case when d.delivery_date is null or po.committed_deadline is null then null
       else (d.delivery_date <= po.committed_deadline)
  end as on_time
from public.deliveries d
join public.oem_invoices i on i.id = d.oem_invoice_id
join public.purchase_orders po on po.id = i.purchase_order_id
where d.delivery_status <> 'cancelled';

create view public.v_payment_collection
with (security_invoker = true) as
select
  i.id as oem_invoice_id,
  i.purchase_order_id,
  i.invoice_date,
  min(p.payment_date) as first_payment_date,
  case when min(p.payment_date) is null or i.invoice_date is null then null
       else (min(p.payment_date) - i.invoice_date)
  end as collection_days
from public.oem_invoices i
left join public.payments p on p.oem_invoice_id = i.id
group by i.id, i.purchase_order_id, i.invoice_date;

create view public.v_commission_recovery
with (security_invoker = true) as
select
  c.id as commission_invoice_id,
  c.oem_invoice_id,
  c.created_at::date as raised_on,
  max(p.payment_date) as oem_paid_on,
  case when max(p.payment_date) is null then null
       else (c.created_at::date - max(p.payment_date))
  end as recovery_days
from public.commission_invoices c
left join public.payments p on p.oem_invoice_id = c.oem_invoice_id
group by c.id, c.oem_invoice_id, c.created_at;

create view public.v_oem_performance
with (security_invoker = true) as
select
  o.id as oem_id,
  o.name as oem_name,
  count(a.delivery_id) as deliveries,
  count(*) filter (where a.on_time) as on_time_deliveries,
  case when count(*) filter (where a.on_time is not null) = 0 then null
       else round(100.0 * count(*) filter (where a.on_time) / count(*) filter (where a.on_time is not null), 1)
  end as on_time_percentage
from public.oems o
left join public.v_delivery_adherence a on a.oem_id = o.id
group by o.id, o.name;

create view public.v_employee_performance
with (security_invoker = true) as
select
  ur.user_id,
  ur.full_name,
  count(r.id) as requirements,
  count(*) filter (where r.status = 'won') as won,
  case when count(r.id) = 0 then null
       else round(100.0 * count(*) filter (where r.status = 'won') / count(r.id), 1)
  end as closure_percentage
from public.user_roles ur
left join public.requirements r on r.assigned_employee_id = ur.user_id
group by ur.user_id, ur.full_name;

create view public.v_client_repeat
with (security_invoker = true) as
select
  po.customer as client,
  count(*) as po_count
from public.purchase_orders po
where po.status <> 'cancelled'
group by po.customer;

-- --- Missing reports --------------------------------------------------------

create view public.v_product_sales
with (security_invoker = true) as
select
  coalesce(li.part_number, po.part_number, '—') as part_number,
  o.name as oem_name,
  count(distinct po.id) as po_count,
  coalesce(sum(po.po_value), 0) as total_value
from public.purchase_orders po
left join public.line_items li on li.id = po.line_item_id
left join public.oems o on o.id = po.oem_id
where po.status <> 'cancelled'
group by 1, 2;

create view public.v_yearly_sales
with (security_invoker = true) as
select
  to_char(po.po_date, 'YYYY') as year,
  count(*) as po_count,
  coalesce(sum(po.po_value), 0) as total_value
from public.purchase_orders po
where po.status <> 'cancelled'
group by 1
order by 1;

create view public.v_pending_quotations
with (security_invoker = true) as
select
  q.id as quotation_id,
  q.quotation_number,
  r.project_name,
  r.customer_agency,
  q.status,
  q.final_price,
  q.created_at::date as raised_on,
  (current_date - q.created_at::date) as age_days
from public.quotations q
join public.requirements r on r.id = q.requirement_id
where q.status in (
  'draft', 'pending_group_head', 'pending_management', 'approved', 'submitted',
  'clarification_requested', 'technical_clarification', 'commercial_negotiation', 'awaiting_approval'
);

create view public.v_po_tracking
with (security_invoker = true) as
select
  po.id as purchase_order_id,
  po.po_number,
  po.customer,
  o.name as oem_name,
  po.po_value,
  po.status,
  po.committed_deadline,
  po.quantity_ordered,
  coalesce(inv.invoiced_qty, 0) as invoiced_quantity,
  coalesce(del.delivered_qty, 0) as delivered_quantity,
  greatest(po.quantity_ordered - coalesce(del.delivered_qty, 0), 0) as balance_quantity
from public.purchase_orders po
left join public.oems o on o.id = po.oem_id
left join lateral (
  select sum(i.quantity_invoiced) as invoiced_qty
  from public.oem_invoices i
  where i.purchase_order_id = po.id and i.status <> 'cancelled'
) inv on true
left join lateral (
  select sum(d.quantity_delivered) as delivered_qty
  from public.deliveries d
  join public.oem_invoices i on i.id = d.oem_invoice_id
  where i.purchase_order_id = po.id and d.delivery_status <> 'cancelled'
) del on true;

create view public.v_delivery_status
with (security_invoker = true) as
select
  d.id as delivery_id,
  d.delivery_reference,
  d.delivery_status,
  d.material_acceptance_status,
  d.closure_status,
  d.delivery_date,
  d.quantity_delivered,
  d.pending_balance,
  d.grn_number,
  i.invoice_number,
  i.purchase_order_id
from public.deliveries d
join public.oem_invoices i on i.id = d.oem_invoice_id;

create view public.v_followup_tracker
with (security_invoker = true) as
select
  i.id as oem_invoice_id,
  i.invoice_number,
  po.customer,
  i.payment_due_date,
  i.status,
  coalesce(pay.paid, 0) as paid_amount,
  greatest(i.gross_amount - coalesce(pay.paid, 0), 0) as balance_outstanding,
  case when i.payment_due_date is null then null else (current_date - i.payment_due_date) end as overdue_days,
  coalesce(pay.latest_followup, 'none') as followup_status
from public.oem_invoices i
join public.purchase_orders po on po.id = i.purchase_order_id
left join lateral (
  select
    sum(p.amount_received) as paid,
    (array_agg(p.followup_status::text order by p.payment_date desc))[1] as latest_followup
  from public.payments p
  where p.oem_invoice_id = i.id
) pay on true
where i.status <> 'cancelled' and greatest(i.gross_amount - coalesce(pay.paid, 0), 0) > 0;

create view public.v_commission_receivable
with (security_invoker = true) as
select
  c.id as commission_invoice_id,
  c.commission_invoice_number,
  c.customer_name,
  o.name as oem_name,
  c.base_invoice_amount,
  c.commission_amount,
  c.gst_amount,
  c.tds_amount,
  c.outstanding_amount,
  c.payment_status,
  c.invoice_date,
  c.payment_due_date
from public.commission_invoices c
left join public.oems o on o.id = c.oem_id
where c.payment_status <> 'paid' and c.outstanding_amount > 0;

create view public.v_margin_report
with (security_invoker = true) as
select
  q.id as quotation_id,
  q.quotation_number,
  r.project_name,
  q.final_price,
  q.oem_price,
  q.freight_amount,
  case when q.final_price is null or q.oem_price is null then null
       else round(q.final_price - q.oem_price - coalesce(q.freight_amount, 0), 2)
  end as margin_amount,
  case when q.final_price is null or q.final_price = 0 or q.oem_price is null then null
       else round(100.0 * (q.final_price - q.oem_price - coalesce(q.freight_amount, 0)) / q.final_price, 2)
  end as margin_percentage
from public.quotations q
join public.requirements r on r.id = q.requirement_id
where q.final_price is not null;

create view public.v_tax_summary
with (security_invoker = true) as
select
  m.month,
  coalesce(inv.gst, 0) as gst_on_invoices,
  coalesce(com.gst, 0) as gst_on_commission,
  coalesce(com.tds, 0) as tds_deducted
from (
  select distinct to_char(coalesce(invoice_date, created_at::date), 'YYYY-MM') as month from public.oem_invoices
  union
  select distinct to_char(coalesce(invoice_date, created_at::date), 'YYYY-MM') from public.commission_invoices
) m
left join lateral (
  select sum(gst_amount) as gst
  from public.oem_invoices
  where to_char(coalesce(invoice_date, created_at::date), 'YYYY-MM') = m.month
) inv on true
left join lateral (
  select sum(gst_amount) as gst, sum(tds_amount) as tds
  from public.commission_invoices
  where to_char(coalesce(invoice_date, created_at::date), 'YYYY-MM') = m.month
) com on true
order by m.month;

create view public.v_profitability
with (security_invoker = true) as
select
  r.id as requirement_id,
  r.project_name,
  r.customer_agency,
  coalesce(po.revenue, 0) as revenue,
  coalesce(ci.commission_earned, 0) as commission_earned
from public.requirements r
left join lateral (
  select sum(p.po_value) as revenue
  from public.purchase_orders p
  where p.requirement_id = r.id and p.status <> 'cancelled'
) po on true
left join lateral (
  select sum(c.commission_amount) as commission_earned
  from public.commission_invoices c
  join public.oem_invoices i on i.id = c.oem_invoice_id
  join public.purchase_orders p on p.id = i.purchase_order_id
  where p.requirement_id = r.id
) ci on true;
